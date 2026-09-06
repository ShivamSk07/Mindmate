import zlib from "zlib";
import {
  github_list_repositories,
  github_get_repository_tree,
  github_get_file,
  github_get_commits,
  github_get_issues,
  github_create_issue,
  github_create_pull_request,
} from "./github";
import {
  linkedin_get_profile,
  linkedin_create_post,
} from "./linkedin";
import { listMCPServers } from "./mcp";
import { searchWeb, SearchResult } from "./search";
import { getCerebrasClient, MODEL } from "./cerebras";
import { prisma } from "./db";
import { parseMentionedMCPServers } from "./mcpRegistry";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PlanStep {
  id: string;
  title: string;
  status: "completed" | "running" | "waiting" | "approval_required" | "failed";
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: "connect" | "tool_call" | "reasoning" | "approval_request" | "success" | "error";
  category?: "github" | "linkedin" | "mcp" | "browser" | "system";
  title: string;
  description: string;
  toolName?: string;
  query?: string;
  details?: any;
}

export interface PendingApproval {
  toolName: string;
  category: "github" | "linkedin" | "mcp" | "browser";
  params: any;
  title: string;
  description: string;
  targetResource: string;
}

export interface Artifact {
  id: string;
  title: string;
  type: "report" | "plan" | "linkedin_post" | "code_diff" | "review" | "visualization";
  content: string;
  createdAt: string;
}

export interface MessageItem {
  id: string;
  sender: "user" | "agent";
  content: string;
  timestamp: string;
}

export interface CoworkTask {
  id: string;
  userQuery: string;
  messages: MessageItem[];
  repoOwner: string;
  repoName: string;
  branch: string;
  status: "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
  usedTools: string[];
  plan: PlanStep[];
  activityFeed: ActivityItem[];
  pendingApproval: PendingApproval | null;
  report: string | null;
  codeDiff: string | null;
  artifacts: Artifact[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// In-memory task store
// ─────────────────────────────────────────────────────────────

const taskStore = new Map<string, CoworkTask>();

export function getTask(id: string): CoworkTask | null {
  return taskStore.get(id) || null;
}

export function getAllTasks(): CoworkTask[] {
  return Array.from(taskStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ts() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function addLog(
  task: CoworkTask,
  type: ActivityItem["type"],
  title: string,
  description: string,
  category: ActivityItem["category"] = "system",
  extra: Partial<ActivityItem> = {}
) {
  task.activityFeed.push({
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    timestamp: ts(),
    type,
    category,
    title,
    description,
    ...extra,
  });
  taskStore.set(task.id, task);
}

function setStep(task: CoworkTask, stepId: string, status: PlanStep["status"]) {
  const step = task.plan.find((s) => s.id === stepId);
  if (step) step.status = status;
  taskStore.set(task.id, task);
}

// ─────────────────────────────────────────────────────────────
export function detectToolRequirements(userQuery: string) {
  const q = userQuery.toLowerCase().trim();
  const mentionedMCPServers = parseMentionedMCPServers(userQuery);

  // GitHub keywords & intents
  const isGitHub =
    /\b(github|repo|repos|repository|repositories|commit|commits|pr|prs|pull request|branch|branches|codebase|clone|issue|issues|fork|readme)\b/i.test(q) ||
    q.includes("@github") ||
    /\b(first repo|oldest repo|my repo|my repositories|list repo|show repo|check repo)\b/i.test(q);

  // LinkedIn keywords & intents
  const isLinkedIn =
    /\b(linkedin|linkdin|linked in|linkedin post|post on linkedin|post to linkedin|share on linkedin|thought leadership|hiring post|connection note|professional update|linkedin profile)\b/i.test(q) ||
    q.includes("@linkedin");

  // MCP keywords
  const isMCP =
    /\b(mcp|model context protocol)\b/i.test(q) ||
    q.includes("@mcp") ||
    mentionedMCPServers.length > 0;

  // Explicit Web Search keywords
  const isExplicitWeb =
    /\b(search web|search the web|search google|search online|live search|latest news|news today|current news|web search|browse the web|look up on web|google search)\b/i.test(q) ||
    q.includes("@browser") ||
    q.includes("@web");

  const anyWorkspaceTool = isGitHub || isLinkedIn || isMCP;

  // Run web search ONLY IF explicitly requested OR if no workspace tools are matched
  const isWeb = isExplicitWeb || !anyWorkspaceTool;

  return {
    needsGitHub: isGitHub,
    needsLinkedIn: isLinkedIn,
    needsMCP: isMCP,
    needsBrowser: isWeb,
  };
}

export function isVisualizationQuery(query: string): boolean {
  const q = query.toLowerCase().trim();
  return (
    /\bvisu[a-z]*\b/i.test(q) ||
    /\bdi[a-z]{1,2}gr[a-z]*\b/i.test(q) ||
    /\bflow[- ]?chart\b/i.test(q) ||
    /\barchit[a-z]*\b/i.test(q) ||
    /\b(chart|graph|pathway|pathways|map|maps|relationships|connections)\b/i.test(q)
  );
}

// ─────────────────────────────────────────────────────────────
// Task creation
// ─────────────────────────────────────────────────────────────

export async function createAndRunTask(
  userQuery: string,
  preferredRepo?: string,
  preferredBranch = "main",
  isVisualization = false
): Promise<CoworkTask> {
  const isVis = isVisualization || isVisualizationQuery(userQuery);
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  let owner = "";
  let repo = "";

  // Extract repo from query (e.g. "repo zentro", "ShivamSk07/zentro")
  const repoMatch = userQuery.match(
    /(?:repo|repository)\s+(?:called\s+|named\s+)?([a-zA-Z0-9_\-\/]+)/i
  );
  if (repoMatch?.[1]) {
    const extracted = repoMatch[1].trim();
    if (extracted.includes("/")) {
      [owner, repo] = extracted.split("/");
    } else {
      repo = extracted;
    }
  } else if (preferredRepo && preferredRepo.trim()) {
    if (preferredRepo.includes("/")) {
      [owner, repo] = preferredRepo.split("/");
    } else {
      repo = preferredRepo;
    }
  }

  // Build dynamic plan steps strictly based on requested tools or visualization
  let initialPlan: PlanStep[] = [];

  if (isVis) {
    initialPlan = [
      { id: "step_init", title: "Analyzing request", status: "completed" },
      { id: "step_tree", title: "Scanning repository structure", status: "waiting" },
      { id: "step_files", title: "Retrieving relevant code files", status: "waiting" },
      { id: "step_mermaid", title: "Generating visual diagram", status: "waiting" },
      { id: "step_final", title: "Finalizing visualization", status: "waiting" },
    ];
  } else {
    const flags = detectToolRequirements(userQuery);

    initialPlan.push({ id: "step_init", title: "Analyzing request", status: "completed" });
    if (flags.needsGitHub) initialPlan.push({ id: "step_github", title: "GitHub Repositories", status: "waiting" });
    if (flags.needsLinkedIn) initialPlan.push({ id: "step_linkedin", title: "LinkedIn Network", status: "waiting" });
    if (flags.needsBrowser) initialPlan.push({ id: "step_browser", title: "Live Web Search", status: "waiting" });
    if (flags.needsMCP) initialPlan.push({ id: "step_mcp", title: "MCP Servers", status: "waiting" });
    initialPlan.push({ id: "step_final", title: "Writing response", status: "waiting" });
  }

  const initialTask: CoworkTask = {
    id: taskId,
    userQuery,
    messages: [
      {
        id: `msg_init_${Date.now()}`,
        sender: "user",
        content: userQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ],
    repoOwner: owner,
    repoName: repo,
    branch: preferredBranch,
    status: "running",
    usedTools: [],
    plan: initialPlan,
    activityFeed: [],
    pendingApproval: null,
    report: null,
    codeDiff: null,
    artifacts: [],
    createdAt: now,
    updatedAt: now,
  };

  taskStore.set(taskId, initialTask);

  // Run agent loop asynchronously
  if (isVis) {
    executeVisualizationLoop(taskId, owner, repo, preferredBranch).catch((err) => {
      console.error(`Visualization task ${taskId} failed:`, err);
      const t = taskStore.get(taskId);
      if (t) {
        t.status = "failed";
        addLog(t, "error", "Visualization failed", err.message || "Unexpected error");
        taskStore.set(taskId, t);
      }
    });
  } else {
    const flags = detectToolRequirements(userQuery);
    executeAgentLoop(taskId, flags).catch((err) => {
      console.error(`Task ${taskId} failed:`, err);
      const t = taskStore.get(taskId);
      if (t) {
        t.status = "failed";
        addLog(t, "error", "Execution failed", err.message || "Unexpected error");
        taskStore.set(taskId, t);
      }
    });
  }

  return initialTask;
}

// ─────────────────────────────────────────────────────────────
// Main agent execution loop
// ─────────────────────────────────────────────────────────────

async function executeAgentLoop(
  taskId: string,
  flags: {
    needsGitHub: boolean;
    needsLinkedIn: boolean;
    needsBrowser: boolean;
    needsMCP: boolean;
  }
) {
  const task = taskStore.get(taskId);
  if (!task) return;

  const queryLower = task.userQuery.toLowerCase();
  let owner = task.repoOwner;
  const branch = task.branch;
  let repo = task.repoName;

  // Fetch tokens from DB
  let linkedinAccessToken: string | null = null;
  let linkedinPersonUrn: string | null = null;
  let linkedinName: string = "LinkedIn User";
  let githubAccessToken: string | null = null;
  let githubUsername: string = owner;

  try {
    const liProfile = await (prisma as any).userProfile.findFirst({
      where: { linkedinConnected: true },
      select: { linkedinToken: true, linkedinPersonUrn: true, linkedinName: true },
    });
    linkedinAccessToken = liProfile?.linkedinToken || null;
    linkedinPersonUrn = liProfile?.linkedinPersonUrn || null;
    if (liProfile?.linkedinName) linkedinName = liProfile.linkedinName;
  } catch {}

  try {
    const ghProfile = await (prisma as any).userProfile.findFirst({
      where: { githubConnected: true },
      select: { githubToken: true, githubUsername: true },
    });
    githubAccessToken = ghProfile?.githubToken || null;
    if (ghProfile?.githubUsername) githubUsername = ghProfile.githubUsername;
    if (!owner) owner = githubUsername;
  } catch {}

  let linkedinText = "";
  let githubText = "";
  let webText = "";

  // ── WEB SEARCH (Only when requested) ─────────────────────────
  if (flags.needsBrowser) {
    setStep(task, "step_browser", "running");
    addLog(task, "tool_call", "Searching the web", `"${task.userQuery.slice(0, 60)}"`, "browser", { toolName: "searchWeb" });
    await delay(30);

    try {
      const results = await searchWeb(task.userQuery, 5);
      if (results?.length) {
        webText =
          results
            .map((r: SearchResult, i: number) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
            .join("\n\n");
        addLog(task, "success", `Found ${results.length} sources`, results.slice(0, 2).map((r: SearchResult) => r.title).join(", "), "browser");
        task.usedTools.push("searchWeb");
      }
    } catch (e: any) {
      addLog(task, "error", "Web search failed", e.message || "No results", "browser");
    }

    setStep(task, "step_browser", "completed");
    await delay(30);
  }

  // ── LINKEDIN ────────────────────────────────────────────────
  if (flags.needsLinkedIn) {
    setStep(task, "step_linkedin", "running");
    addLog(task, "tool_call", "Connecting to LinkedIn", `@${linkedinName}`, "linkedin", { toolName: "linkedin_get_profile" });
    await delay(30);

    if (linkedinAccessToken) {
      try {
        const profile = await linkedin_get_profile(linkedinAccessToken);
        if (profile) {
          linkedinPersonUrn = profile.personUrn || linkedinPersonUrn;
          linkedinName = profile.name || linkedinName;
          task.usedTools.push("linkedin_get_profile");
          addLog(task, "success", `Authenticated as ${linkedinName}`, `Person URN: ${linkedinPersonUrn}`, "linkedin");
          linkedinText = `LinkedIn Authenticated Profile:
Name: ${profile.name}
Email: ${profile.email || "N/A"}
Person URN: ${profile.personUrn}
Status: Active & Authorized for Social Sharing`;
        } else {
          addLog(task, "reasoning", "Profile session cached", `Using profile @${linkedinName}`, "linkedin");
          linkedinText = `LinkedIn Profile: @${linkedinName} (Connected)`;
        }
      } catch (e: any) {
        addLog(task, "error", "LinkedIn profile check failed", e.message, "linkedin");
      }
    } else {
      addLog(task, "reasoning", "LinkedIn not connected", "Drafting post locally. Connect LinkedIn in Integrations for 1-click publishing.", "linkedin");
      linkedinText = `LinkedIn Account Status: Not connected (Simulated/Draft Mode).`;
    }

    // Check if user specifically requested publishing a post
    const isPostPublishRequest =
      /\b(post|publish|share|send post|drop post|make post)\b/i.test(queryLower) &&
      !queryLower.includes("don't post") &&
      !queryLower.includes("just draft");

    if (isPostPublishRequest) {
      // Generate the drafted post commentary first
      let draftedPostText = "";
      try {
        const client = getCerebrasClient();
        const draftPrompt = `You are an elite LinkedIn content creator and ghostwriter.
Generate a high-converting, professional, engaging LinkedIn post for the following topic:
"${task.userQuery}"

Rules:
- Include a strong 1-2 line hook to capture attention.
- Use clean spacing, line breaks, bullet points, and 2-3 relevant emojis.
- Include 3-5 relevant hashtags at the bottom (e.g. #AI #Innovation #Productivity).
- Keep tone confident, thought-provoking, and professional.
- Return ONLY the final ready-to-publish post text.`;

        const draftComp = (await client.chat.completions.create({
          model: MODEL,
          messages: [{ role: "user", content: draftPrompt }],
          temperature: 0.3,
          max_tokens: 1000,
        })) as any;

        draftedPostText = draftComp.choices[0]?.message?.content?.trim() || "";
      } catch (err) {
        draftedPostText = `Excited to share our latest updates!\n\n${task.userQuery}\n\n#Growth #Tech #Innovation`;
      }

      // Trigger Human-in-the-loop Approval for LinkedIn Post
      setStep(task, "step_final", "approval_required");
      task.status = "waiting_approval";
      task.pendingApproval = {
        toolName: "linkedin_create_post",
        category: "linkedin",
        title: "Publish to LinkedIn",
        description: `Publish this drafted update to your LinkedIn profile (${linkedinName}).`,
        targetResource: `LinkedIn @${linkedinName}`,
        params: {
          authorUrn: linkedinPersonUrn || "me",
          postText: draftedPostText,
        },
      };

      addLog(task, "approval_request", "Approval required", "Review drafted post before live publishing to LinkedIn", "linkedin", {
        toolName: "linkedin_create_post",
        details: task.pendingApproval,
      });

      // Also create a drafted artifact for the user to view immediately
      task.artifacts.push({
        id: `art_li_${Date.now()}`,
        title: "LinkedIn Post Draft",
        type: "linkedin_post",
        content: draftedPostText,
        createdAt: ts(),
      });

      taskStore.set(taskId, task);
      return;
    }

    setStep(task, "step_linkedin", "completed");
    await delay(30);
  }

  // ── GITHUB ──────────────────────────────────────────────────
  if (flags.needsGitHub) {
    setStep(task, "step_github", "running");
    const effectiveOwner = githubUsername || owner || "ShivamSk07";

    try {
      addLog(task, "tool_call", "Listing repositories", `@${effectiveOwner}`, "github", { toolName: "github_list_repositories" });
      await delay(30);

      const repos = await github_list_repositories(effectiveOwner, githubAccessToken);
      task.usedTools.push("github_list_repositories");

      let resolvedOwner = effectiveOwner;
      let resolvedRepo = repo;

      if (repos.length > 0) {
        const sortedByCreated = [...repos].sort((a, b) => {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tA - tB;
        });
        const firstCreatedRepo = sortedByCreated[0];

        const sortedByUpdated = [...repos].sort((a, b) => {
          const tA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const tB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return tB - tA;
        });
        const latestUpdatedRepo = sortedByUpdated[0];

        let matched = repo
          ? repos.find((r) => r.name.toLowerCase() === repo.toLowerCase()) || repos[0]
          : (queryLower.includes("first repo") || queryLower.includes("oldest repo"))
          ? firstCreatedRepo
          : repos[0];

        resolvedOwner = matched.full_name.split("/")[0];
        resolvedRepo = matched.name;

        addLog(task, "success", `${repos.length} repo${repos.length > 1 ? "s" : ""} found`, `First: ${firstCreatedRepo?.name || matched.name}`, "github");
        await delay(30);

        const isSpecificCodeInspection = 
          queryLower.includes("file") || queryLower.includes("code") ||
          queryLower.includes("commit") || queryLower.includes("audit") ||
          queryLower.includes("issue") || queryLower.includes("tree") ||
          queryLower.includes("readme") || Boolean(repo);

        let treeText = "";
        let commitText = "";
        let issuesText = "";

        if (isSpecificCodeInspection) {
          // File tree
          try {
            const tree = await github_get_repository_tree(resolvedOwner, resolvedRepo, branch, githubAccessToken);
            task.usedTools.push("github_get_repository_tree");
            treeText = `Files scanned (${tree.length}):\n` + tree.slice(0, 15).map(f => `• ${f.path}`).join("\n");
            addLog(task, "success", `${tree.length} files scanned`, `${resolvedOwner}/${resolvedRepo}`, "github");
          } catch {}

          // Commits
          try {
            const commits = await github_get_commits(resolvedOwner, resolvedRepo, githubAccessToken);
            task.usedTools.push("github_get_commits");
            commitText = `Recent commits (${commits.length}):\n` + commits.slice(0, 5).map(c => `• ${c.commit.message.split("\n")[0]} (${c.commit.author.name})`).join("\n");
          } catch {}

          // Issues
          try {
            const issues = await github_get_issues(resolvedOwner, resolvedRepo, githubAccessToken);
            task.usedTools.push("github_get_issues");
            issuesText = `Open issues (${issues.length}):\n` + issues.slice(0, 5).map(i => `• #${i.number}: ${i.title} [${i.state}]`).join("\n");
          } catch {}
        }

        const repoListDetails = repos.map((r, idx) => 
          `${idx + 1}. **${r.name}** (${r.full_name})
   - Primary Language: ${r.language || "N/A"}
   - Visibility: ${r.private ? "Private" : "Public"}
   - Stars: ⭐ ${r.stargazers_count} | Forks: 🍴 ${r.forks_count} | Issues: ⚠️ ${r.open_issues_count}
   - Created: ${r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A"}
   - Last Updated: ${r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "N/A"}
   - URL: ${r.html_url}
   - Description: ${r.description || "No description"}`
        ).join("\n\n");

        githubText = `GitHub Account @${resolvedOwner} Overview:
Total Repositories Found: ${repos.length}
• Earliest / First Created Repository: ${firstCreatedRepo?.name} (Created: ${firstCreatedRepo?.created_at ? new Date(firstCreatedRepo.created_at).toLocaleString() : "N/A"})
• Most Recently Updated Repository: ${latestUpdatedRepo?.name} (Updated: ${latestUpdatedRepo?.updated_at ? new Date(latestUpdatedRepo.updated_at).toLocaleString() : "N/A"})

Active Selected Repository: ${resolvedOwner}/${resolvedRepo}
${treeText ? `\n${treeText}\n` : ""}
${commitText ? `\n${commitText}\n` : ""}
${issuesText ? `\n${issuesText}\n` : ""}

All Repositories for @${resolvedOwner}:
${repoListDetails}`;

      } else {
        addLog(task, "reasoning", "No repositories found", `No public repos for @${effectiveOwner}`, "github");
        githubText = `GitHub @${effectiveOwner}: no repositories found.`;
      }
    } catch (e: any) {
      addLog(task, "error", "GitHub access failed", e.message || "Check GitHub connection", "github");
      githubText = `GitHub: access failed — ${e.message}`;
    }

    setStep(task, "step_github", "completed");
    await delay(30);
  }

  // ── HUMAN APPROVAL CHECK FOR GITHUB ACTIONS ──────────────────
  const isCreateIssue = queryLower.includes("create issue") || queryLower.includes("open issue");

  if (isCreateIssue) {
    const toolName = "github_create_issue";
    const cat = "github";
    const titleText = "Create GitHub issue";
    const descText = `Open a new issue on ${owner}/${repo}.`;
    const params = { owner, repo, title: task.userQuery.slice(0, 60), body: "" };

    setStep(task, "step_final", "approval_required");
    task.status = "waiting_approval";
    task.pendingApproval = {
      toolName,
      category: cat,
      title: titleText,
      description: descText,
      targetResource: `${owner}/${repo}`,
      params,
    };

    addLog(task, "approval_request", "Approval required", descText, cat, { toolName, details: task.pendingApproval });
    taskStore.set(taskId, task);
    return;
  }

  // ── FINALIZE ─────────────────────────────────────────────────
  await finalizeReport(task, {
    owner,
    repo,
    linkedinText,
    githubText,
    webText,
  });
}

// ─────────────────────────────────────────────────────────────
// Finalize: call LLM and produce artifacts
// ─────────────────────────────────────────────────────────────

async function finalizeReport(
  task: CoworkTask,
  ctx: {
    owner: string;
    repo: string;
    linkedinText: string;
    githubText: string;
    webText: string;
    writeActionResult?: string;
  }
) {
  setStep(task, "step_final", "running");
  addLog(task, "reasoning", "Writing response", "Synthesizing gathered data", "system");
  await delay(200);

  const contextParts: string[] = [];
  if (ctx.webText) contextParts.push(`WEB:\n${ctx.webText}`);
  if (ctx.linkedinText) contextParts.push(`LINKEDIN:\n${ctx.linkedinText}`);
  if (ctx.githubText) contextParts.push(`GITHUB:\n${ctx.githubText}`);
  if (ctx.writeActionResult) contextParts.push(`ACTION RESULT:\n${ctx.writeActionResult}`);

  const sysPrompt = `You are Clarity, an autonomous AI workspace agent specializing in GitHub codebase analysis, LinkedIn content & social growth automation, and live intelligence.
Answer the user's request directly and clearly using the retrieved data below.
Format the response with clean markdown: use headers, bullet lists, code blocks or quotes where relevant.
Be specific, factual, engaging, and concise. Do not use filler phrases.
If real data was retrieved, reference it directly (repo names, LinkedIn author URN, etc.).

CRITICAL FORMATTING RULES:
- STRICT PROHIBITION: NEVER output ASCII art diagrams, text boxes, ascii arrows (+---+, | |, -->), or unicode box-drawing diagrams (┌───┐, │ │, └───┘).
- When explaining architecture, workflows, sequence diagrams, flowcharts, data flows, or relationship maps, ALWAYS output valid Mermaid syntax inside a \`\`\`mermaid code block.
- Our frontend UI automatically compiles and renders \`\`\`mermaid code blocks into interactive live SVG diagrams in real-time.`;

  const userPrompt = `Request: "${task.userQuery}"

Data:
${contextParts.join("\n\n")}

Respond directly and clearly.`;

  let reportText = "";
  try {
    const client = getCerebrasClient();
    const completion = (await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.15,
      max_tokens: 2500,
    })) as any;
    const choice = completion.choices[0]?.message;
    reportText = choice?.content?.trim() || choice?.reasoning?.trim() || "";
  } catch (e) {
    reportText = contextParts.length > 0
      ? contextParts.join("\n\n---\n\n")
      : `No data was retrieved. Make sure your integrations (GitHub, LinkedIn) are connected.`;
  }

  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const artifacts: Artifact[] = task.artifacts || [];

  if (!artifacts.some((a) => a.type === "report" || a.type === "linkedin_post")) {
    artifacts.unshift({
      id: `art_main_${Date.now()}`,
      title: task.userQuery.slice(0, 50),
      type: "report",
      content: reportText,
      createdAt: nowStr,
    });
  }

  task.artifacts = artifacts;
  task.report = reportText;
  task.status = "completed";
  task.plan.forEach((s) => { if (s.status !== "failed") s.status = "completed"; });
  task.updatedAt = new Date().toISOString();

  addLog(task, "success", "Done", `${artifacts.length} artifact(s) generated`, "system");
  taskStore.set(task.id, task);
}

// ─────────────────────────────────────────────────────────────
// Approve / Cancel / Follow-up
// ─────────────────────────────────────────────────────────────

export async function approvePendingTask(taskId: string): Promise<CoworkTask> {
  const task = taskStore.get(taskId);
  if (!task || task.status !== "waiting_approval" || !task.pendingApproval) {
    throw new Error("Task is not waiting for approval");
  }

  const { toolName, category, params } = task.pendingApproval;
  addLog(task, "success", "Action approved", `Executing ${toolName}`, category);

  let resultInfo = "";
  try {
    if (toolName === "linkedin_create_post") {
      let liToken: string | null = null;
      let liUrn: string | null = params.authorUrn;

      try {
        const liProfile = await (prisma as any).userProfile.findFirst({
          where: { linkedinConnected: true },
          select: { linkedinToken: true, linkedinPersonUrn: true },
        });
        liToken = liProfile?.linkedinToken || null;
        if (liProfile?.linkedinPersonUrn) liUrn = liProfile.linkedinPersonUrn;
      } catch {}

      if (liToken) {
        const postRes = await linkedin_create_post(liToken, liUrn || "me", params.postText);
        if (postRes.success) {
          resultInfo = `🚀 Post successfully published to LinkedIn! (ID: ${postRes.postId || "Live"})`;
        } else {
          resultInfo = `⚠️ Post publication failed: ${postRes.error || "LinkedIn API error"}`;
        }
      } else {
        resultInfo = `🚀 Post simulated and marked published (Connect real LinkedIn in Integrations to send live API request).`;
      }
    } else if (toolName === "github_create_issue") {
      let ghToken: string | null = null;
      try {
        const ghProfile = await (prisma as any).userProfile.findFirst({
          where: { githubConnected: true },
          select: { githubToken: true },
        });
        ghToken = ghProfile?.githubToken || null;
      } catch {}

      const res = await github_create_issue(params.owner, params.repo, params.title, params.body, ghToken);
      resultInfo = `Issue #${res.number} created on ${params.owner}/${params.repo}`;
    }
  } catch (e: any) {
    resultInfo = `Action failed: ${e.message}`;
  }

  addLog(task, "success", "Action completed", resultInfo, category);
  task.pendingApproval = null;
  task.status = "running";
  taskStore.set(taskId, task);

  await finalizeReport(task, {
    owner: task.repoOwner,
    repo: task.repoName,
    linkedinText: `Live Action Result:\n${resultInfo}\n\nPublished Content:\n${params.postText || ""}`,
    githubText: "",
    webText: "",
    writeActionResult: resultInfo,
  });

  return task;
}

export async function cancelPendingTask(taskId: string): Promise<CoworkTask> {
  const task = taskStore.get(taskId);
  if (!task) throw new Error("Task not found");

  task.status = "cancelled";
  task.pendingApproval = null;
  addLog(task, "error", "Cancelled", "Execution stopped by user", "system");
  taskStore.set(taskId, task);
  return task;
}

export async function continueTaskWithFollowup(
  taskId: string,
  followupQuery: string
): Promise<CoworkTask> {
  const task = taskStore.get(taskId);
  if (!task) throw new Error("Task not found");

  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!task.messages) task.messages = [];
  task.messages.push({
    id: `msg_${Date.now()}`,
    sender: "user",
    content: followupQuery,
    timestamp: timeStr,
  });

  task.status = "running";
  addLog(task, "reasoning", "Follow-up received", followupQuery.slice(0, 80), "system");
  taskStore.set(taskId, task);

  (async () => {
    try {
      const client = getCerebrasClient();

      // Check if this is a visualization task
      const visArtifact = task.artifacts.find((a) => a.type === "visualization");
      if (visArtifact) {
        const prevMermaid = visArtifact.content;

        const visSysPrompt = `You are an expert software visualization engine.
The user is following up on a previously generated Mermaid diagram and wants to modify it.
Here is the previous Mermaid diagram:
${prevMermaid}

Analyze the user's follow-up request and return the updated valid Mermaid source code.

Rules:
- Return ONLY valid Mermaid source code.
- Do not return explanations.
- Do not use markdown code fences.
- Do not generate ASCII art.`;

        const visUserPrompt = `Follow-up request: "${followupQuery}"
Generate the updated Mermaid diagram now:`;

        const completion = (await client.chat.completions.create({
          model: MODEL,
          messages: [
            { role: "system", content: visSysPrompt },
            { role: "user", content: visUserPrompt },
          ],
          temperature: 0.15,
          max_tokens: 2000,
        })) as any;

        let newMermaid = completion.choices[0]?.message?.content?.trim() || "";
        newMermaid = sanitizeMermaid(newMermaid);
        const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        task.messages.push({
          id: `msg_ai_${Date.now()}`,
          sender: "agent",
          content: `Diagram updated successfully.\n\`\`\`diagram\n${newMermaid}\n\`\`\`\n`,
          timestamp: replyTime,
        });

        task.artifacts.unshift({
          id: `art_vis_${Date.now()}`,
          title: followupQuery.slice(0, 40),
          type: "visualization",
          content: newMermaid,
          createdAt: replyTime,
        });

        task.report = `### Codebase Visualization (Updated)
The following diagram represents your codebase for the updated query: *"${followupQuery}"*

\`\`\`mermaid
${newMermaid}
\`\`\`
`;
        task.status = "completed";
        addLog(task, "success", "Visualization updated", "New SVG generated.", "system");
        task.updatedAt = new Date().toISOString();
        taskStore.set(taskId, task);
        return;
      }

      const prevContext = (task.artifacts || [])
        .map((a) => `[${a.title}]\n${a.content}`)
        .join("\n\n");

      const completion = (await client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are Clarity, an AI workspace agent. The user is following up on a completed task. 
Use the existing artifacts as context. Answer directly and specifically.`,
          },
          {
            role: "user",
            content: `Original goal: "${task.userQuery}"\n\nContext:\n${prevContext}\n\nFollow-up: "${followupQuery}"`,
          },
        ],
        temperature: 0.15,
        max_tokens: 1500,
      })) as any;

      const choice = completion.choices[0]?.message;
      const reply = choice?.content?.trim() || choice?.reasoning?.trim() || "Follow-up processed.";
      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      task.messages.push({
        id: `msg_ai_${Date.now()}`,
        sender: "agent",
        content: reply,
        timestamp: replyTime,
      });

      task.artifacts.unshift({
        id: `art_followup_${Date.now()}`,
        title: followupQuery.slice(0, 40),
        type: "report",
        content: reply,
        createdAt: replyTime,
      });

      task.report = reply;
      task.status = "completed";
      addLog(task, "success", "Follow-up done", "", "system");
      task.updatedAt = new Date().toISOString();
      taskStore.set(taskId, task);
    } catch (err: any) {
      task.status = "failed";
      taskStore.set(taskId, task);
    }
  })();

  return task;
}

// ─────────────────────────────────────────────────────────────
// Codebase Visualizer Core Engine
// ─────────────────────────────────────────────────────────────

export function sanitizeMermaid(code: string): string {
  if (!code) return "";
  let clean = code.trim();

  // 1. Strip markdown fences and language tags
  clean = clean.replace(/^```[a-zA-Z0-9_-]*\n?/i, "").replace(/\n?```$/i, "").trim();

  // 2. Remove HTML tags (<br/>, <b>, etc.)
  clean = clean.replace(/<br\s*\/?>/gi, " ");
  clean = clean.replace(/<[^>]+>/g, "");

  // 3. Normalize quotes, dashes, spaces
  clean = clean
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, " ");

  // 4. Fix arrows
  clean = clean.replace(/--\s+>/g, "-->").replace(/==\s+>/g, "==>").replace(/\.-\s+>/g, ".->");

  // 5. Fix pipe labels (|...|) - strip double quotes and HTML inside pipes
  clean = clean.replace(/\|([^|\n\r]+)\|/g, (_, label) => {
    const safeLabel = label.replace(/["<>]/g, "").trim();
    return `|${safeLabel}|`;
  });

  // 6. Clean node definitions line by line
  const lines = clean.split("\n");
  const processedLines = lines.map((line) => {
    let l = line;
    const trimmed = l.trim();

    if (
      trimmed.startsWith("%%") ||
      trimmed.startsWith("classDef") ||
      trimmed.startsWith("class ") ||
      trimmed.startsWith("style ")
    ) {
      return l;
    }

    l = l.replace(/([a-zA-Z0-9_-]+)\[\(\s*(?!"|\()([^\]\r\n]*?)\s*\)\]/g, (_, id, text) => {
      return `${id}[("${text.replace(/["\\]/g, "'").trim()}")]`;
    });

    l = l.replace(/([a-zA-Z0-9_-]+)\(\[\s*(?!"|\()([^\]\r\n]*?)\s*\]\)/g, (_, id, text) => {
      return `${id}(["${text.replace(/["\\]/g, "'").trim()}"])`;
    });

    l = l.replace(/([a-zA-Z0-9_-]+)\[\[\s*(?!"|\[)([^\]\r\n]*?)\s*\]\]/g, (_, id, text) => {
      return `${id}[["${text.replace(/["\\]/g, "'").trim()}"]]`;
    });

    l = l.replace(/([a-zA-Z0-9_-]+)\(\(\s*(?!"|\()([^)\r\n]*?)\s*\)\)/g, (_, id, text) => {
      return `${id}(("${text.replace(/["\\]/g, "'").trim()}"))`;
    });

    l = l.replace(/([a-zA-Z0-9_-]+)\{\{\s*(?!"|\{)([^}\r\n]*?)\s*\}\}/g, (_, id, text) => {
      return `${id}{{"${text.replace(/["\\]/g, "'").trim()}"}}`;
    });

    l = l.replace(/([a-zA-Z0-9_-]+)\{\s*(?!"|\{)([^}\r\n]*?)\s*\}/g, (_, id, text) => {
      return `${id}{"${text.replace(/["\\]/g, "'").trim()}"}`;
    });

    l = l.replace(/([a-zA-Z0-9_-]+)\[\s*(?!"|\[|\()([^\]\r\n]*?)\s*\]/g, (_, id, text) => {
      if (text.startsWith('"') && text.endsWith('"')) {
        return `${id}[${text}]`;
      }
      return `${id}["${text.replace(/["\\]/g, "'").trim()}"]`;
    });

    return l;
  });

  clean = processedLines.join("\n");

  const strippedComments = clean.replace(/^%%[^\n]*\n?/gm, "").trim();
  const hasHeader =
    /^(flowchart|graph|sequenceDiagram|gantt|classDiagram|stateDiagram(?:-v2)?|erDiagram|pie|gitGraph|journey|timeline|mindmap|quadrantChart|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/im.test(
      strippedComments
    );
  if (!hasHeader) clean = `flowchart TD\n  ${clean}`;

  return clean;
}

export function getMermaidInkUrls(mermaidCode: string): { svgUrl: string; pngUrl: string } {
  try {
    const clean = sanitizeMermaid(mermaidCode);
    const obj = {
      code: clean,
      mermaid: { theme: "dark" }
    };
    const b64 = Buffer.from(JSON.stringify(obj)).toString("base64");
    return {
      svgUrl: `https://mermaid.ink/svg/${b64}`,
      pngUrl: `https://mermaid.ink/img/${b64}`,
    };
  } catch {
    return { svgUrl: "", pngUrl: "" };
  }
}

export function getKrokiUrl(mermaidCode: string): string {
  try {
    const clean = sanitizeMermaid(mermaidCode);
    const buffer = Buffer.from(clean, "utf-8");
    const compressed = zlib.deflateSync(buffer, { level: 9 });
    const base64 = compressed.toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return `https://kroki.io/mermaid/svg/${base64}`;
  } catch {
    return "";
  }
}

async function executeVisualizationLoop(
  taskId: string,
  preferredOwner: string,
  preferredRepo: string,
  branch = "main"
) {
  const task = taskStore.get(taskId);
  if (!task) return;

  let owner = preferredOwner;
  let repo = preferredRepo;

  let githubAccessToken: string | null = null;
  let githubUsername: string = owner;

  try {
    const ghProfile = await (prisma as any).userProfile.findFirst({
      where: { githubConnected: true },
      select: { githubToken: true, githubUsername: true },
    });
    githubAccessToken = ghProfile?.githubToken || null;
    if (ghProfile?.githubUsername) githubUsername = ghProfile.githubUsername;
    if (!owner) owner = githubUsername;
  } catch {}

  if (!githubAccessToken) {
    setStep(task, "step_tree", "failed");
    task.status = "failed";
    addLog(task, "error", "GitHub Access Failed", "GitHub account is not connected.", "github");
    taskStore.set(task.id, task);
    return;
  }

  if (!repo) {
    try {
      addLog(task, "tool_call", "Listing repositories", "Fetching list to identify default repo", "github", { toolName: "github_list_repositories" });
      const repos = await github_list_repositories(owner || undefined, githubAccessToken);
      if (repos.length > 0) {
        repo = repos[0].name;
        owner = repos[0].full_name.split("/")[0];
        task.repoOwner = owner;
        task.repoName = repo;
        taskStore.set(task.id, task);
        addLog(task, "success", `Default repo selected: ${owner}/${repo}`, "", "github");
      } else {
        throw new Error("No repositories found in your account.");
      }
    } catch (e: any) {
      setStep(task, "step_tree", "failed");
      task.status = "failed";
      addLog(task, "error", "Failed to select repository", e.message, "github");
      taskStore.set(task.id, task);
      return;
    }
  }

  // 1. Scan codebase tree
  setStep(task, "step_tree", "running");
  addLog(task, "tool_call", "Scanning codebase tree", `Listing files in ${owner}/${repo}`, "github", { toolName: "github_get_repository_tree" });
  await delay(100);

  let tree: any[] = [];
  try {
    tree = await github_get_repository_tree(owner, repo, branch, githubAccessToken);
    addLog(task, "success", `Scanned ${tree.length} tree items`, `Successfully retrieved file hierarchy.`, "github");
    setStep(task, "step_tree", "completed");
  } catch (e: any) {
    setStep(task, "step_tree", "failed");
    task.status = "failed";
    addLog(task, "error", "Codebase scan failed", e.message, "github");
    taskStore.set(task.id, task);
    return;
  }

  // 2. Planning: Choose relevant files based on user query
  setStep(task, "step_files", "running");
  addLog(task, "reasoning", "Analyzing visualization context", `Determining which files are relevant to "${task.userQuery.slice(0, 50)}"...`, "system");
  await delay(100);

  const filesList = tree.filter(f => 
    f.type === "blob" &&
    !f.path.includes("node_modules/") &&
    !f.path.includes(".git/") &&
    !f.path.includes("dist/") &&
    !f.path.includes("build/") &&
    !f.path.includes(".next/") &&
    !f.path.includes(".vscode/") &&
    !f.path.includes("package-lock.json") &&
    !f.path.includes("yarn.lock") &&
    !f.path.includes("pnpm-lock.yaml") &&
    !/\.(png|jpg|jpeg|gif|ico|svg|webp|woff2?|eot|ttf|pdf|mp3|mp4|zip|tar|gz)$/i.test(f.path)
  );

  const filePaths = filesList.map(f => f.path).slice(0, 400);

  const selectPrompt = `You are a software architecture and visualization assistant.
The user wants to generate a visual diagram for the codebase:
USER REQUEST: "${task.userQuery}"

Here is the file list of the repository (${owner}/${repo}):
${filePaths.map(p => `- ${p}`).join("\n")}

Identify up to 15 files from the list above that are most relevant to inspect to understand and build a visual diagram for the user's request.
Return ONLY a valid JSON array of file paths. Example:
["src/routes/auth.js", "src/controllers/authController.ts"]

Do not return markdown formatting, code blocks, or explanations.`;

  let selectedPaths: string[] = [];
  try {
    const client = getCerebrasClient();
    const completion = (await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: selectPrompt }],
      temperature: 0.1,
      max_tokens: 600,
    })) as any;

    let content = completion.choices[0]?.message?.content?.trim() || "";
    if (content.startsWith("```")) {
      content = content.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    selectedPaths = JSON.parse(content);
    addLog(task, "success", `Selected ${selectedPaths.length} relevant files`, selectedPaths.join(", "), "system");
  } catch (e: any) {
    console.error("Failed to parse LLM file selection JSON:", e);
    const qLower = task.userQuery.toLowerCase();
    selectedPaths = filePaths.filter(p => {
      const pLower = p.toLowerCase();
      if (qLower.includes("auth") || qLower.includes("login") || qLower.includes("sign")) {
        return pLower.includes("auth") || pLower.includes("login") || pLower.includes("user") || pLower.includes("session") || pLower.includes("middleware");
      }
      if (qLower.includes("db") || qLower.includes("database") || qLower.includes("schema") || qLower.includes("relation")) {
        return pLower.includes("schema") || pLower.includes("model") || pLower.includes("prisma") || pLower.includes("db");
      }
      return pLower.includes("route") || pLower.includes("controller") || pLower.includes("index") || pLower.includes("app") || pLower.includes("server");
    }).slice(0, 10);

    if (selectedPaths.length === 0) {
      selectedPaths = filePaths.slice(0, 8);
    }
    addLog(task, "reasoning", `Heuristics fallback: selected ${selectedPaths.length} files`, selectedPaths.join(", "), "system");
  }

  // Fetch file contents
  const fetchedFiles: Array<{ path: string; content: string }> = [];
  for (const path of selectedPaths) {
    try {
      addLog(task, "tool_call", `Fetching file`, path, "github", { toolName: "github_get_file" });
      const f = await github_get_file(owner, repo, path, branch, githubAccessToken);
      fetchedFiles.push({ path, content: f.content });
    } catch (err) {
      console.warn(`Failed to fetch file content for ${path}:`, err);
    }
  }

  if (fetchedFiles.length === 0) {
    setStep(task, "step_files", "failed");
    task.status = "failed";
    addLog(task, "error", "Retrieval failed", "No relevant file contents could be retrieved from GitHub.", "github");
    taskStore.set(task.id, task);
    return;
  }

  addLog(task, "success", `Retrieved ${fetchedFiles.length} file contents`, "", "github");
  setStep(task, "step_files", "completed");

  // 3. Generating visual diagram
  setStep(task, "step_mermaid", "running");
  addLog(task, "reasoning", "Generating visual diagram", "Analyzing code structure and relationships...", "system");
  await delay(100);

  let codeEvidence = "";
  for (const file of fetchedFiles) {
    codeEvidence += `\n\n--- FILE: ${file.path} ---\n${file.content.slice(0, 8000)}\n`;
  }

  const sysPrompt = `You are an expert software visualization engine.
The user has requested the following visual representation:
USER REQUEST:
${task.userQuery}

Analyze the provided GitHub repository evidence and create the most appropriate visual diagram.

Rules:
- Use only evidence from the provided GitHub/repository data.
- Do not invent components, files, services, APIs, databases, or relationships.
- Keep the diagram focused on the user's actual question.
- Do not include unnecessary repository details.
- Prefer a clear and understandable diagram over a large complex diagram.
- Use meaningful human-readable labels.
- ALWAYS wrap node label text inside double quotes, e.g. A["User (Browser)"] or B["Views (views.py)"].
- NEVER use double quotes inside arrow pipe labels |...|. Use single quotes or clean text, e.g. -->|Depends('get_db')| or -->|Step 1|.
- Use the most suitable Mermaid diagram type.
- Return ONLY valid Mermaid source code.
- Do not return explanations.
- Do not use markdown code fences.
- Do not generate ASCII art.`;

  const userPrompt = `### CONNECTED REPOSITORY CONTEXT:
Repository: ${owner}/${repo}
Default Branch: ${branch}

### RELEVANT CODE EVIDENCE:
${codeEvidence}

### USER REQUEST:
"${task.userQuery}"

Generate the diagram now:`;

  let mermaidCode = "";
  try {
    const client = getCerebrasClient();
    const completion = (await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.15,
      max_tokens: 2000,
    })) as any;

    mermaidCode = completion.choices[0]?.message?.content?.trim() || "";
    mermaidCode = sanitizeMermaid(mermaidCode);

    addLog(task, "success", "Visual diagram generated", "", "system");
    setStep(task, "step_mermaid", "completed");
  } catch (e: any) {
    setStep(task, "step_mermaid", "failed");
    task.status = "failed";
    addLog(task, "error", "Diagram generation failed", e.message || "Failed to generate diagram", "system");
    taskStore.set(task.id, task);
    return;
  }

  // 4. Finalizing
  setStep(task, "step_final", "running");
  addLog(task, "reasoning", "Finalizing diagram layout", "Validating and preparing diagram URL", "system");
  await delay(100);

  const artifacts: Artifact[] = [{
    id: `art_vis_${Date.now()}`,
    title: task.userQuery.slice(0, 50) || "Codebase Visualization",
    type: "visualization",
    content: mermaidCode,
    createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }];

  task.artifacts = artifacts;
  task.report = `### Codebase Visualization
The following diagram represents your codebase for the query: *"${task.userQuery}"*

\`\`\`mermaid
${mermaidCode}
\`\`\`
`;
  task.status = "completed";
  task.plan.forEach(s => { if (s.status !== "failed") s.status = "completed"; });
  task.updatedAt = new Date().toISOString();

  addLog(task, "success", "Visualization completed successfully", "Interactive SVG ready in Canvas.", "system");
  taskStore.set(task.id, task);
}

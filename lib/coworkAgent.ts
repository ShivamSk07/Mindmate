import {
  github_list_repositories,
  github_get_repository_tree,
  github_get_commits,
  github_get_issues,
  github_create_issue,
  github_create_pull_request,
} from "./github";
import {
  drive_search_files,
  drive_get_file_content,
  calendar_list_events,
  calendar_find_free_time,
  calendar_create_event,
  gmail_search,
  gmail_create_draft,
  gmail_send,
  sheets_read,
  sheets_write,
} from "./google";
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
  category?: "github" | "drive" | "calendar" | "gmail" | "sheets" | "mcp" | "browser" | "system";
  title: string;
  description: string;
  toolName?: string;
  query?: string;
  details?: any;
}

export interface PendingApproval {
  toolName: string;
  category: "github" | "drive" | "calendar" | "gmail" | "sheets" | "mcp" | "browser";
  params: any;
  title: string;
  description: string;
  targetResource: string;
}

export interface Artifact {
  id: string;
  title: string;
  type: "report" | "plan" | "email" | "calendar" | "sheets" | "code_diff" | "review";
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
// Task creation
// ─────────────────────────────────────────────────────────────

export async function createAndRunTask(
  userQuery: string,
  preferredRepo?: string,
  preferredBranch = "main"
): Promise<CoworkTask> {
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

  const queryLower = userQuery.toLowerCase();
  const mentionedMCPServers = parseMentionedMCPServers(userQuery);

  // Detect which tools are needed
  const isDriveQuery =
    queryLower.includes("drive") || queryLower.includes("pdf") ||
    queryLower.includes("doc") || queryLower.includes("file") || queryLower.includes("folder");
  const isCalendarQuery =
    queryLower.includes("calendar") || queryLower.includes("meeting") ||
    queryLower.includes("schedule") || queryLower.includes("tomorrow") || queryLower.includes("event");
  const isGmailQuery =
    queryLower.includes("email") || queryLower.includes("mail") ||
    queryLower.includes("draft") || queryLower.includes("inbox") || queryLower.includes("gmail");
  const isSheetsQuery =
    queryLower.includes("sheet") || queryLower.includes("spreadsheet") ||
    queryLower.includes("sales") || queryLower.includes("revenue") || queryLower.includes("excel");
  const isBrowserQuery =
    queryLower.includes("browser") || queryLower.includes("search web") ||
    queryLower.includes("website") || queryLower.includes("@browser");
  const isMCPQuery =
    queryLower.includes("mcp") || queryLower.includes("@") || mentionedMCPServers.length > 0;

  const isExplicitGitHub =
    queryLower.includes("github") || queryLower.includes("repo") ||
    queryLower.includes("code") || queryLower.includes("pr") ||
    queryLower.includes("commit") || queryLower.includes("audit") ||
    queryLower.includes("issue") || queryLower.includes("@github");

  const isAnyOtherTool =
    isDriveQuery || isCalendarQuery || isGmailQuery || isSheetsQuery || isBrowserQuery || isMCPQuery;

  const needsGitHub = isExplicitGitHub || !isAnyOtherTool;
  const needsDrive = isDriveQuery;
  const needsCalendar = isCalendarQuery;
  const needsGmail = isGmailQuery;
  const needsSheets = isSheetsQuery;
  const needsBrowser = isBrowserQuery;
  const needsMCP = isMCPQuery;

  // Build plan steps
  const initialPlan: PlanStep[] = [
    { id: "step_init", title: "Analyzing request", status: "completed" },
  ];

  if (needsDrive) initialPlan.push({ id: "step_drive", title: "Google Drive", status: "waiting" });
  if (needsGitHub) initialPlan.push({ id: "step_github", title: "GitHub", status: "waiting" });
  if (needsSheets) initialPlan.push({ id: "step_sheets", title: "Google Sheets", status: "waiting" });
  if (needsCalendar) initialPlan.push({ id: "step_cal", title: "Google Calendar", status: "waiting" });
  if (needsGmail) initialPlan.push({ id: "step_gmail", title: "Gmail", status: "waiting" });
  if (needsBrowser || !isAnyOtherTool)
    initialPlan.push({ id: "step_browser", title: "Web search", status: "waiting" });
  if (needsMCP) initialPlan.push({ id: "step_mcp", title: "MCP servers", status: "waiting" });
  initialPlan.push({ id: "step_final", title: "Writing response", status: "waiting" });

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
  executeAgentLoop(taskId, {
    needsDrive,
    needsGitHub,
    needsCalendar,
    needsGmail,
    needsSheets,
    needsBrowser,
    needsMCP,
  }).catch((err) => {
    console.error(`Task ${taskId} failed:`, err);
    const t = taskStore.get(taskId);
    if (t) {
      t.status = "failed";
      addLog(t, "error", "Execution failed", err.message || "Unexpected error");
      taskStore.set(taskId, t);
    }
  });

  return initialTask;
}

// ─────────────────────────────────────────────────────────────
// Main agent execution loop
// ─────────────────────────────────────────────────────────────

async function executeAgentLoop(
  taskId: string,
  flags: {
    needsDrive: boolean;
    needsGitHub: boolean;
    needsCalendar: boolean;
    needsGmail: boolean;
    needsSheets: boolean;
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
  let googleAccessToken: string | null = null;
  let githubAccessToken: string | null = null;
  let githubUsername: string = owner;

  try {
    const gProfile = await (prisma as any).userProfile.findFirst({
      where: { googleConnected: true },
      select: { googleToken: true },
    });
    googleAccessToken = gProfile?.googleToken || null;
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

  let driveText = "";
  let githubText = "";
  let calendarText = "";
  let gmailText = "";
  let sheetsText = "";
  let webText = "";

  // ── WEB SEARCH ──────────────────────────────────────────────
  const isWebQuery =
    flags.needsBrowser ||
    (!flags.needsDrive && !flags.needsCalendar && !flags.needsGmail &&
      !flags.needsSheets && !flags.needsGitHub) ||
    queryLower.includes("search") || queryLower.includes("latest") ||
    queryLower.includes("news") || queryLower.includes("what") ||
    queryLower.includes("how") || queryLower.includes("find");

  if (isWebQuery) {
    setStep(task, "step_browser", "running");
    addLog(task, "tool_call", "Searching the web", `"${task.userQuery.slice(0, 60)}"`, "browser", { toolName: "searchWeb" });
    await delay(300);

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
    await delay(200);
  }

  // ── GOOGLE DRIVE ─────────────────────────────────────────────
  if (flags.needsDrive) {
    setStep(task, "step_drive", "running");
    addLog(task, "tool_call", "Searching Drive", `Looking for files matching "${task.userQuery.slice(0, 40)}"`, "drive", { toolName: "drive_search_files" });
    await delay(300);

    try {
      const files = await drive_search_files(task.userQuery, googleAccessToken);
      if (files.length > 0) {
        addLog(task, "tool_call", `Reading ${files[0].name}`, `Extracting file content`, "drive", { toolName: "drive_get_file_content" });
        await delay(200);
        const content = await drive_get_file_content(files[0].id);
        driveText =
          `Files found (${files.length}):\n` +
          files.map((f) => `• ${f.name}`).join("\n") +
          `\n\n${files[0].name} content:\n${content.content}`;
        task.usedTools.push("drive_search_files", "drive_get_file_content");
        addLog(task, "success", `Read ${files[0].name}`, `${files.length} file(s) retrieved`, "drive");
      } else {
        addLog(task, "reasoning", "No Drive files found", "No matching documents in Google Drive", "drive");
      }
    } catch (e: any) {
      addLog(task, "error", "Drive access failed", e.message || "Check Google connection", "drive");
    }

    setStep(task, "step_drive", "completed");
    await delay(200);
  }

  // ── GITHUB ──────────────────────────────────────────────────
  if (flags.needsGitHub) {
    setStep(task, "step_github", "running");
    const effectiveOwner = githubUsername || owner;

    try {
      // Step 1: List repos
      addLog(task, "tool_call", "Listing repositories", `@${effectiveOwner}`, "github", { toolName: "github_list_repositories" });
      await delay(300);

      const repos = await github_list_repositories(effectiveOwner, githubAccessToken);
      task.usedTools.push("github_list_repositories");

      let resolvedOwner = effectiveOwner;
      let resolvedRepo = repo;

      if (repos.length > 0) {
        const matched = repo
          ? repos.find((r) => r.name.toLowerCase() === repo.toLowerCase()) || repos[0]
          : repos[0];
        resolvedOwner = matched.full_name.split("/")[0];
        resolvedRepo = matched.name;

        addLog(task, "success", `${repos.length} repo${repos.length > 1 ? "s" : ""} found`, repos.slice(0, 3).map((r) => r.name).join(", "), "github");
        await delay(200);

        // Step 2: File tree
        addLog(task, "tool_call", `Reading ${resolvedRepo}`, `Scanning file tree`, "github", { toolName: "github_get_repository_tree" });
        await delay(300);

        let tree: any[] = [];
        try {
          tree = await github_get_repository_tree(resolvedOwner, resolvedRepo, branch);
          task.usedTools.push("github_get_repository_tree");
          addLog(task, "success", `${tree.length} files indexed`, `${resolvedOwner}/${resolvedRepo}`, "github");
        } catch {
          addLog(task, "reasoning", "File tree unavailable", "Could not read repository tree", "github");
        }

        await delay(200);

        // Step 3: Commits
        addLog(task, "tool_call", "Fetching recent commits", `${resolvedOwner}/${resolvedRepo}`, "github", { toolName: "github_get_commits" });
        await delay(300);

        let commits: any[] = [];
        try {
          commits = await github_get_commits(resolvedOwner, resolvedRepo);
          task.usedTools.push("github_get_commits");
          addLog(task, "success", `${commits.length} commits`, commits[0]?.commit?.message?.split("\n")[0]?.slice(0, 60) || "", "github");
        } catch {
          addLog(task, "reasoning", "Commits unavailable", "Could not fetch commit history", "github");
        }

        await delay(200);

        // Step 4: Issues
        addLog(task, "tool_call", "Checking open issues", `${resolvedOwner}/${resolvedRepo}`, "github", { toolName: "github_get_issues" });
        await delay(300);

        let issues: any[] = [];
        try {
          issues = await github_get_issues(resolvedOwner, resolvedRepo);
          task.usedTools.push("github_get_issues");
          addLog(task, "success", `${issues.length} issue${issues.length !== 1 ? "s" : ""}`, issues.length > 0 ? issues[0].title.slice(0, 60) : "No open issues", "github");
        } catch {
          addLog(task, "reasoning", "Issues unavailable", "Could not fetch issues", "github");
        }

        // Build context
        githubText =
          `GitHub @${resolvedOwner} — ${repos.length} repositories\n` +
          repos.slice(0, 5).map((r) => `• ${r.full_name} (${r.language || "—"}, ⭐${r.stargazers_count}, ${r.open_issues_count} issues)`).join("\n") +
          `\n\nActive repo: ${resolvedOwner}/${resolvedRepo}\n` +
          `Files scanned: ${tree.length}\n` +
          (commits.length > 0
            ? `\nRecent commits:\n` + commits.slice(0, 5).map((c) => `• ${c.commit.message.split("\n")[0]} (${c.commit.author.name})`).join("\n")
            : "") +
          (issues.length > 0
            ? `\n\nOpen issues (${issues.length}):\n` + issues.slice(0, 5).map((i) => `• #${i.number}: ${i.title} [${i.state}]`).join("\n")
            : "\n\nNo open issues.");
      } else {
        addLog(task, "reasoning", "No repositories found", `No public repos for @${effectiveOwner}`, "github");
        githubText = `GitHub @${effectiveOwner}: no repositories found.`;
      }
    } catch (e: any) {
      addLog(task, "error", "GitHub access failed", e.message || "Check GitHub connection", "github");
      githubText = `GitHub: access failed — ${e.message}`;
    }

    setStep(task, "step_github", "completed");
    await delay(200);
  }

  // ── GOOGLE SHEETS ────────────────────────────────────────────
  if (flags.needsSheets) {
    setStep(task, "step_sheets", "running");
    addLog(task, "tool_call", "Reading spreadsheet", "Fetching rows and columns", "sheets", { toolName: "sheets_read" });
    await delay(300);

    try {
      const sheetData = await sheets_read("sheet_101");
      sheetsText = `${sheetData.title}\nHeaders: ${sheetData.headers.join(", ")}\nData:\n${sheetData.rows.map((r) => r.join(" | ")).join("\n")}`;
      task.usedTools.push("sheets_read");
      addLog(task, "success", "Spreadsheet loaded", `${sheetData.rows.length} rows`, "sheets");
    } catch (e: any) {
      addLog(task, "error", "Sheets access failed", e.message || "Check Google connection", "sheets");
    }

    setStep(task, "step_sheets", "completed");
    await delay(200);
  }

  // ── GOOGLE CALENDAR ──────────────────────────────────────────
  if (flags.needsCalendar) {
    setStep(task, "step_cal", "running");
    addLog(task, "tool_call", "Checking calendar", "Finding free slots tomorrow", "calendar", { toolName: "calendar_find_free_time" });
    await delay(300);

    try {
      const slots = await calendar_find_free_time("tomorrow", 60);
      calendarText = `Free slots tomorrow: ${slots.availableSlots.join(", ")}`;
      task.usedTools.push("calendar_find_free_time");
      addLog(task, "success", "Calendar read", `${slots.availableSlots.length} free slots found`, "calendar");
    } catch (e: any) {
      addLog(task, "error", "Calendar access failed", e.message || "Check Google connection", "calendar");
    }

    setStep(task, "step_cal", "completed");
    await delay(200);
  }

  // ── GMAIL ────────────────────────────────────────────────────
  if (flags.needsGmail) {
    setStep(task, "step_gmail", "running");
    addLog(task, "tool_call", "Searching inbox", `"${task.userQuery.slice(0, 40)}"`, "gmail", { toolName: "gmail_search" });
    await delay(300);

    try {
      const emails = await gmail_search(task.userQuery, googleAccessToken);
      const profile = await (prisma as any).userProfile.findFirst({
        where: { googleConnected: true },
        select: { googleEmail: true },
      });
      const userEmail = profile?.googleEmail || "your account";
      gmailText =
        `Gmail: ${userEmail}\n${emails.length} message(s) found\n\n` +
        emails
          .map((e) => `From: ${e.from}\nSubject: ${e.subject}\nSnippet: ${e.snippet}\nDate: ${new Date(e.date).toLocaleString()}`)
          .join("\n\n");
      task.usedTools.push("gmail_search");
      addLog(task, "success", `${emails.length} email${emails.length !== 1 ? "s" : ""} found`, emails[0]?.subject || "Inbox read", "gmail");
    } catch (e: any) {
      addLog(task, "error", "Gmail access failed", e.message || "Check Google connection", "gmail");
    }

    setStep(task, "step_gmail", "completed");
    await delay(200);
  }

  // ── HUMAN APPROVAL CHECK ─────────────────────────────────────
  const isSendEmail = queryLower.includes("send email") || queryLower.includes("send mail");
  const isCreateEvent = queryLower.includes("schedule meeting") || queryLower.includes("create event");
  const isCreateIssue = queryLower.includes("create issue") || queryLower.includes("open issue");

  if (isSendEmail || isCreateEvent || isCreateIssue) {
    let toolName = "gmail_send";
    let cat: "gmail" | "calendar" | "github" = "gmail";
    let titleText = "Send email";
    let descText = "Send the drafted email to the recipient.";
    let params: any = { to: "", subject: task.userQuery.slice(0, 40), body: "..." };

    if (isCreateEvent) {
      toolName = "calendar_create_event";
      cat = "calendar";
      titleText = "Create calendar event";
      descText = "Create the meeting event in Google Calendar.";
      params = { summary: "Meeting", startIso: "Tomorrow 10:00 AM", endIso: "Tomorrow 11:00 AM" };
    } else if (isCreateIssue) {
      toolName = "github_create_issue";
      cat = "github";
      titleText = "Create GitHub issue";
      descText = `Open a new issue on ${owner}/${repo}.`;
      params = { owner, repo, title: task.userQuery.slice(0, 60), body: "" };
    }

    setStep(task, "step_final", "approval_required");
    task.status = "waiting_approval";
    task.pendingApproval = {
      toolName,
      category: cat,
      title: titleText,
      description: descText,
      targetResource: params.to || params.summary || `${owner}/${repo}`,
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
    driveText,
    githubText,
    calendarText,
    gmailText,
    sheetsText,
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
    driveText: string;
    githubText: string;
    calendarText: string;
    gmailText: string;
    sheetsText: string;
    webText: string;
    writeActionResult?: string;
  }
) {
  setStep(task, "step_final", "running");
  addLog(task, "reasoning", "Writing response", "Synthesizing gathered data", "system");
  await delay(200);

  const contextParts: string[] = [];
  if (ctx.webText) contextParts.push(`WEB:\n${ctx.webText}`);
  if (ctx.driveText) contextParts.push(`DRIVE:\n${ctx.driveText}`);
  if (ctx.gmailText) contextParts.push(`GMAIL:\n${ctx.gmailText}`);
  if (ctx.githubText) contextParts.push(`GITHUB:\n${ctx.githubText}`);
  if (ctx.sheetsText) contextParts.push(`SHEETS:\n${ctx.sheetsText}`);
  if (ctx.calendarText) contextParts.push(`CALENDAR:\n${ctx.calendarText}`);
  if (ctx.writeActionResult) contextParts.push(`ACTION RESULT:\n${ctx.writeActionResult}`);

  const sysPrompt = `You are Clarity, an AI workspace agent.
Answer the user's request directly and clearly using the retrieved data below.
Format the response with clean markdown: use headers, bullet lists, code blocks where relevant.
Be specific, factual, and concise. Do not use filler phrases.
If real data was retrieved, reference it directly (repo names, commit messages, email subjects, etc.).
If no relevant data was retrieved for a tool, say so briefly.`;

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
      temperature: 0.1,
      max_tokens: 2000,
    })) as any;
    reportText = completion.choices[0]?.message?.content?.trim() || "";
  } catch (e) {
    // Fallback: just show the raw context clearly formatted
    reportText = contextParts.length > 0
      ? contextParts.join("\n\n---\n\n")
      : `No data was retrieved. Make sure your integrations (GitHub, Google) are connected.`;
  }

  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const artifacts: Artifact[] = [];

  artifacts.push({
    id: `art_main_${Date.now()}`,
    title: task.userQuery.slice(0, 50),
    type: "report",
    content: reportText,
    createdAt: nowStr,
  });

  task.artifacts = artifacts;
  task.report = reportText;
  task.status = "completed";
  task.plan.forEach((s) => { if (s.status !== "failed") s.status = "completed"; });
  task.updatedAt = new Date().toISOString();

  addLog(task, "success", "Done", `${artifacts.length} artifact generated`, "system");
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
    if (toolName === "gmail_send") {
      const res = await gmail_send(params.to, params.subject, params.body);
      resultInfo = `Email sent (${res.messageId})`;
    } else if (toolName === "calendar_create_event") {
      const res = await calendar_create_event(params.summary, params.startIso, params.endIso);
      resultInfo = `Event created: ${res.summary}`;
    } else if (toolName === "github_create_issue") {
      const res = await github_create_issue(params.owner, params.repo, params.title, params.body);
      resultInfo = `Issue #${res.number} created`;
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
    driveText: "",
    githubText: "",
    calendarText: "",
    gmailText: "",
    sheetsText: "",
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

      const reply = completion.choices[0]?.message?.content?.trim() || "";
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

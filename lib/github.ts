/**
 * GitHub API Integration & Tools Layer for Clarity CoWork
 * Handles OAuth/Token access, repository tree inspection, code searching, issues, PRs, and commit history.
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubFile {
  path: string;
  mode: string;
  type: "tree" | "blob";
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  user: { login: string };
  body: string | null;
  html_url: string;
  created_at: string;
  comments: number;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  user: { login: string };
  body: string | null;
  html_url: string;
  created_at: string;
  head: { ref: string; sha: string };
  base: { ref: string };
  changed_files?: number;
  additions?: number;
  deletions?: number;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: { name: string; date: string };
    message: string;
  };
  html_url: string;
}

function getGitHubToken(userToken?: string | null): string | null {
  return userToken || process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN || null;
}

async function githubFetch(endpoint: string, options: RequestInit = {}, userToken?: string | null) {
  const token = getGitHubToken(userToken);
  const headers: Record<string, string> = {
    "User-Agent": "Clarity-CoWork-Agent",
    "Accept": "application/vnd.github.v3+json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `https://api.github.com${endpoint}`;
  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`GitHub API Error (${res.status}): ${errorText || res.statusText}`);
  }

  return res.json();
}

// -------------------------------------------------------------
// READ TOOLS
// -------------------------------------------------------------

export async function github_list_repositories(username = "ShivamSk07", accessToken?: string | null): Promise<GitHubRepo[]> {
  // Use authenticated endpoint if user token is available (gets private repos too)
  const endpoint = accessToken
    ? `/user/repos?sort=updated&per_page=50`
    : `/users/${username}/repos?sort=updated&per_page=30`;
  const repos = await githubFetch(endpoint, {}, accessToken);
  return repos.map((r: any) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    private: r.private,
    html_url: r.html_url,
    default_branch: r.default_branch || "main",
    language: r.language,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    open_issues_count: r.open_issues_count,
    created_at: r.created_at || "",
    updated_at: r.updated_at,
  }));
}

export async function github_get_repository(owner: string, repo: string): Promise<GitHubRepo> {
  const r = await githubFetch(`/repos/${owner}/${repo}`);
  return {
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    private: r.private,
    html_url: r.html_url,
    default_branch: r.default_branch || "main",
    language: r.language,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    open_issues_count: r.open_issues_count,
    created_at: r.created_at || "",
    updated_at: r.updated_at,
  };
}

export async function github_get_repository_tree(owner: string, repo: string, branch = "main"): Promise<GitHubFile[]> {
  const data = await githubFetch(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  return (data.tree || []).slice(0, 100).map((f: any) => ({
    path: f.path,
    mode: f.mode,
    type: f.type,
    sha: f.sha,
    size: f.size,
    url: f.url,
  }));
}

export async function github_get_file(owner: string, repo: string, path: string, branch = "main"): Promise<{ content: string; path: string }> {
  const data = await githubFetch(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
  if (data.content && data.encoding === "base64") {
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    return { content: decoded, path };
  }
  return { content: data.content || "", path };
}

export async function github_search_code(owner: string, repo: string, query: string): Promise<{ total_count: number; items: Array<{ name: string; path: string; html_url: string }> }> {
  const q = `${query} repo:${owner}/${repo}`;
  const data = await githubFetch(`/search/code?q=${encodeURIComponent(q)}`);
  return {
    total_count: data.total_count || 0,
    items: (data.items || []).slice(0, 10).map((i: any) => ({
      name: i.name,
      path: i.path,
      html_url: i.html_url,
    })),
  };
}

export async function github_get_commits(owner: string, repo: string): Promise<GitHubCommit[]> {
  const data = await githubFetch(`/repos/${owner}/${repo}/commits?per_page=10`);
  return data.map((c: any) => ({
    sha: c.sha.slice(0, 7),
    commit: {
      author: { name: c.commit.author.name, date: c.commit.author.date },
      message: c.commit.message,
    },
    html_url: c.html_url,
  }));
}

export async function github_get_issues(owner: string, repo: string): Promise<GitHubIssue[]> {
  const data = await githubFetch(`/repos/${owner}/${repo}/issues?state=all&per_page=10`);
  return data.map((i: any) => ({
    number: i.number,
    title: i.title,
    state: i.state,
    user: { login: i.user?.login || "user" },
    body: i.body,
    html_url: i.html_url,
    created_at: i.created_at,
    comments: i.comments,
  }));
}

export async function github_get_pull_requests(owner: string, repo: string): Promise<GitHubPullRequest[]> {
  const data = await githubFetch(`/repos/${owner}/${repo}/pulls?state=all&per_page=10`);
  return data.map((pr: any) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    user: { login: pr.user?.login || "user" },
    body: pr.body,
    html_url: pr.html_url,
    created_at: pr.created_at,
    head: { ref: pr.head.ref, sha: pr.head.sha.slice(0, 7) },
    base: { ref: pr.base.ref },
  }));
}

export async function github_get_branches(owner: string, repo: string): Promise<Array<{ name: string; protected: boolean }>> {
  const data = await githubFetch(`/repos/${owner}/${repo}/branches`);
  return data.map((b: any) => ({ name: b.name, protected: b.protected || false }));
}

// -------------------------------------------------------------
// WRITE TOOLS (REQUIRES HUMAN APPROVAL FIRST)
// -------------------------------------------------------------

export async function github_create_issue(owner: string, repo: string, title: string, body: string): Promise<GitHubIssue> {
  const data = await githubFetch(`/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  });
  return {
    number: data.number,
    title: data.title,
    state: data.state,
    user: { login: data.user?.login || "ShivamSk07" },
    body: data.body,
    html_url: data.html_url,
    created_at: data.created_at,
    comments: 0,
  };
}

export async function github_create_branch(owner: string, repo: string, branch_name: string, from_branch = "main"): Promise<{ ref: string; sha: string }> {
  // Get base branch SHA
  const refData = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${from_branch}`);
  const baseSha = refData.object.sha;

  // Create new ref
  const newRef = await githubFetch(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: `refs/heads/${branch_name}`,
      sha: baseSha,
    }),
  });

  return {
    ref: newRef.ref,
    sha: newRef.object.sha.slice(0, 7),
  };
}

export async function github_create_pull_request(owner: string, repo: string, title: string, body: string, head: string, base = "main"): Promise<GitHubPullRequest> {
  const data = await githubFetch(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, head, base }),
  });
  return {
    number: data.number,
    title: data.title,
    state: data.state,
    user: { login: data.user?.login || "ShivamSk07" },
    body: data.body,
    html_url: data.html_url,
    created_at: data.created_at,
    head: { ref: data.head.ref, sha: data.head.sha.slice(0, 7) },
    base: { ref: data.base.ref },
  };
}

import type { Branded } from "../../utils/branding";
import { omit } from "../../utils/object";
import { getGithubAPIKey } from "../environment";
import { z } from "zod";

const GITHUB_API_DOMAIN = "https://api.github.com";

type GithubAPIUrl = Branded<"GithubAPIUrl">;

function get(url: GithubAPIUrl): Promise<Response> {
  return fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${getGithubAPIKey()}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

enum GithubAPIEndpoint {
  Commits = `/repos/{owner}/{repo}/commits`,
  Pulls = `/repos/{owner}/{repo}/commits/{commit_sha}/pulls`,
  PullCommits = `/repos/{owner}/{repo}/pulls/{pull_number}/commits`,
}

interface BaseGithubAPIUrlParams {
  endpoint: GithubAPIEndpoint;
}

interface GithubCommitsParams extends BaseGithubAPIUrlParams {
  endpoint: GithubAPIEndpoint.Commits;
  owner: string;
  repo: string;
}

interface GithubPullsParams extends BaseGithubAPIUrlParams {
  endpoint: GithubAPIEndpoint.Pulls;
  owner: string;
  repo: string;
  commit_sha: string;
}

interface GithubPullCommitsParams extends BaseGithubAPIUrlParams {
  endpoint: GithubAPIEndpoint.PullCommits;
  owner: string;
  repo: string;
  pull_number: number;
}

type GithubAPIUrlParams =
  | GithubCommitsParams
  | GithubPullsParams
  | GithubPullCommitsParams;

function k(keyName: string): string {
  return `{${keyName}}`;
}

/**
 * Replaces the placeholder values in the given GitHub API endpoint with the provided parameters.
 *
 * @param endpoint - The GitHub API endpoint with placeholder values.
 * @param params - The key-value pairs of parameters to replace the placeholders.
 * @returns The URL with the replaced parameters.
 */
function embedUrlParams<P extends GithubAPIUrlParams>(
  endpoint: P["endpoint"],
  params: Omit<P, "endpoint">
): string {
  let url = endpoint as string;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(k(key), value);
  }
  return url;
}

/**
 * Creates a URL with the provided parameters.
 *
 * @param url - The base URL.
 * @param params - The query parameters to append to the URL.
 * @returns The generated URL.
 */
function createAPIURL(
  url: string,
  params: Record<string, string>
): GithubAPIUrl {
  const urlObj = new URL(url, GITHUB_API_DOMAIN);
  for (const [key, value] of Object.entries(params)) {
    urlObj.searchParams.append(key, value);
  }
  return urlObj.toString() as GithubAPIUrl;
}

/**
 * Generates the GitHub API URL based on the provided parameters.
 *
 * @param params - The parameters for generating the URL.
 * @returns The generated GitHub API URL.
 */
function getGithubAPIUrl(
  params: GithubAPIUrlParams,
  queryParams?: Record<string, string>
): GithubAPIUrl {
  switch (params.endpoint) {
    case GithubAPIEndpoint.Commits:
      return createAPIURL(
        embedUrlParams(params.endpoint, {
          owner: params.owner,
          repo: params.repo,
        }),
        queryParams ?? {}
      );
    case GithubAPIEndpoint.Pulls:
      return createAPIURL(
        embedUrlParams<GithubPullsParams>(params.endpoint, {
          owner: params.owner,
          repo: params.repo,
          commit_sha: params.commit_sha,
        }),
        queryParams ?? {}
      );
    case GithubAPIEndpoint.PullCommits:
      return createAPIURL(
        embedUrlParams<GithubPullCommitsParams>(params.endpoint, {
          owner: params.owner,
          repo: params.repo,
          pull_number: params.pull_number,
        }),
        queryParams ?? {}
      );
  }
}

const GithubCommitSchema = z.object({
  sha: z.string(),
  commit: z.object({
    author: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string(),
    }),
    committer: z.object({
      name: z.string(),
      email: z.string(),
      date: z.string(),
    }),
    message: z.string(),
  }),
  url: z.string(),
  author: z.object({
    login: z.string(),
    url: z.string(),
    avatar_url: z.string(),
  }),
  committer: z.object({
    login: z.string(),
    url: z.string(),
    avatar_url: z.string(),
  }),
});

export type GithubCommit = z.infer<typeof GithubCommitSchema>;

const GithubPrSchema = z.object({
  id: z.number(),
  url: z.string(),
  number: z.number(),
  state: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  user: z.object({
    login: z.string(),
    avatar_url: z.string(),
    url: z.string(),
  }),
  created_at: z.string(),
  updated_at: z.string(),
  head: z.object({
    label: z.string(),
    ref: z.string(),
    sha: z.string(),
    user: z.object({
      login: z.string(),
      avatar_url: z.string(),
      url: z.string(),
    }),
  }),
  base: z.object({
    label: z.string(),
    ref: z.string(),
    sha: z.string(),
    user: z.object({
      login: z.string(),
      avatar_url: z.string(),
      url: z.string(),
    }),
  }),
});

export type GithubPR = z.infer<typeof GithubPrSchema>;

export type GetCommitsParams = {
  /**
   * The owner of the repository.
   */
  owner: string;
  /**
   * The name of the repository
   */
  repo: string;
  /**
   * The branch to get the commits from.
   */
  sha?: string;
  /**
   * The path to the file to get the commits for.
   */
  path?: string;
  /**
   * The author of the commits.
   */
  author?: string;
  /**
   * The date to get the commits since.
   */
  since?: string;
  /**
   * The date to get the commits until.
   */
  until?: string;
  /**
   * The number of commits to get per page.
   */
  per_page?: number;
  /**
   * The page number to get the commits from.
   */
  page?: number;
};

const GetCommitsResponseSchema = z.array(GithubCommitSchema);

type GetCommitsResponse = z.infer<typeof GetCommitsResponseSchema>;

/**
 * Gets the commits for the specified repository.
 */
export async function getCommits(
  params: GetCommitsParams
): Promise<GetCommitsResponse> {
  const url = getGithubAPIUrl(
    {
      endpoint: GithubAPIEndpoint.Commits,
      owner: params.owner,
      repo: params.repo,
    },
    omit(params, ["owner", "repo"]) as Record<string, string>
  );

  const response = await get(url);

  if (!response.ok) {
    throw new Error(`Failed to get commits: ${response.statusText}`);
  }

  const data: unknown = await response.json();
  const result = GetCommitsResponseSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Failed to parse commits: ${result.error.message}`);
  }

  return result.data;
}

export type GetPullsForCommitParams = {
  /**
   * The owner of the repository.
   */
  owner: string;
  /**
   * The name of the repository.
   */
  repo: string;
  /**
   * The commit SHA to get the pull requests for.
   */
  commit_sha: string;
};

const GetPullsForCommitResponseSchema = z.array(GithubPrSchema);

type GetPullsForCommitResponse = z.infer<
  typeof GetPullsForCommitResponseSchema
>;

/**
 * Gets the pull requests for the specified commit.
 */
export async function getPullsForCommit(
  params: GetPullsForCommitParams
): Promise<GetPullsForCommitResponse> {
  const url = getGithubAPIUrl({
    endpoint: GithubAPIEndpoint.Pulls,
    owner: params.owner,
    repo: params.repo,
    commit_sha: params.commit_sha,
  });

  const response = await get(url);

  if (!response.ok) {
    throw new Error(`Failed to get pull requests: ${response.statusText}`);
  }

  const data: unknown = await response.json();
  const result = GetPullsForCommitResponseSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Failed to parse pull requests: ${result.error.message}`);
  }

  return result.data;
}

export type GetPullCommitsParams = {
  /**
   * The owner of the repository.
   */
  owner: string;
  /**
   * The name of the repository.
   */
  repo: string;
  /**
   * The pull request number.
   */
  pull_number: number;
};

const GetPullCommitsResponseSchema = z.array(GithubCommitSchema);

type GetPullCommitsResponse = z.infer<typeof GetPullCommitsResponseSchema>;

/**
 * Gets the commits for the specified pull request.
 */
export async function getPullCommits(
  params: GetPullCommitsParams
): Promise<GetPullCommitsResponse> {
  const url = getGithubAPIUrl({
    endpoint: GithubAPIEndpoint.PullCommits,
    owner: params.owner,
    repo: params.repo,
    pull_number: params.pull_number,
  });

  const response = await get(url);

  if (!response.ok) {
    throw new Error(`Failed to get pull commits: ${response.statusText}`);
  }

  const data: unknown = await response.json();
  const result = GetPullCommitsResponseSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Failed to parse pull commits: ${result.error.message}`);
  }

  return result.data;
}

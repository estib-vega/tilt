import { omit } from "../../utils/object";
import { getGithubAPIKey } from "../environment";
import { z } from "zod";

const GITHUB_API_DOMAIN = "https://api.github.com";

enum GithubAPIEndpoint {
  Commits = `/repos/{owner}/{repo}/commits`,
}

interface BaseGithubAPIUrlParams {
  endpoint: GithubAPIEndpoint;
}

interface GithubCommitsParams extends BaseGithubAPIUrlParams {
  endpoint: GithubAPIEndpoint.Commits;
  owner: string;
  repo: string;
}

type GithubAPIUrlParams = GithubCommitsParams;

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
function createAPIURL(url: string, params: Record<string, string>): string {
  const urlObj = new URL(url, GITHUB_API_DOMAIN);
  for (const [key, value] of Object.entries(params)) {
    urlObj.searchParams.append(key, value);
  }
  return urlObj.toString();
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
): string {
  switch (params.endpoint) {
    case GithubAPIEndpoint.Commits:
      return createAPIURL(
        embedUrlParams(params.endpoint, {
          owner: params.owner,
          repo: params.repo,
        }),
        queryParams ?? {}
      );
  }
}

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

const GetCommitsResponseSchema = z.array(
  z.object({
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
  })
);

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

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${getGithubAPIKey()}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

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

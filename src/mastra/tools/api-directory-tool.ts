import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { Octokit } from 'octokit';
import Fuse from 'fuse.js';

export interface APIItem {
  name: string;
  description: string;
  url: string;
  categories: string[];
  public_api_fields?: {
    https?: boolean;
    auth?: string;
    cors?: string;
  };
};

const CACHE_FILE = path.resolve('./cache/apis.json');
const CACHE_DURATION_MS = 1000 * 60 * 60 * 24; // 24h
const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

async function fetchResources(file: string) {
  console.log("Getting data from github using octokit")
  const { data } = await octokit.rest.repos.getContent({
    owner: 'marcelscruz',
    repo: 'dev-resources',
    path: `/db/${file}.json`,
  });

  // Handle if `data` is an array or a single file
  if (Array.isArray(data)) {
    throw new Error(`Expected a file but got a directory for path: ${file}`);
  }

  if (!('download_url' in data) || !data.download_url) {
    throw new Error('Download URL not found');
  }
  
  console.log("Fetching data from the download URL")
  const result = await fetch(data.download_url);
  console.log("Result gotten!")
  if (!result.ok) {
    throw new Error(`Unexpected response ${result.statusText}`);
  }

  return await result.json();
}

async function fetchAndCacheAPIs() {
  const now = Date.now();

  if (fs.existsSync(CACHE_FILE)) {
    const stats = fs.statSync(CACHE_FILE);
    if (now - stats.mtimeMs < CACHE_DURATION_MS) {
      console.log('✅ Using cached GitHub API data');
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  }


  console.log('🌍 Fetching new API data from GitHub...');
  const apis = await fetchResources('resources'); // << key line
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(apis, null, 2));
  console.log('✅ Cached API data successfully!');
  return apis;
}

export async function searchAPIs(
  query: string
): Promise<
  {
    name: string;
    description: string;
    url: string;
    categories: string[];
    https: boolean;
    auth: string;
    cors: string;
  }[]
> {
  if (!query?.trim()) {
    // Return an empty array instead of string[] to match expected type
    return [];
  }

  const apis = await fetchAndCacheAPIs();
  const apiList: APIItem[] = apis?.data || [];

  const fuse = new Fuse<APIItem>(apiList, {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "description", weight: 0.3 },
      { name: "categories", weight: 0.2 },
    ],
    threshold: 0.1,
    includeScore: true,
  });

  const results = fuse.search(query);

  return results.slice(0, 10).map(({ item }) => ({
    name: item.name,
    description: item.description,
    url: item.url,
    categories: item.categories ?? [],
    https: item.public_api_fields?.https ?? false,
    auth: item.public_api_fields?.auth ?? "unknown",
    cors: item.public_api_fields?.cors ?? "unknown",
  }));
}

export const apiDirectoryTool = createTool({
  id: 'search-public-apis',
  description: 'Search and list public APIs from GitHub (dev-resources repo)',
  inputSchema: z.object({
    query: z.string().describe('Keyword to search for APIs'),
  }),
  outputSchema: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      url: z.string(),
      categories: z.array(z.string()),
      https: z.boolean(),
      auth: z.string(),
      cors: z.string(),
    })
  ),
  execute: async ({ context }) => {
    return await searchAPIs(context.query);
  },
});

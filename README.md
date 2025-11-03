# 🚀 Mastra A2A API Search

An AI-powered API discovery and agent interaction server built with **Mastra**, **TypeScript**, and **Fuse.js**.  
This project allows agents to interact via the **A2A (Agent-to-Agent)** protocol and search through a large database of public APIs with smart fuzzy search.

---

## 🧩 Overview

This project demonstrates how to:
- Build an **A2A-compliant** route handler with Mastra.
- Search through thousands of public APIs using **Fuse.js fuzzy matching**.
- Integrate **Mastra Agents** for intelligent API discovery or chat-based automation.
- Return structured **JSON-RPC 2.0** compliant responses.

It’s perfect for devs who want to build AI-assisted developer tools, agent frameworks, or open API directories.

---

## 🧱 Project Structure

```
📦 mastra-a2a-api-search/
├── src/
│   ├── routes/
│   │   ├── a2aRouteHandler.ts      # A2A-compliant POST route for agent communication
│   │   ├── search.ts               # Smart Fuse.js-powered search through cached APIs
│   ├── utils/
│   │   ├── fetchAndCacheAPIs.ts    # Fetches and caches API data
│   ├── mastra.config.ts            # Mastra configuration and agent setup
│   ├── index.ts                    # App entry point
│
├── package.json
├── tsconfig.json
├── README.md
└── .env
```

---

## ⚙️ Features

✅ **Mastra Agent Integration**  
Create, register, and use intelligent agents for automated queries and tool execution.  

✅ **A2A Protocol Support**  
Implements JSON-RPC 2.0 for agent-to-agent (A2A) communication with proper message history and artifact tracking.  

✅ **Smart API Search**  
Use **Fuse.js** for fuzzy matching on API names, categories, and descriptions.  

✅ **TypeScript Strict Mode**  
Full type safety for cleaner, more predictable code.  

✅ **Error Handling**  
Includes full JSON-RPC error structure and internal error tracing.

---

## 🧠 A2A Route Example

**Endpoint:**  
```
POST /a2a/agent/:agentId
```

**Request Example:**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "generate",
  "params": {
    "message": {
      "role": "user",
      "parts": [{ "kind": "text", "text": "Find APIs related to weather." }]
    }
  }
}
```

**Response Example:**
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "status": { "state": "completed" },
    "artifacts": [
      {
        "artifactId": "uuid",
        "name": "WeatherAPIResponse",
        "parts": [{ "kind": "text", "text": "Found 5 weather APIs..." }]
      }
    ]
  }
}
```

---

## 🧩 How It Works

1. User (or another agent) sends a JSON-RPC request to `/a2a/agent/:agentId`.
2. The route validates the payload and retrieves the registered Mastra agent.
3. The agent processes the request and optionally triggers **tool calls** or **search functions**.
4. The search logic uses `Fuse.js` to filter relevant APIs.
5. The result is wrapped in A2A-compliant JSON and returned as an **artifact**.

---

## 🔍 Example Search Logic

```ts
import Fuse from "fuse.js";

const fuse = new Fuse(apis, {
  keys: ["name", "description", "categories"],
  threshold: 0.3, // Adjust fuzziness
});

const results = fuse.search(query).slice(0, 10);
```

---

## 🧠 Tech Stack

| Tool | Purpose |
|------|----------|
| **Mastra** | Agent framework for workflow orchestration |
| **TypeScript** | Type-safe development |
| **Fuse.js** | Fuzzy search for better API discovery |
| **Node.js** | Runtime for the backend |
| **Crypto** | UUID generation for A2A artifacts |

---

## 🧪 Running Locally

1. **Clone the repo**
   ```bash
   git clone https://github.com/<your-username>/mastra-a2a-api-search.git
   cd mastra-a2a-api-search
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   Create a `.env` file:
   ```bash
   MASTRA_API_KEY=your_mastra_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

---

## 🧰 Example Agent Configuration (mastra.config.ts)

```ts
import { defineMastra } from "@mastra/core";
import { apiSearchTool } from "./tools/apiSearchTool";

export const mastra = defineMastra({
  agents: {
    apiAgent: {
      description: "Finds APIs based on keywords or categories.",
      tools: [apiSearchTool],
    },
  },
});
```

---

## 🧠 Future Improvements

- [ ] Integrate GitHub API via Octokit for open-source API data sync  
- [ ] Add Mastra **Workflows** for automated multi-step discovery  
- [ ] Deploy to Walrus for decentralized hosting  
- [ ] Implement caching with Redis or Upstash  

---

## 👨‍💻 Author

**Adekola Abdulhakeem (SAGHE_DEV)**  
Frontend Developer | AI Builder | Always shipping ⚙️  
> _"I love challenges and solving big problems."_  

GitHub: [@SAGHE-DEV](https://github.com/SAGHE-DEV)  

---

## 🪶 License

MIT License © 2025 SAGHE_DEV

import { registerApiRoute } from "@mastra/core/server";
import { randomUUID } from "crypto";

export const a2aApiDirectoryRoute = registerApiRoute("/a2a/agent/:agentId", {
    method: "POST",
    handler: async (c) => {
        try {
            const mastra = c.get("mastra");
            const agentId = c.req.param("agentId");

            const body = await c.req.json();
            const { jsonrpc, id: requestId, params } = body;

            if (jsonrpc !== "2.0" || !requestId) {
                return c.json(
                    {
                        jsonrpc: "2.0",
                        id: requestId || null,
                        error: {
                            code: -32600,
                            message: 'Invalid Request: jsonrpc must be "2.0" and id is required',
                        },
                    },
                    400
                );
            }

            const agent = mastra.getAgent(agentId);
            if (!agent) {
                return c.json(
                    {
                        jsonrpc: "2.0",
                        id: requestId,
                        error: {
                            code: -32602,
                            message: `Agent '${agentId}' not found`,
                        },
                    },
                    404
                );
            }

            const { message, messages, contextId, taskId } = params || {};
            const messagesList = message ? [message] : Array.isArray(messages) ? messages : [];

            const mastraMessages = messagesList.map((msg) => ({
                role: msg.role,
                content:
                    msg.parts
                        ?.map((part: any) => {
                            if (part.kind === "text") return part.text;
                            if (part.kind === "data") return JSON.stringify(part.data);
                            return "";
                        })
                        .join("\n") || "",
            }));

            // 🚀 Execute agent safely
            const response = await agent.generate(mastraMessages);
            const agentText = typeof response.text === "string" ? response.text.trim() : "No response generated.";

            // 🧹 Sanitize tool results before serializing
            const safeToolResults = (response.toolResults || []).map((r) => {
                try {
                    return typeof r === "string" ? r : JSON.stringify(r, null, 2);
                } catch {
                    return "[Unserializable Tool Result]";
                }
            });

            const artifacts = [
                {
                    artifactId: `artifact-${randomUUID()}`,
                    name: `${agentId}Response`,
                    parts: [{ kind: "text", text: agentText }],
                },
                ...(safeToolResults.length
                    ? [
                        {
                            artifactId: `artifact-${randomUUID()}`,
                            name: "ToolResults",
                            parts: safeToolResults.map((r) => ({ kind: "text", text: r })),
                        },
                    ]
                    : []),
            ];

            const history = [
                ...messagesList.map((msg) => ({
                    kind: "message",
                    role: msg.role,
                    parts: msg.parts,
                    messageId: msg.messageId || `msg-${randomUUID()}`,
                })),
                {
                    kind: "message",
                    role: "agent",
                    parts: [{ kind: "text", text: agentText }],
                    messageId: `msg-${randomUUID()}`,
                },
            ];

            const payload = {
                jsonrpc: "2.0",
                id: requestId,
                result: {
                    id: taskId || `task-${randomUUID()}`,
                    contextId: contextId || `ctx-${randomUUID()}`,
                    status: {
                        state: "completed",
                        timestamp: new Date().toISOString(),
                        message: {
                            kind: "message",
                            role: "agent",
                            parts: [{ kind: "text", text: agentText }],
                            messageId: `msg-${randomUUID()}`,
                        },
                    },
                    artifacts,
                    history,
                    kind: "task",
                },
            };

            // ✅ Ensure clean JSON output (prevent extra data)
            return c.json(JSON.parse(JSON.stringify(payload)));
        } catch (error: any) {
            console.error("A2A Route Error:", error);
            return c.json(
                {
                    jsonrpc: "2.0",
                    id: null,
                    error: {
                        code: -32603,
                        message: "Internal error",
                        data: { details: error.message },
                    },
                },
                500
            );
        }
    },
});

import { openai } from '@ai-sdk/openai';
import {
	convertToModelMessages,
	experimental_createMCPClient,
	streamText,
	UIMessage,
} from 'ai';
import { NextRequest } from 'next/server';

// Simple runtime config via env
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MCP_SSE_URL = process.env.MCP_SSE_URL; // e.g. http://localhost:3000/api/mcp

export const runtime = 'edge'; // fast streaming
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
	const body = await req.json().catch(() => ({}));
	const { messages = [] }: { messages: UIMessage[] } = body;

	if (!Array.isArray(messages)) {
		return new Response('Invalid messages payload', { status: 400 });
	}

	// Create optional MCP client if configured
	let mcpClient: Awaited<
		ReturnType<typeof experimental_createMCPClient>
	> | null = null;
	try {
		// Build SSE URL: mcp-handler mounts at /api/mcp and exposes SSE at /api/mcp/sse
		// We'll default to the base "/api/mcp" and append "/sse" if missing.
		const origin = req.nextUrl.origin;
		const mcpUrl = MCP_SSE_URL || `${origin}/api/mcp`;

		console.log('[MCP] Using SSE URL:', mcpUrl);
		mcpClient = await experimental_createMCPClient({
			transport: {
				type: 'sse',
				url: mcpUrl,
				//headers: MCP_HEADERS,
			},
			onUncaughtError: (err: unknown) => {
				console.error('MCP uncaught error', err);
			},
		});

		const tools = mcpClient ? await mcpClient.tools() : undefined;
		const result = streamText({
			model: openai(MODEL),
			messages: convertToModelMessages(messages),
			tools,
		});

		// Respond using UI message stream protocol compatible with useChat
		return result.toUIMessageStreamResponse();
	} catch (e) {
		console.error('/api/chat error', e);
		await mcpClient?.close().catch(() => {});
		const msg = e instanceof Error ? e.message : String(e);
		return new Response('Chat error: ' + msg, { status: 500 });
	}
}

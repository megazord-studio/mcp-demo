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
const MCP_SSE_URL = process.env.MCP_SSE_URL; // e.g. http://localhost:3000/api/mcp or /api/mcp/sse

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
		// Build SSE URL: mcp-handler exposes SSE at /api/mcp/sse
		// We'll default to the base "/api/mcp" and append "/sse" if it's missing.
		const origin = req.nextUrl.origin;
		const configured = MCP_SSE_URL || `${origin}/api/mcp`;
		// Normalize URL: ensure http for localhost/127.0.0.1 and append '/sse'
		let mcpUrl: string;
		try {
			const u = new URL(configured);
			if (
				(u.hostname === 'localhost' || u.hostname === '127.0.0.1') &&
				u.protocol === 'https:'
			) {
				u.protocol = 'http:';
			}
			if (!u.pathname.endsWith('/sse')) {
				u.pathname = `${u.pathname.replace(/\/$/, '')}/sse`;
			}
			mcpUrl = u.toString();
		} catch {
			// Fallback if configured isn't absolute
			const base = configured.endsWith('/sse')
				? configured
				: `${configured.replace(/\/$/, '')}/sse`;
			mcpUrl = base;
		}

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

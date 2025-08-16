'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function ChatPage() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [input, setInput] = useState('');

	const transport = useMemo(
		() => new DefaultChatTransport({ api: '/api/chat' }),
		[]
	);
	const { messages, sendMessage, status, stop, error } = useChat({
		id: 'main-chat',
		transport,
		experimental_throttle: 32,
	});

	useEffect(() => {
		// auto-scroll to bottom when new messages arrive
		const el = containerRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [messages]);

	return (
		<div className="min-h-screen flex flex-col">
			<header className="sticky top-0 z-10 border-b border-black/10 dark:border-white/15 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
					<h1 className="text-base font-medium">AI Chat</h1>
					<div className="flex items-center gap-3">
						<Link
							href="/"
							className="rounded-md border border-black/10 dark:border-white/20 px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10"
						>
							Back to Attendees
						</Link>
						<div className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
							{status === 'ready' || status === 'error' ? (
								<span className="inline-flex items-center gap-2">
									<span
										className={`h-2.5 w-2.5 rounded-full ${
											status === 'ready' ? 'bg-green-500' : 'bg-red-500'
										}`}
										aria-label={status === 'ready' ? 'green' : 'red'}
										title={status === 'ready' ? 'Ready' : 'Error'}
									/>
									<span className="sr-only">
										{status === 'ready' ? 'green' : 'red'}
									</span>
								</span>
							) : (
								<>
									{status === 'submitted' && 'Connecting…'}
									{status === 'streaming' && 'Generating…'}
								</>
							)}
						</div>
					</div>
				</div>
			</header>

			<main className="flex-1">
				<div className="mx-auto max-w-3xl px-4 py-6">
					<div
						ref={containerRef}
						className="h-[65vh] overflow-y-auto rounded-xl border border-black/10 dark:border-white/15 p-4 bg-white/60 dark:bg-black/20"
					>
						{messages.length === 0 && (
							<div className="h-full flex items-center justify-center text-center text-sm text-black/60 dark:text-white/60">
								Ask anything, or try: &quot;Connect to MCP tool and run a
								command&quot;
							</div>
						)}

						<div className="space-y-4">
							{messages.map((m) => (
								<div key={m.id} className="flex gap-3">
									<div
										className={`shrink-0 h-8 w-8 rounded-full grid place-items-center text-xs font-semibold ${
											m.role === 'user'
												? 'bg-black text-white dark:bg-white dark:text-black'
												: 'bg-foreground/10 text-foreground'
										}`}
									>
										{m.role === 'user' ? 'U' : 'AI'}
									</div>
									<div className="flex-1 min-w-0">
										<div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
											{m.parts.map(
												(part: { type: string; text?: string }, i: number) => {
													if (part.type === 'text')
														return <span key={i}>{part.text}</span>;
													// Render any non-text parts in a compact pre block for now
													return (
														<pre
															key={i}
															className="text-xs font-mono bg-black/5 dark:bg-white/10 rounded p-2 overflow-x-auto"
														>
															{JSON.stringify(part, null, 2)}
														</pre>
													);
												}
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{error && (
						<div className="mt-3 text-sm text-red-600 flex items-center gap-3">
							<span>Something went wrong.</span>
							<button
								onClick={() => window.location.reload()}
								className="underline"
							>
								Retry
							</button>
						</div>
					)}

					<form
						className="mt-4 flex items-end gap-2"
						onSubmit={(e) => {
							e.preventDefault();
							const text = input.trim();
							if (!text) return;
							sendMessage({ text });
							setInput('');
						}}
					>
						<textarea
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => {
								if (
									e.key === 'Enter' &&
									!e.shiftKey &&
									!e.nativeEvent.isComposing
								) {
									e.preventDefault();
									const text = input.trim();
									if (!text) return;
									sendMessage({ text });
									setInput('');
								}
							}}
							rows={1}
							placeholder="Send a message…"
							className="flex-1 resize-none rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/15"
						/>
						{status === 'submitted' || status === 'streaming' ? (
							<button
								type="button"
								onClick={() => stop()}
								className="inline-flex items-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm shadow"
							>
								Stop
							</button>
						) : (
							<button
								type="submit"
								disabled={status !== 'ready'}
								className="inline-flex items-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm shadow disabled:opacity-50"
							>
								Send
							</button>
						)}
					</form>
				</div>
			</main>
		</div>
	);
}

import { sql } from '@/lib/db';
import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';

export const runtime = 'nodejs';

const handler = createMcpHandler(
	(server) => {
		server.tool(
			'roll_dice',
			'Rolls an N-sided die',
			{ sides: z.number().int().min(2) },
			async ({ sides }) => {
				const value = 1 + Math.floor(Math.random() * sides);
				return {
					content: [{ type: 'text', text: `🎲 You rolled a ${value}!` }],
				};
			}
		);

		// List all attendees
		server.tool(
			'attendees_list',
			'List all attendees (users). Returns an array of { id, firstName, lastName, nickname }.',
			{},
			async () => {
				const rows =
					(await sql`SELECT id, first_name, last_name, nickname FROM attendees ORDER BY id`) as unknown as Array<{
						id: number;
						first_name: string;
						last_name: string;
						nickname: string | null;
					}>;

				const data = rows.map((r) => ({
					id: r.id,
					firstName: r.first_name,
					lastName: r.last_name,
					nickname: r.nickname,
				}));

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(data, null, 2),
						},
					],
				};
			}
		);

		// Insert attendee tool
		server.tool(
			'attendees_insert',
			'Insert a new attendee (user). If nickname is omitted, it will be auto-generated.',
			{
				firstName: z.string().min(1, 'firstName is required'),
				lastName: z.string().min(1, 'lastName is required'),
				nickname: z.string().min(1).optional(),
			},
			async ({ firstName, lastName, nickname }) => {
				const slug = (s: string) =>
					s
						.trim()
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, '-')
						.replace(/^-+|-+$/g, '');
				const nn =
					nickname && nickname.trim().length > 0
						? nickname
						: `${slug(firstName)}-${slug(lastName)}-${Math.floor(
								Math.random() * 10_000
						  )
								.toString()
								.padStart(4, '0')}`;

				const rows =
					(await sql`INSERT INTO attendees (first_name, last_name, nickname)
					VALUES (${firstName}, ${lastName}, ${nn})
					RETURNING id, first_name, last_name, nickname`) as unknown as Array<{
						id: number;
						first_name: string;
						last_name: string;
						nickname: string | null;
					}>;

				const r = rows[0];
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								{ id: r.id, firstName, lastName, nickname: r.nickname },
								null,
								2
							),
						},
					],
				};
			}
		);

		// Update attendee by id
		server.tool(
			'attendees_update_by_id',
			"Update an attendee identified by id. Fields not provided won't be changed.",
			{
				id: z.number().int().positive(),
				firstName: z.string().optional(),
				lastName: z.string().optional(),
				nickname: z.string().optional(),
			},
			async ({ id, firstName, lastName, nickname }) => {
				const rows = (await sql`UPDATE attendees
					SET first_name = COALESCE(${firstName}, first_name),
						last_name = COALESCE(${lastName}, last_name),
						nickname = COALESCE(${nickname}, nickname)
					WHERE id = ${id}
					RETURNING id, first_name, last_name, nickname`) as unknown as Array<{
					id: number;
					first_name: string;
					last_name: string;
					nickname: string | null;
				}>;

				if (rows.length === 0) {
					return {
						content: [
							{
								type: 'text',
								text: `No attendee found with id '${id}'.`,
							},
						],
					};
				}

				const r = rows[0];
				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(
								{
									id: r.id,
									firstName: r.first_name,
									lastName: r.last_name,
									nickname: r.nickname,
								},
								null,
								2
							),
						},
					],
				};
			}
		);
	},
	{},
	{
		basePath: '/api/mcp',
		redisUrl: process.env.REDIS_URL,
	}
);

export { handler as DELETE, handler as GET, handler as POST };

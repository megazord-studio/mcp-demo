import { sql } from '@/lib/db';

type Row = {
	id: number;
	first_name: string;
	last_name: string;
	nickname: string | null;
};

export default async function Home() {
	const rows =
		(await sql`select id, first_name, last_name, nickname from attendees order by id`) as Row[];

	return (
		<div className="min-h-screen p-6 sm:p-10">
			<header className="mb-6">
				<h1 className="text-2xl font-semibold">Attendees</h1>
			</header>

			<div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900">
				<table className="w-full text-left text-sm">
					<thead className="bg-black/5 dark:bg-white/10">
						<tr>
							<th className="px-4 py-3 font-medium">ID</th>
							<th className="px-4 py-3 font-medium">First name</th>
							<th className="px-4 py-3 font-medium">Last name</th>
							<th className="px-4 py-3 font-medium">Nickname</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr
								key={r.id}
								className="border-t border-black/5 dark:border-white/10"
							>
								<td className="px-4 py-3">{r.id}</td>
								<td className="px-4 py-3">{r.first_name}</td>
								<td className="px-4 py-3">{r.last_name}</td>
								<td className="px-4 py-3">{r.nickname ?? '-'}</td>
							</tr>
						))}
						{rows.length === 0 && (
							<tr>
								<td
									className="px-4 py-6 text-center text-black/60 dark:text-white/60"
									colSpan={4}
								>
									No attendees yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

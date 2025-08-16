import 'dotenv/config';
import type { InsertAttendee } from '../src/db/schema';
import { sql } from '../src/lib/db';

const firstNames = [
	'Ava',
	'Liam',
	'Noah',
	'Emma',
	'Oliver',
	'Mia',
	'Elijah',
	'Amelia',
	'Sophia',
	'James',
	'Lucas',
	'Isabella',
	'Mason',
	'Charlotte',
	'Ethan',
	'Harper',
	'Logan',
	'Evelyn',
	'Jackson',
	'Abigail',
];
const lastNames = [
	'Smith',
	'Johnson',
	'Williams',
	'Brown',
	'Jones',
	'Garcia',
	'Miller',
	'Davis',
	'Rodriguez',
	'Martinez',
	'Hernandez',
	'Lopez',
	'Gonzalez',
	'Wilson',
	'Anderson',
	'Thomas',
	'Taylor',
	'Moore',
	'Jackson',
	'Martin',
];

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function uniqueNickname(first: string, last: string, i: number) {
	return `${first.toLowerCase()}_${last.toLowerCase()}_${i}`;
}

async function main() {
	const rows: InsertAttendee[] = Array.from({ length: 20 }).map((_, i) => {
		const first = pick(firstNames);
		const last = pick(lastNames);
		return {
			firstName: first,
			lastName: last,
			nickname: uniqueNickname(first, last, i + 1),
		};
	});

	for (const r of rows) {
		await sql`INSERT INTO attendees (first_name, last_name, nickname) VALUES (${r.firstName}, ${r.lastName}, ${r.nickname})`;
	}
	console.log(`Inserted ${rows.length} attendees`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

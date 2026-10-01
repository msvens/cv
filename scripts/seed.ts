import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/server/db/schema';
import { profileSeed, sectionsSeed } from '../src/lib/server/db/seed-data';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error('DATABASE_URL is required');
	process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
	console.log('Seeding database...');

	console.log('  Clearing existing data...');
	await db.delete(schema.sectionItem);
	await db.delete(schema.section);
	await db.delete(schema.profile);

	console.log('  Inserting profile...');
	await db.insert(schema.profile).values(profileSeed);

	console.log('  Inserting sections and items...');
	for (const { section, items } of sectionsSeed) {
		const [inserted] = await db
			.insert(schema.section)
			.values(section)
			.returning({ id: schema.section.id });
		if (items.length > 0) {
			await db
				.insert(schema.sectionItem)
				.values(items.map((item) => ({ ...item, sectionId: inserted.id })));
		}
	}

	console.log('Seeding complete');
	await client.end();
}

main().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});

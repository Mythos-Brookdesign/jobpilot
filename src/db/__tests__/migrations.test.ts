/**
 * @jest-environment node
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { createApplicationsRepository } from '@/db/repositories/applications';
import * as schema from '@/db/schema';

const MIGRATIONS = path.join(__dirname, '../../../drizzle');

/** Kopie des Migrationsordners, die nur die ersten `count` Migrationen kennt */
function migrationsUpTo(count: number) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jobpilot-migrations-'));
  fs.cpSync(MIGRATIONS, dir, { recursive: true });
  const journalPath = path.join(dir, 'meta/_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  journal.entries = journal.entries.slice(0, count);
  fs.writeFileSync(journalPath, JSON.stringify(journal));
  return dir;
}

describe('Migrationen', () => {
  it('übernimmt Daten aus Phase 1 und benennt „sent“ in „applied“ um', () => {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite, { schema });

    // Stand nach Phase 1 mit einer gespeicherten Bewerbung
    migrate(db, { migrationsFolder: migrationsUpTo(1) });
    sqlite.exec(`
      INSERT INTO applications (id, company, role, location, applied_at, status, created_at, updated_at)
      VALUES ('alt', 'Altfirma', 'Dev', 'Köln', '2026-09-01', 'sent', '2026-09-01T09:00:00Z', '2026-09-01T09:00:00Z');
      INSERT INTO status_events (application_id, from_status, to_status, at)
      VALUES ('alt', NULL, 'sent', '2026-09-01T09:00:00Z'),
             ('alt', 'sent', 'interview', '2026-09-05T09:00:00Z');
    `);

    // Update auf den aktuellen Stand
    migrate(db, { migrationsFolder: MIGRATIONS });
    const repository = createApplicationsRepository(db);

    expect(repository.get('alt')).toEqual({
      id: 'alt',
      company: 'Altfirma',
      role: 'Dev',
      location: 'Köln',
      appliedAt: '2026-09-01',
      status: 'applied',
      priority: 'normal',
    });
    expect(repository.statusEvents('alt').map((e) => [e.from, e.to])).toEqual([
      [null, 'applied'],
      ['applied', 'interview'],
    ]);
  });
});

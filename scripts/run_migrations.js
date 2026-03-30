import path from 'path';
import { paths } from '#utils/paths.js';
import fs from 'fs';
import Database from 'better-sqlite3';
export const db = new Database(path.join(paths.db, 'discord.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

export function runMigrations() {
    const migrationDir = path.join(paths.db, '/migrations');
    const files = fs.readdirSync(migrationDir).sort();

    const applied = db
        .prepare('SELECT name FROM migrations')
        .all()
        .map((r) => r.name);
    const insert = db.prepare('INSERT INTO migrations (name) VALUES (?)');

    for (const file of files) {
        if (!applied.includes(file)) {
            console.log(`Applying migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
            db.exec(sql);
            insert.run(file);
        }
    }
}

runMigrations();

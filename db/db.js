import { paths } from '#utils/paths.js';
import path from 'path';
import Database from 'better-sqlite3';

export const db = new Database(path.join(paths.db, 'discord.db'));

import { Database } from "bun:sqlite";

export function createDb(path = process.env.DB_PATH ?? "todos.db") {
    const db = new Database(path, { create: true });

    db.run(`
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            done INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}
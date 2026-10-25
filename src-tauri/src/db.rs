//! SQLite schema for app data (docs/datenmodell.md). The frontend talks to the database through
//! tauri-plugin-sql (`src/lib/native/database.ts`); migrations run when it loads the database.

use tauri_plugin_sql::{Migration, MigrationKind};

/// Must match `DATABASE_URL` in `src/lib/native/database.ts`.
pub const DATABASE_URL: &str = "sqlite:trading-dashboard.db";

pub fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create watchlists",
        sql: "
            CREATE TABLE watchlists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                position INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE watchlist_items (
                watchlist_id TEXT NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
                instrument_key TEXT NOT NULL,
                instrument TEXT NOT NULL,
                position INTEGER NOT NULL,
                PRIMARY KEY (watchlist_id, instrument_key)
            );
        ",
        kind: MigrationKind::Up,
    }]
}

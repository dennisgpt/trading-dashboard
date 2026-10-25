// SQLite access through tauri-plugin-sql. The schema lives in Rust migrations (src-tauri/src/db.rs).
import Database from "@tauri-apps/plugin-sql";
import { instrumentKey, type Instrument } from "@/core/market/types";
import type { WatchlistRepository } from "@/stores/watchlist";

/** Must match the database URL the migrations are registered for in Rust. */
export const DATABASE_URL = "sqlite:trading-dashboard.db";

let connection: Promise<Database> | null = null;

export function database(): Promise<Database> {
  connection ??= Database.load(DATABASE_URL);
  return connection;
}

const DEFAULT_WATCHLIST_ID = "default";

/** Watchlist persisted in SQLite (tables `watchlists` and `watchlist_items`). */
export function sqliteWatchlistRepository(watchlistId = DEFAULT_WATCHLIST_ID): WatchlistRepository {
  return {
    async load() {
      const db = await database();
      const lists = await db.select<{ id: string }[]>("SELECT id FROM watchlists WHERE id = $1", [watchlistId]);
      if (lists.length === 0) return null;
      const rows = await db.select<{ instrument: string }[]>(
        "SELECT instrument FROM watchlist_items WHERE watchlist_id = $1 ORDER BY position",
        [watchlistId],
      );
      return rows.map((row) => JSON.parse(row.instrument) as Instrument);
    },

    async add(instrument, position) {
      const db = await database();
      await db.execute("INSERT OR IGNORE INTO watchlists (id, name, position) VALUES ($1, $2, 0)", [watchlistId, "Watchlist"]);
      await db.execute(
        "INSERT OR REPLACE INTO watchlist_items (watchlist_id, instrument_key, instrument, position) VALUES ($1, $2, $3, $4)",
        [watchlistId, instrumentKey(instrument), JSON.stringify(instrument), position],
      );
    },

    async remove(key) {
      const db = await database();
      await db.execute("DELETE FROM watchlist_items WHERE watchlist_id = $1 AND instrument_key = $2", [watchlistId, key]);
    },
  };
}

import Database from 'better-sqlite3';
import path from 'path';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath = dbPath || path.join(process.cwd(), 'domain-manager.db');
    this.db = new Database(resolvedPath);
    this.initialize();
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS api_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL UNIQUE,
        credentials TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS command_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_input TEXT NOT NULL,
        parsed_command TEXT,
        result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Settings
  getSetting(key: string): string | null {
    const row = this.db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key) as { value: string } | undefined;
    return row?.value || null;
  }

  setSetting(key: string, value: string): void {
    this.db
      .prepare(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`
      )
      .run(key, value, value);
  }

  // API Credentials
  getCredentials(provider: string): string | null {
    const row = this.db
      .prepare('SELECT credentials FROM api_credentials WHERE provider = ?')
      .get(provider) as { credentials: string } | undefined;
    return row?.credentials || null;
  }

  setCredentials(provider: string, credentials: object): void {
    const credentialsJson = JSON.stringify(credentials);
    this.db
      .prepare(
        `INSERT INTO api_credentials (provider, credentials, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(provider) DO UPDATE SET credentials = ?, updated_at = CURRENT_TIMESTAMP`
      )
      .run(provider, credentialsJson, credentialsJson);
  }

  deleteCredentials(provider: string): void {
    this.db
      .prepare('DELETE FROM api_credentials WHERE provider = ?')
      .run(provider);
  }

  getAllCredentials(): { provider: string; hasCredentials: boolean }[] {
    const rows = this.db
      .prepare('SELECT provider FROM api_credentials')
      .all() as { provider: string }[];

    return ['cloudflare', 'porkbun', 'gemini'].map((provider) => ({
      provider,
      hasCredentials: rows.some((r) => r.provider === provider),
    }));
  }

  // Command History
  addCommandHistory(
    userInput: string,
    parsedCommand: object | null,
    result: object | null
  ): void {
    this.db
      .prepare(
        `INSERT INTO command_history (user_input, parsed_command, result)
         VALUES (?, ?, ?)`
      )
      .run(
        userInput,
        parsedCommand ? JSON.stringify(parsedCommand) : null,
        result ? JSON.stringify(result) : null
      );
  }

  getCommandHistory(limit: number = 50): {
    id: number;
    userInput: string;
    parsedCommand: string | null;
    result: string | null;
    createdAt: string;
  }[] {
    return this.db
      .prepare(
        `SELECT id, user_input as userInput, parsed_command as parsedCommand,
                result, created_at as createdAt
         FROM command_history
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(limit) as {
        id: number;
        userInput: string;
        parsedCommand: string | null;
        result: string | null;
        createdAt: string;
      }[];
  }

  close(): void {
    this.db.close();
  }
}

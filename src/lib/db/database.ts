import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

export class DatabaseService {
    private static instance: DatabaseService;
    private sqlite: SQLiteConnection;
    private db: SQLiteDBConnection | null = null;
    private dbName = 'kkfoodbilling';

    private constructor() {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async initialize(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            console.log("Web platform detected: Skipping SQLite initialization (or use jeep-sqlite if configured)");
            return;
        }

        try {
            this.db = await this.sqlite.createConnection(
                this.dbName,
                false,
                'no-encryption',
                1,
                false
            );

            await this.db.open();

            const schema = `
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          sku TEXT,
          name TEXT,
          category TEXT,
          price REAL,
          costPrice REAL,
          stock INTEGER,
          lowStockThreshold INTEGER,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bills (
          id TEXT PRIMARY KEY,
          billNumber TEXT,
          date TEXT,
          customerName TEXT,
          customerEmail TEXT,
          total REAL,
          status TEXT,
          createdBy TEXT,
          datetime TEXT DEFAULT CURRENT_TIMESTAMP,
          data TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
          email TEXT PRIMARY KEY,
          name TEXT,
          role TEXT,
          password TEXT,
          isApproved INTEGER,
          isActive INTEGER DEFAULT 1,
          accessType TEXT DEFAULT 'mobile',
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT,
          mobile TEXT UNIQUE,
          email TEXT,
          balance REAL,
          createdBy TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `;

            await this.db.execute(schema);
            console.log("SQLite Database initialized successfully");

        } catch (error) {
            console.error("Error initializing SQLite database:", error);
            throw error;
        }
    }

    public async getDB(): Promise<SQLiteDBConnection> {
        if (!this.db) {
            await this.initialize();
        }
        if (!this.db) {
            throw new Error("Database not initialized");
        }
        return this.db;
    }

    public async execute(statement: string, values?: any[]): Promise<any> {
        const db = await this.getDB();
        return db.execute(statement, false);
    }

    public async run(statement: string, values?: any[]): Promise<any> {
        const db = await this.getDB();
        return db.run(statement, values);
    }

    public async query(statement: string, values?: any[]): Promise<any[]> {
        const db = await this.getDB();
        const result = await db.query(statement, values);
        return result.values || [];
    }
}

export const databaseService = DatabaseService.getInstance();

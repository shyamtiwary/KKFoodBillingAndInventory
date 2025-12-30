import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

export class DatabaseService {
    private static instance: DatabaseService;
    private sqlite: SQLiteConnection | null = null;
    private db: SQLiteDBConnection | null = null;
    private dbName = 'kkfoodbilling';
    private isInitialized = false;

    private constructor() {
        // Don't initialize SQLiteConnection here - wait for initialize() to be called
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async initialize(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            console.log("Web platform detected: Skipping SQLite initialization");
            return;
        }

        if (this.isInitialized) {
            console.log("Database already initialized");
            return;
        }

        try {
            // Initialize SQLiteConnection only when we're sure the platform is ready
            this.sqlite = new SQLiteConnection(CapacitorSQLite);

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
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
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

            // ===== COMPREHENSIVE SCHEMA MIGRATIONS =====
            // This ensures ALL columns exist, even if the app was updated from an older version

            // Products table - Add ALL possible columns
            try { await this.db.execute('ALTER TABLE products ADD COLUMN id TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE products ADD COLUMN sku TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE products ADD COLUMN name TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE products ADD COLUMN category TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE products ADD COLUMN price REAL;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE products ADD COLUMN costPrice REAL;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE products ADD COLUMN stock INTEGER;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE products ADD COLUMN lowStockThreshold INTEGER;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE products ADD COLUMN createdAt TEXT DEFAULT CURRENT_TIMESTAMP;'); } catch (e) { /* ignore if exists */ }

            // Bills table - Add ALL possible columns
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN id TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN billNumber TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN date TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN customerName TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN customerEmail TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN customerMobile TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN total REAL;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN status TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN createdBy TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN datetime TEXT DEFAULT CURRENT_TIMESTAMP;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE bills ADD COLUMN data TEXT;'); } catch (e) { /* ignore if exists */ }

            // Users table - Add ALL possible columns
            try { await this.db.execute('ALTER TABLE users ADD COLUMN id TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE users ADD COLUMN email TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE users ADD COLUMN name TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE users ADD COLUMN role TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE users ADD COLUMN password TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE users ADD COLUMN isApproved INTEGER;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE users ADD COLUMN isActive INTEGER DEFAULT 1;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE users ADD COLUMN accessType TEXT DEFAULT "mobile";'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE users ADD COLUMN createdAt TEXT DEFAULT CURRENT_TIMESTAMP;'); } catch (e) { /* ignore if exists */ }

            // Customers table - Add ALL possible columns
            try { await this.db.execute('ALTER TABLE customers ADD COLUMN id TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE customers ADD COLUMN name TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE customers ADD COLUMN mobile TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE customers ADD COLUMN email TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE customers ADD COLUMN balance REAL;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE customers ADD COLUMN createdBy TEXT;'); } catch (e) { /* ignore if exists */ }
            try { await this.db.execute('ALTER TABLE customers ADD COLUMN createdAt TEXT DEFAULT CURRENT_TIMESTAMP;'); } catch (e) { /* ignore if exists */ }

            this.isInitialized = true;
            console.log("SQLite Database initialized successfully with all schema migrations applied");

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

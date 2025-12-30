using System.Data;
using System.Text.Json;
using Dapper;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Models;

namespace KKFoodBilling.Backend.Data;

public class DatabaseInitializer
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _configuration;

    public DatabaseInitializer(IDbConnectionFactory connectionFactory, IWebHostEnvironment env, IConfiguration configuration)
    {
        _connectionFactory = connectionFactory;
        _env = env;
        _configuration = configuration;
    }

    public void Initialize()
    {
        using var connection = _connectionFactory.CreateConnection();
        connection.Open();

        CreateTables(connection);
        MigrateTables(connection);
        SeedData(connection);
    }

    private void CreateTables(IDbConnection connection)
    {
        var provider = _configuration["DatabaseProvider"] ?? "SQLite";
        var isPostgreSQL = provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase);

        if (isPostgreSQL)
        {
            // PostgreSQL Schema (Lowercase for case-insensitivity)
            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    sku TEXT,
                    category TEXT,
                    costprice NUMERIC(10,2),
                    sellprice NUMERIC(10,2),
                    stock NUMERIC(10,2),
                    lowstockthreshold INTEGER,
                    lowstockthreshold INTEGER,
                    isdeleted BOOLEAN DEFAULT FALSE,
                    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )");

            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS bills (
                    id TEXT PRIMARY KEY,
                    billnumber TEXT,
                    customername TEXT,
                    customeremail TEXT,
                    customermobile TEXT,
                    date TEXT,
                    subtotal NUMERIC(10,2),
                    discountamount NUMERIC(10,2),
                    discountpercentage NUMERIC(10,2),
                    taxamount NUMERIC(10,2),
                    total NUMERIC(10,2),
                    amountpaid NUMERIC(10,2),
                    status TEXT,
                    createdby TEXT,
                    datetime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )");

            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS billitems (
                    id SERIAL PRIMARY KEY,
                    billid TEXT,
                    productid TEXT,
                    productname TEXT,
                    quantity NUMERIC(10,2),
                    price NUMERIC(10,2),
                    total NUMERIC(10,2)
                )");

            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT,
                    email TEXT PRIMARY KEY,
                    role TEXT,
                    name TEXT,
                    password TEXT,
                    isapproved BOOLEAN,
                    isactive BOOLEAN DEFAULT TRUE,
                    accesstype TEXT DEFAULT 'web',
                    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )");

            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS customers (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    mobile TEXT UNIQUE,
                    email TEXT,
                    balance NUMERIC(10,2),
                    createdby TEXT DEFAULT 'admin',
                    createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )");
        }
        else
        {
            // SQLite Schema
            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS Products (
                    Id TEXT PRIMARY KEY,
                    Name TEXT,
                    Sku TEXT,
                    Category TEXT,
                    CostPrice REAL,
                    SellPrice REAL,
                    Stock REAL,
                    LowStockThreshold INTEGER,
                    LowStockThreshold INTEGER,
                    IsDeleted INTEGER DEFAULT 0,
                    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
                )");

            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS Bills (
                    Id TEXT PRIMARY KEY,
                    BillNumber TEXT,
                    CustomerName TEXT,
                    CustomerEmail TEXT,
                    CustomerMobile TEXT,
                    Date TEXT,
                    Subtotal REAL,
                    DiscountAmount REAL,
                    DiscountPercentage REAL,
                    TaxAmount REAL,
                    Total REAL,
                    AmountPaid REAL,
                    Status TEXT,
                    CreatedBy TEXT,
                    DateTime TEXT DEFAULT CURRENT_TIMESTAMP
                )");

            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS BillItems (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    BillId TEXT,
                    ProductId TEXT,
                    ProductName TEXT,
                    Quantity REAL,
                    Price REAL,
                    Total REAL
                )");

            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS Users (
                    Id TEXT,
                    Email TEXT PRIMARY KEY,
                    Role TEXT,
                    Name TEXT,
                    Password TEXT,
                    IsApproved INTEGER,
                    IsActive INTEGER DEFAULT 1,
                    AccessType TEXT DEFAULT 'web',
                    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
                )");

            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS Customers (
                    Id TEXT PRIMARY KEY,
                    Name TEXT,
                    Mobile TEXT UNIQUE,
                    Email TEXT,
                    Balance REAL,
                    CreatedBy TEXT DEFAULT 'admin',
                    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP
                )");
        }
    }


    private void MigrateTables(IDbConnection connection)
    {
        var provider = _configuration["DatabaseProvider"] ?? "SQLite";
        var isPostgreSQL = provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase);

        if (isPostgreSQL)
        {
            // PostgreSQL Migrations - Add ALL possible columns
            // Products table
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS id TEXT");
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT");
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT");
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT");
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS costprice NUMERIC(10,2)");
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS sellprice NUMERIC(10,2)");
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS stock NUMERIC(10,2)");
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS lowstockthreshold INTEGER");
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS lowstockthreshold INTEGER");
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS isdeleted BOOLEAN DEFAULT FALSE");
            connection.Execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP");

            // Bills table
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS id TEXT");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS billnumber TEXT");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS customername TEXT");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS customeremail TEXT");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS customermobile TEXT");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS date TEXT");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2)");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS discountamount NUMERIC(10,2)");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS discountpercentage NUMERIC(10,2)");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS taxamount NUMERIC(10,2)");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS total NUMERIC(10,2)");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS amountpaid NUMERIC(10,2)");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS status TEXT");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS createdby TEXT");
            connection.Execute("ALTER TABLE bills ADD COLUMN IF NOT EXISTS datetime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP");

            // BillItems table
            connection.Execute("ALTER TABLE billitems ADD COLUMN IF NOT EXISTS billid TEXT");
            connection.Execute("ALTER TABLE billitems ADD COLUMN IF NOT EXISTS productid TEXT");
            connection.Execute("ALTER TABLE billitems ADD COLUMN IF NOT EXISTS productname TEXT");
            connection.Execute("ALTER TABLE billitems ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2)");
            connection.Execute("ALTER TABLE billitems ADD COLUMN IF NOT EXISTS price NUMERIC(10,2)");
            connection.Execute("ALTER TABLE billitems ADD COLUMN IF NOT EXISTS total NUMERIC(10,2)");

            // Users table
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS id TEXT");
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT");
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT");
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT");
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT");
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS isapproved BOOLEAN DEFAULT FALSE");
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS isactive BOOLEAN DEFAULT TRUE");
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS accesstype TEXT DEFAULT 'web'");
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS accesstype TEXT DEFAULT 'web'");
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS isdeleted BOOLEAN DEFAULT FALSE");
            connection.Execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP");

            // Customers table
            connection.Execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS id TEXT");
            connection.Execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS name TEXT");
            connection.Execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile TEXT");
            connection.Execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT");
            connection.Execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS balance NUMERIC(10,2)");
            connection.Execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS createdby TEXT DEFAULT 'admin'");
            connection.Execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS createdby TEXT DEFAULT 'admin'");
            connection.Execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS isdeleted BOOLEAN DEFAULT FALSE");
            connection.Execute("ALTER TABLE customers ADD COLUMN IF NOT EXISTS createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP");
        }
        else
        {
            // SQLite Migrations - Add ALL possible columns
            // Products table
            try { connection.Execute("ALTER TABLE Products ADD COLUMN Id TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Products ADD COLUMN Name TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Products ADD COLUMN Sku TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Products ADD COLUMN Category TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Products ADD COLUMN CostPrice REAL"); } catch { }
            try { connection.Execute("ALTER TABLE Products ADD COLUMN SellPrice REAL"); } catch { }
            try { connection.Execute("ALTER TABLE Products ADD COLUMN Stock REAL"); } catch { }
            try { connection.Execute("ALTER TABLE Products ADD COLUMN LowStockThreshold INTEGER"); } catch { }
            try { connection.Execute("ALTER TABLE Products ADD COLUMN LowStockThreshold INTEGER"); } catch { }
            try { connection.Execute("ALTER TABLE Products ADD COLUMN IsDeleted INTEGER DEFAULT 0"); } catch { }
            try { connection.Execute("ALTER TABLE Products ADD COLUMN CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP"); } catch { }

            // Bills table
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN Id TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN BillNumber TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN CustomerName TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN CustomerEmail TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN CustomerMobile TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN Date TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN Subtotal REAL"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN DiscountAmount REAL"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN DiscountPercentage REAL"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN TaxAmount REAL"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN Total REAL"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN AmountPaid REAL"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN Status TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN CreatedBy TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Bills ADD COLUMN DateTime TEXT DEFAULT CURRENT_TIMESTAMP"); } catch { }

            // BillItems table
            try { connection.Execute("ALTER TABLE BillItems ADD COLUMN BillId TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE BillItems ADD COLUMN ProductId TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE BillItems ADD COLUMN ProductName TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE BillItems ADD COLUMN Quantity REAL"); } catch { }
            try { connection.Execute("ALTER TABLE BillItems ADD COLUMN Price REAL"); } catch { }
            try { connection.Execute("ALTER TABLE BillItems ADD COLUMN Total REAL"); } catch { }

            // Users table
            try { connection.Execute("ALTER TABLE Users ADD COLUMN Id TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Users ADD COLUMN Email TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Users ADD COLUMN Role TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Users ADD COLUMN Name TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Users ADD COLUMN Password TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Users ADD COLUMN IsApproved INTEGER DEFAULT 0"); } catch { }
            try { connection.Execute("ALTER TABLE Users ADD COLUMN IsActive INTEGER DEFAULT 1"); } catch { }
            try { connection.Execute("ALTER TABLE Users ADD COLUMN AccessType TEXT DEFAULT 'web'"); } catch { }
            try { connection.Execute("ALTER TABLE Users ADD COLUMN AccessType TEXT DEFAULT 'web'"); } catch { }
            try { connection.Execute("ALTER TABLE Users ADD COLUMN IsDeleted INTEGER DEFAULT 0"); } catch { }
            try { connection.Execute("ALTER TABLE Users ADD COLUMN CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP"); } catch { }

            // Customers table
            try { connection.Execute("ALTER TABLE Customers ADD COLUMN Id TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Customers ADD COLUMN Name TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Customers ADD COLUMN Mobile TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Customers ADD COLUMN Email TEXT"); } catch { }
            try { connection.Execute("ALTER TABLE Customers ADD COLUMN Balance REAL"); } catch { }
            try { connection.Execute("ALTER TABLE Customers ADD COLUMN CreatedBy TEXT DEFAULT 'admin'"); } catch { }
            try { connection.Execute("ALTER TABLE Customers ADD COLUMN CreatedBy TEXT DEFAULT 'admin'"); } catch { }
            try { connection.Execute("ALTER TABLE Customers ADD COLUMN IsDeleted INTEGER DEFAULT 0"); } catch { }
            try { connection.Execute("ALTER TABLE Customers ADD COLUMN CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP"); } catch { }
        }
    }


    private void SeedData(IDbConnection connection)
    {
        var provider = _configuration["DatabaseProvider"] ?? "SQLite";
        var isPostgreSQL = provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase);

        // Check if products empty
        var productCount = connection.ExecuteScalar<int>($"SELECT COUNT(*) FROM {(isPostgreSQL ? "products" : "Products")}");
        if (productCount == 0)
        {
            var productsPath = Path.Combine(_env.ContentRootPath, "Data", "products.json");
            if (File.Exists(productsPath))
            {
                var json = File.ReadAllText(productsPath);
                var products = JsonSerializer.Deserialize<List<Product>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (products != null)
                {
                    foreach (var p in products)
                    {
                        connection.Execute($@"
                            INSERT INTO {(isPostgreSQL ? "products" : "Products")} ({(isPostgreSQL ? "id, name, sku, category, costprice, sellprice, stock, lowstockthreshold, createdat" : "Id, Name, Sku, Category, CostPrice, SellPrice, Stock, LowStockThreshold, CreatedAt")})
                            VALUES (@Id, @Name, @Sku, @Category, @CostPrice, @SellPrice, @Stock, @LowStockThreshold, @CreatedAt)",
                            p);
                    }
                }
            }
        }
        
        // Check bills
        var billCount = connection.ExecuteScalar<int>($"SELECT COUNT(*) FROM {(isPostgreSQL ? "bills" : "Bills")}");
        if (billCount == 0)
        {
            var billsPath = Path.Combine(_env.ContentRootPath, "Data", "bills.json");
            if (File.Exists(billsPath))
            {
                var json = File.ReadAllText(billsPath);
                var bills = JsonSerializer.Deserialize<List<Bill>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (bills != null)
                {
                    foreach (var b in bills)
                    {
                        // Insert Bill
                        connection.Execute($@"
                            INSERT INTO {(isPostgreSQL ? "bills" : "Bills")} ({(isPostgreSQL ? "id, billnumber, customername, customeremail, customermobile, date, datetime, subtotal, discountamount, discountpercentage, taxamount, total, amountpaid, status, createdby" : "Id, BillNumber, CustomerName, CustomerEmail, CustomerMobile, Date, DateTime, Subtotal, DiscountAmount, DiscountPercentage, TaxAmount, Total, AmountPaid, Status, CreatedBy")})
                            VALUES (@Id, @BillNumber, @CustomerName, @CustomerEmail, @CustomerMobile, @Date, @DateTime, @Subtotal, @DiscountAmount, @DiscountPercentage, @TaxAmount, @Total, @AmountPaid, @Status, @CreatedBy)",
                            b);

                        foreach (var item in b.Items)
                        {
                            connection.Execute($@"
                                INSERT INTO {(isPostgreSQL ? "billitems" : "BillItems")} ({(isPostgreSQL ? "billid, productid, productname, quantity, price, total" : "BillId, ProductId, ProductName, Quantity, Price, Total")})
                                VALUES (@BillId, @ProductId, @ProductName, @Quantity, @Price, @Total)",
                                new { BillId = b.Id, item.ProductId, item.ProductName, item.Quantity, item.Price, item.Total });
                        }
                    }
                }
            }
        }

        // Check users
        var users = connection.Query<User>($"SELECT * FROM {(isPostgreSQL ? "users" : "Users")}").ToList();
        Console.WriteLine($"[DatabaseInitializer] Current user count: {users.Count}");
        
        // Ensure default admin exists
        var adminUser = users.FirstOrDefault(u => u.Email.ToLower() == "admin");
        if (adminUser == null)
        {
            Console.WriteLine("[DatabaseInitializer] Admin user missing. Seeding admin...");
            connection.Execute($@"
                INSERT INTO {(isPostgreSQL ? "users" : "Users")} ({(isPostgreSQL ? "id, email, role, name, password, isapproved, isactive, accesstype, createdat" : "Id, Email, Role, Name, Password, IsApproved, IsActive, AccessType, CreatedAt")})
                VALUES (@Id, @Email, @Role, @Name, @Password, @IsApproved, @IsActive, @AccessType, @CreatedAt)",
                new { Id = Guid.NewGuid().ToString(), Email = "admin", Role = "admin", Name = "Admin User", Password = "admin@123#", IsApproved = true, IsActive = true, AccessType = "web", CreatedAt = DateTime.UtcNow });
        }
        else if (adminUser.Password == "password" || string.IsNullOrEmpty(adminUser.Password))
        {
            // Ensure default admin has 'password' if it was somehow corrupted or empty
            connection.Execute($"UPDATE {(isPostgreSQL ? "users" : "Users")} SET {(isPostgreSQL ? "password" : "Password")} = 'admin@123#', {(isPostgreSQL ? "isapproved" : "IsApproved")} = {(isPostgreSQL ? "true" : "1")}, {(isPostgreSQL ? "isactive" : "IsActive")} = {(isPostgreSQL ? "true" : "1")}, {(isPostgreSQL ? "accesstype" : "AccessType")} = 'web' WHERE {(isPostgreSQL ? "email" : "Email")} = 'admin'");
        }

        if (users.Count <= 1) // Only seed others if it's a fresh DB or only admin exists
        {
            Console.WriteLine("[DatabaseInitializer] Seeding default manager and staff...");
            
            if (!users.Any(u => u.Email.ToLower() == "manager"))
            {
                connection.Execute($@"
                    INSERT INTO {(isPostgreSQL ? "users" : "Users")} ({(isPostgreSQL ? "id, email, role, name, password, isapproved, isactive, accesstype, createdat" : "Id, Email, Role, Name, Password, IsApproved, IsActive, AccessType, CreatedAt")})
                    VALUES (@Id, @Email, @Role, @Name, @Password, @IsApproved, @IsActive, @AccessType, @CreatedAt)",
                    new { Id = Guid.NewGuid().ToString(), Email = "manager", Role = "manager", Name = "Manager User", Password = "password", IsApproved = true, IsActive = true, AccessType = "web", CreatedAt = DateTime.UtcNow });
            }

            if (!users.Any(u => u.Email.ToLower() == "staff"))
            {
                connection.Execute($@"
                    INSERT INTO {(isPostgreSQL ? "users" : "Users")} ({(isPostgreSQL ? "id, email, role, name, password, isapproved, isactive, accesstype, createdat" : "Id, Email, Role, Name, Password, IsApproved, IsActive, AccessType, CreatedAt")})
                    VALUES (@Id, @Email, @Role, @Name, @Password, @IsApproved, @IsActive, @AccessType, @CreatedAt)",
                    new { Id = Guid.NewGuid().ToString(), Email = "staff", Role = "staff", Name = "Staff User", Password = "password", IsApproved = true, IsActive = true, AccessType = "web", CreatedAt = DateTime.UtcNow });
            }
            
            Console.WriteLine("[DatabaseInitializer] Default users checked/seeded successfully.");
        }
    }
}

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

    public DatabaseInitializer(IDbConnectionFactory connectionFactory, IWebHostEnvironment env)
    {
        _connectionFactory = connectionFactory;
        _env = env;
    }

    public void Initialize()
    {
        using var connection = _connectionFactory.CreateConnection();
        connection.Open();

        CreateTables(connection);
        SeedData(connection);
    }

    private void CreateTables(IDbConnection connection)
    {
        // Products
        connection.Execute(@"
            CREATE TABLE IF NOT EXISTS Products (
                Id TEXT PRIMARY KEY,
                Name TEXT,
                Sku TEXT,
                Category TEXT,
                CostPrice REAL,
                SellPrice REAL,
                Stock REAL,
                LowStockThreshold INTEGER
            )");

        // Bills
        connection.Execute(@"
            CREATE TABLE IF NOT EXISTS Bills (
                Id TEXT PRIMARY KEY,
                BillNumber TEXT,
                CustomerName TEXT,
                CustomerEmail TEXT,
                Date TEXT,
                Subtotal REAL,
                DiscountAmount REAL,
                DiscountPercentage REAL,
                TaxAmount REAL,
                Total REAL,
                Status TEXT,
                CreatedBy TEXT
            )");

        // BillItems
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
    }

    private void SeedData(IDbConnection connection)
    {
        // Check if Products empty
        var productCount = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM Products");
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
                        connection.Execute(@"
                            INSERT INTO Products (Id, Name, Sku, Category, CostPrice, SellPrice, Stock, LowStockThreshold)
                            VALUES (@Id, @Name, @Sku, @Category, @CostPrice, @SellPrice, @Stock, @LowStockThreshold)",
                            p);
                    }
                }
            }
        }
        
        // Check Bills
        var billCount = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM Bills");
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
                        connection.Execute(@"
                            INSERT INTO Bills (Id, BillNumber, CustomerName, CustomerEmail, Date, Subtotal, DiscountAmount, DiscountPercentage, TaxAmount, Total, Status, CreatedBy)
                            VALUES (@Id, @BillNumber, @CustomerName, @CustomerEmail, @Date, @Subtotal, @DiscountAmount, @DiscountPercentage, @TaxAmount, @Total, @Status, @CreatedBy)",
                            b);

                        foreach (var item in b.Items)
                        {
                            connection.Execute(@"
                                INSERT INTO BillItems (BillId, ProductId, ProductName, Quantity, Price, Total)
                                VALUES (@BillId, @ProductId, @ProductName, @Quantity, @Price, @Total)",
                                new { BillId = b.Id, item.ProductId, item.ProductName, item.Quantity, item.Price, item.Total });
                        }
                    }
                }
            }
        }
    }
}

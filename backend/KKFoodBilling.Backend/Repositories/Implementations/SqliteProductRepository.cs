using System.Data;
using Dapper;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;

namespace KKFoodBilling.Backend.Repositories.Implementations;

public class SqliteProductRepository : IProductRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public SqliteProductRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Product>> GetAllAsync(bool includeDeleted = false)
    {
        using var connection = _connectionFactory.CreateConnection();
        string sql = "SELECT * FROM Products";
        if (!includeDeleted)
        {
            sql += " WHERE IsDeleted = 0";
        }
        return await connection.QueryAsync<Product>(sql);
    }

    public async Task<Product?> GetByIdAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<Product>("SELECT * FROM Products WHERE Id = @Id", new { Id = id });
    }

    public async Task<Product> AddAsync(Product product)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO Products (Id, Name, Sku, Category, CostPrice, SellPrice, Stock, LowStockThreshold, CreatedAt, IsDeleted) 
            VALUES (@Id, @Name, @Sku, @Category, @CostPrice, @SellPrice, @Stock, @LowStockThreshold, @CreatedAt, @IsDeleted)";

        await connection.ExecuteAsync(sql, product);
        return product;
    }

    public async Task<bool> UpdateAsync(Product product)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE Products 
            SET Name = @Name, Sku = @Sku, Category = @Category, CostPrice = @CostPrice, SellPrice = @SellPrice, Stock = @Stock, LowStockThreshold = @LowStockThreshold, CreatedAt = @CreatedAt, IsDeleted = @IsDeleted
            WHERE Id = @Id";

        var rows = await connection.ExecuteAsync(sql, product);
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = "UPDATE Products SET IsDeleted = 1 WHERE Id = @Id";
        var rows = await connection.ExecuteAsync(sql, new { Id = id });
        return rows > 0;
    }
}

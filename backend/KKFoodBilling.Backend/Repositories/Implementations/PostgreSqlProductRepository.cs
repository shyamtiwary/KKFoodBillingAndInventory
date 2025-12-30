using System.Data;
using Dapper;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;

namespace KKFoodBilling.Backend.Repositories.Implementations;

public class PostgreSqlProductRepository : IProductRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public PostgreSqlProductRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Product>> GetAllAsync(bool includeDeleted = false)
    {
        using var connection = _connectionFactory.CreateConnection();
        string sql = "SELECT * FROM products";
        if (!includeDeleted)
        {
            sql += " WHERE isdeleted = FALSE";
        }
        return await connection.QueryAsync<Product>(sql);
    }

    public async Task<Product?> GetByIdAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<Product>("SELECT * FROM products WHERE id = @Id", new { Id = id });
    }

    public async Task<Product> AddAsync(Product product)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            INSERT INTO products (id, name, sku, category, costprice, sellprice, stock, lowstockthreshold, createdat) 
            VALUES (@Id, @Name, @Sku, @Category, @CostPrice, @SellPrice, @Stock, @LowStockThreshold, @CreatedAt)";

        await connection.ExecuteAsync(sql, product);
        return product;
    }

    public async Task<bool> UpdateAsync(Product product)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = @"
            UPDATE products 
            SET name = @Name, sku = @Sku, category = @Category, costprice = @CostPrice, sellprice = @SellPrice, stock = @Stock, lowstockthreshold = @LowStockThreshold, createdat = @CreatedAt
            WHERE id = @Id";

        var rows = await connection.ExecuteAsync(sql, product);
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = "DELETE FROM products WHERE id = @Id";
        var rows = await connection.ExecuteAsync(sql, new { Id = id });
        return rows > 0;
    }
}

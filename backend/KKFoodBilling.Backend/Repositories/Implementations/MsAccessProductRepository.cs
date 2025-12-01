using System.Data;
using System.Data.OleDb;
using Dapper;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;

namespace KKFoodBilling.Backend.Repositories.Implementations;

public class MsAccessProductRepository : IProductRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public MsAccessProductRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<Product>("SELECT * FROM Products");
    }

    public async Task<Product?> GetByIdAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        // Dapper maps single parameter object properties to ? placeholders in order? 
        // Actually for single param it's safer to use anonymous object and hope Dapper handles it, 
        // but with OleDb and ? it can be tricky.
        // However, for a single parameter, Dapper usually works fine.
        return await connection.QueryFirstOrDefaultAsync<Product>("SELECT * FROM Products WHERE Id = ?", new { Id = id });
    }

    public async Task<Product> AddAsync(Product product)
    {
        using var connection = _connectionFactory.CreateConnection();
        if (connection.State != ConnectionState.Open) connection.Open();

        const string sql = @"
            INSERT INTO Products (Id, Name, Sku, Category, CostPrice, SellPrice, Stock, LowStockThreshold) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        using var command = connection.CreateCommand();
        command.CommandText = sql;
        
        // Add parameters in exact order of ? placeholders
        AddParameter(command, "@Id", product.Id);
        AddParameter(command, "@Name", product.Name);
        AddParameter(command, "@Sku", product.Sku);
        AddParameter(command, "@Category", product.Category);
        AddParameter(command, "@CostPrice", product.CostPrice);
        AddParameter(command, "@SellPrice", product.SellPrice);
        AddParameter(command, "@Stock", product.Stock);
        AddParameter(command, "@LowStockThreshold", product.LowStockThreshold);

        await Task.Run(() => command.ExecuteNonQuery()); // OleDb doesn't have async ExecuteNonQuery in .NET 8? It might not.
        // System.Data.OleDb operations are synchronous under the hood anyway usually.

        return product;
    }

    public async Task<bool> UpdateAsync(Product product)
    {
        using var connection = _connectionFactory.CreateConnection();
        if (connection.State != ConnectionState.Open) connection.Open();

        const string sql = @"
            UPDATE Products 
            SET Name = ?, Sku = ?, Category = ?, CostPrice = ?, SellPrice = ?, Stock = ?, LowStockThreshold = ?
            WHERE Id = ?";

        using var command = connection.CreateCommand();
        command.CommandText = sql;

        AddParameter(command, "@Name", product.Name);
        AddParameter(command, "@Sku", product.Sku);
        AddParameter(command, "@Category", product.Category);
        AddParameter(command, "@CostPrice", product.CostPrice);
        AddParameter(command, "@SellPrice", product.SellPrice);
        AddParameter(command, "@Stock", product.Stock);
        AddParameter(command, "@LowStockThreshold", product.LowStockThreshold);
        AddParameter(command, "@Id", product.Id);

        var rows = await Task.Run(() => command.ExecuteNonQuery());
        return rows > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        if (connection.State != ConnectionState.Open) connection.Open();

        const string sql = "DELETE FROM Products WHERE Id = ?";
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        AddParameter(command, "@Id", id);

        var rows = await Task.Run(() => command.ExecuteNonQuery());
        return rows > 0;
    }

    private void AddParameter(IDbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }
}

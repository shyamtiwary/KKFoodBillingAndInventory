using Dapper;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;

namespace KKFoodBilling.Backend.Repositories.Implementations;

public class PostgreSqlCustomerRepository : ICustomerRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public PostgreSqlCustomerRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<Customer?> GetByIdAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Customer>(
            "SELECT * FROM customers WHERE id = @Id", new { Id = id });
    }

    public async Task<Customer?> GetByMobileAsync(string mobile)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Customer>(
            "SELECT * FROM customers WHERE mobile = @Mobile", new { Mobile = mobile });
    }

    public async Task<IEnumerable<Customer>> GetAllAsync(string? userId = null)
    {
        using var connection = _connectionFactory.CreateConnection();
        string sql = "SELECT * FROM customers";
        if (!string.IsNullOrEmpty(userId))
        {
            sql += " WHERE createdby = @UserId";
        }
        return await connection.QueryAsync<Customer>(sql, new { UserId = userId });
    }

    public async Task AddAsync(Customer customer)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            @"INSERT INTO customers (id, name, mobile, email, balance, createdby, createdat) 
              VALUES (@Id, @Name, @Mobile, @Email, @Balance, @CreatedBy, @CreatedAt)", customer);
    }

    public async Task UpdateAsync(Customer customer)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            @"UPDATE customers SET name = @Name, mobile = @Mobile, email = @Email, balance = @Balance, createdby = @CreatedBy, createdat = @CreatedAt 
              WHERE id = @Id", customer);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync("DELETE FROM customers WHERE id = @Id", new { Id = id });
        return affected > 0;
    }
}

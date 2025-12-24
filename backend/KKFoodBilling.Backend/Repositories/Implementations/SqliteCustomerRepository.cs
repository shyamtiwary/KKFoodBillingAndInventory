using Dapper;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;

namespace KKFoodBilling.Backend.Repositories.Implementations;

public class SqliteCustomerRepository : ICustomerRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public SqliteCustomerRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<Customer?> GetByIdAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Customer>(
            "SELECT * FROM Customers WHERE Id = @Id", new { Id = id });
    }

    public async Task<Customer?> GetByMobileAsync(string mobile)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Customer>(
            "SELECT * FROM Customers WHERE Mobile = @Mobile", new { Mobile = mobile });
    }

    public async Task<IEnumerable<Customer>> GetAllAsync(string? userId = null)
    {
        using var connection = _connectionFactory.CreateConnection();
        string sql = "SELECT * FROM Customers";
        if (!string.IsNullOrEmpty(userId))
        {
            sql += " WHERE CreatedBy = @UserId";
        }
        return await connection.QueryAsync<Customer>(sql, new { UserId = userId });
    }

    public async Task AddAsync(Customer customer)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            @"INSERT INTO Customers (Id, Name, Mobile, Email, Balance, CreatedBy, CreatedAt) 
              VALUES (@Id, @Name, @Mobile, @Email, @Balance, @CreatedBy, @CreatedAt)", customer);
    }

    public async Task UpdateAsync(Customer customer)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            @"UPDATE Customers SET Name = @Name, Mobile = @Mobile, Email = @Email, Balance = @Balance, CreatedBy = @CreatedBy, CreatedAt = @CreatedAt 
              WHERE Id = @Id", customer);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync("DELETE FROM Customers WHERE Id = @Id", new { Id = id });
        return affected > 0;
    }
}

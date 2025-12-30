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

    public async Task<IEnumerable<Customer>> GetAllAsync(string? userId = null, bool includeDeleted = false)
    {
        using var connection = _connectionFactory.CreateConnection();
        string sql = "SELECT * FROM Customers";
        var conditions = new List<string>();
        
        if (!string.IsNullOrEmpty(userId))
        {
            conditions.Add("CreatedBy = @UserId");
        }
        
        if (!includeDeleted)
        {
            conditions.Add("IsDeleted = 0");
        }
        
        if (conditions.Any())
        {
            sql += " WHERE " + string.Join(" AND ", conditions);
        }
        
        return await connection.QueryAsync<Customer>(sql, new { UserId = userId });
    }

    public async Task AddAsync(Customer customer)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            @"INSERT INTO Customers (Id, Name, Mobile, Email, Balance, CreatedBy, CreatedAt, IsDeleted) 
              VALUES (@Id, @Name, @Mobile, @Email, @Balance, @CreatedBy, @CreatedAt, @IsDeleted)", customer);
    }

    public async Task UpdateAsync(Customer customer)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            @"UPDATE Customers SET Name = @Name, Mobile = @Mobile, Email = @Email, Balance = @Balance, CreatedBy = @CreatedBy, CreatedAt = @CreatedAt, IsDeleted = @IsDeleted 
              WHERE Id = @Id", customer);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync("UPDATE Customers SET IsDeleted = 1 WHERE Id = @Id", new { Id = id });
        return affected > 0;
    }
}

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

    public async Task<IEnumerable<Customer>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<Customer>("SELECT * FROM customers");
    }

    public async Task AddAsync(Customer customer)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            @"INSERT INTO customers (id, name, mobile, email, balance) 
              VALUES (@Id, @Name, @Mobile, @Email, @Balance)", customer);
    }

    public async Task UpdateAsync(Customer customer)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            @"UPDATE customers SET name = @Name, mobile = @Mobile, email = @Email, balance = @Balance 
              WHERE id = @Id", customer);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync("DELETE FROM customers WHERE id = @Id", new { Id = id });
        return affected > 0;
    }
}

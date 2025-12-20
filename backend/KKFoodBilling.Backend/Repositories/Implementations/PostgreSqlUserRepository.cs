using System.Data;
using Dapper;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;

namespace KKFoodBilling.Backend.Repositories.Implementations;

public class PostgreSqlUserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public PostgreSqlUserRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(
            "SELECT * FROM Users WHERE \"Email\" = @Email", new { Email = email });
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<User>("SELECT * FROM Users");
    }

    public async Task AddAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(@"
            INSERT INTO Users (""Email"", ""Role"", ""Name"", ""Password"", ""IsApproved"")
            VALUES (@Email, @Role, @Name, @Password, @IsApproved)",
            user);
    }

    public async Task UpdateAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(@"
            UPDATE Users 
            SET ""Role"" = @Role, ""Name"" = @Name, ""Password"" = @Password, ""IsApproved"" = @IsApproved
            WHERE ""Email"" = @Email",
            user);
    }

    public async Task<bool> DeleteAsync(string email)
    {
        using var connection = _connectionFactory.CreateConnection();
        var rowsAffected = await connection.ExecuteAsync(
            "DELETE FROM Users WHERE \"Email\" = @Email", new { Email = email });
        return rowsAffected > 0;
    }
}

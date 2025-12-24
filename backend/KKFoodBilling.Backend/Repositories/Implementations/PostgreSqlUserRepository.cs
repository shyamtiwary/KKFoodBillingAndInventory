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
            "SELECT * FROM users WHERE LOWER(email) = LOWER(@Email)", new { Email = email });
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<User>("SELECT * FROM users");
    }

    public async Task AddAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(@"
            INSERT INTO users (id, email, role, name, password, isapproved, isactive, accesstype, createdat)
            VALUES (@Id, @Email, @Role, @Name, @Password, @IsApproved, @IsActive, @AccessType, @CreatedAt)",
            user);
    }

    public async Task UpdateAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(@"
            UPDATE users 
            SET role = @Role, name = @Name, password = @Password, isapproved = @IsApproved, isactive = @IsActive, accesstype = @AccessType, createdat = @CreatedAt
            WHERE email = @Email",
            user);
    }

    public async Task<bool> DeleteAsync(string email)
    {
        using var connection = _connectionFactory.CreateConnection();
        var rowsAffected = await connection.ExecuteAsync(
            "DELETE FROM users WHERE email = @Email", new { Email = email });
        return rowsAffected > 0;
    }
}

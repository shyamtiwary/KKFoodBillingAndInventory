using System.Data;
using Npgsql;

namespace KKFoodBilling.Backend.Data.Infrastructure;

public class PostgreSqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public PostgreSqlConnectionFactory(IConfiguration configuration)
    {
        // Try DATABASE_URL first (Render's default)
        _connectionString = configuration["DATABASE_URL"] 
                            ?? configuration.GetConnectionString("PostgreSqlConnection")
                            ?? throw new InvalidOperationException(
                                "PostgreSQL connection string not found. " +
                                "Set either DATABASE_URL or ConnectionStrings:PostgreSqlConnection in environment variables.");
    }

    public IDbConnection CreateConnection()
    {
        return new NpgsqlConnection(_connectionString);
    }
}

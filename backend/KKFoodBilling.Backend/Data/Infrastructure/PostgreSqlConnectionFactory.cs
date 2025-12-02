using System.Data;
using Npgsql;

namespace KKFoodBilling.Backend.Data.Infrastructure;

public class PostgreSqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public PostgreSqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("PostgreSqlConnection") 
                            ?? throw new ArgumentNullException("Connection string 'PostgreSqlConnection' not found.");
    }

    public IDbConnection CreateConnection()
    {
        return new NpgsqlConnection(_connectionString);
    }
}

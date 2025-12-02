using System.Data;
using Npgsql;

namespace KKFoodBilling.Backend.Data.Infrastructure;

public class PostgreSqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public PostgreSqlConnectionFactory(IConfiguration configuration)
    {
        // Try DATABASE_URL first (Render's default)
        var connStr = configuration["DATABASE_URL"];
        
        // Fallback to appsettings
        if (string.IsNullOrWhiteSpace(connStr))
        {
            connStr = configuration.GetConnectionString("PostgreSqlConnection");
        }

        if (string.IsNullOrWhiteSpace(connStr))
        {
             throw new InvalidOperationException(
                "PostgreSQL connection string not found. " +
                "Set either DATABASE_URL or ConnectionStrings:PostgreSqlConnection in environment variables.");
        }

        _connectionString = ConvertUrlToConnectionString(connStr);
    }

    public IDbConnection CreateConnection()
    {
        return new NpgsqlConnection(_connectionString);
    }

    private static string ConvertUrlToConnectionString(string url)
    {
        // Check if it's a URI (Render provides postgres://...)
        if (url.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) || 
            url.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            try 
            {
                var uri = new Uri(url);
                var userInfo = uri.UserInfo.Split(':');
                
                var builder = new NpgsqlConnectionStringBuilder
                {
                    Host = uri.Host,
                    Port = uri.Port > 0 ? uri.Port : 5432,
                    Database = uri.AbsolutePath.TrimStart('/'),
                    Username = userInfo[0],
                    Password = userInfo.Length > 1 ? userInfo[1] : null,
                    Pooling = true
                };

                return builder.ToString();
            }
            catch (Exception ex)
            {
                // If parsing fails, log/throw or return original to let Npgsql handle it
                Console.WriteLine($"Warning: Failed to parse connection URL: {ex.Message}");
                return url;
            }
        }

        // Assume it's already a standard connection string (Key=Value;...)
        return url;
    }
}

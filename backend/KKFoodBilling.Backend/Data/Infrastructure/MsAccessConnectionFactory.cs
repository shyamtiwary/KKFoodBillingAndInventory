using System.Data;
using System.Data.OleDb;

namespace KKFoodBilling.Backend.Data.Infrastructure;

public class MsAccessConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public MsAccessConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
                            ?? throw new ArgumentNullException("Connection string 'DefaultConnection' not found.");
    }

    public IDbConnection CreateConnection()
    {
        return new OleDbConnection(_connectionString);
    }
}

using System.Data;

namespace KKFoodBilling.Backend.Data.Infrastructure;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}

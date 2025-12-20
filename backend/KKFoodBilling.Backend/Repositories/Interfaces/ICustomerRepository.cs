using KKFoodBilling.Backend.Models;

namespace KKFoodBilling.Backend.Repositories.Interfaces;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(string id);
    Task<Customer?> GetByMobileAsync(string mobile);
    Task<IEnumerable<Customer>> GetAllAsync();
    Task AddAsync(Customer customer);
    Task UpdateAsync(Customer customer);
    Task<bool> DeleteAsync(string id);
}

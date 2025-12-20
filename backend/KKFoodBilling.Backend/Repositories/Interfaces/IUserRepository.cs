using KKFoodBilling.Backend.Models;

namespace KKFoodBilling.Backend.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<IEnumerable<User>> GetAllAsync();
    Task AddAsync(User user);
    Task UpdateAsync(User user);
    Task<bool> DeleteAsync(string email);
}

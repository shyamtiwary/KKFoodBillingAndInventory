using KKFoodBilling.Backend.Models;

namespace KKFoodBilling.Backend.Repositories.Interfaces;

public interface IBillRepository
{
    Task<IEnumerable<Bill>> GetAllAsync(string? userId = null, bool includeDeleted = false);
    Task<Bill?> GetByIdAsync(string id);
    Task<Bill> AddAsync(Bill bill);
    Task<bool> DeleteAsync(string id);
}

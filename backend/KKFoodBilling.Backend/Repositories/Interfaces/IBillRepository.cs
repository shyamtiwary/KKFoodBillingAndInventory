using KKFoodBilling.Backend.Models;

namespace KKFoodBilling.Backend.Repositories.Interfaces;

public interface IBillRepository
{
    Task<IEnumerable<Bill>> GetAllAsync();
    Task<Bill?> GetByIdAsync(string id);
    Task<Bill> AddAsync(Bill bill);
}

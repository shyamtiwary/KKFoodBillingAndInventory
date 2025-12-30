namespace KKFoodBilling.Backend.Models;

public class Product
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal CostPrice { get; set; }
    public decimal SellPrice { get; set; }
    public decimal Stock { get; set; }
    public int LowStockThreshold { get; set; } = 10;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
}

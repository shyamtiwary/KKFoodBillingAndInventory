namespace KKFoodBilling.Backend.Models;

public class Bill
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string BillNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerMobile { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public DateTime? DateTime { get; set; }
    public List<BillItem> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
    public decimal AmountPaid { get; set; }
    public string Status { get; set; } = "paid";
    public string CreatedBy { get; set; } = string.Empty;
    public bool IsDeleted { get; set; } = false;
}

public class BillItem
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Total { get; set; }
}

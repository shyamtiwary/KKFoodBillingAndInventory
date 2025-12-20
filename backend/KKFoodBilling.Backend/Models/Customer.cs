namespace KKFoodBilling.Backend.Models;

public class Customer
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public decimal Balance { get; set; } // Positive for debit (customer owes us), negative for credit
}

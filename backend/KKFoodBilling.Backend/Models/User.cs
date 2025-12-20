namespace KKFoodBilling.Backend.Models;

public class User
{
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = false;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

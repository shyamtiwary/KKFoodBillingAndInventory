using KKFoodBilling.Backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace KKFoodBilling.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public ActionResult<User> Login(LoginRequest request)
    {
        // Mock authentication
        var mockUsers = new Dictionary<string, User>
        {
            { "admin", new User { Email = "admin", Role = "admin", Name = "Admin User" } },
            { "manager", new User { Email = "manager", Role = "manager", Name = "Manager User" } },
            { "staff", new User { Email = "staff", Role = "staff", Name = "Staff User" } }
        };

        if (mockUsers.TryGetValue(request.Email, out var user) && request.Password == "password")
        {
            return Ok(user);
        }

        return Unauthorized();
    }
}

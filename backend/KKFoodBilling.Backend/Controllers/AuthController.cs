using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KKFoodBilling.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public AuthController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [HttpPost("login")]
    public async Task<ActionResult<User>> Login(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);

        if (user != null && user.Password == request.Password)
        {
            if (!user.IsApproved)
            {
                return Forbid("Account pending approval");
            }
            return Ok(user);
        }

        return Unauthorized();
    }

    [HttpPost("register")]
    public async Task<ActionResult<User>> Register(RegisterRequest request)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest("User already exists");
        }

        var newUser = new User
        {
            Email = request.Email,
            Name = request.Name,
            Password = request.Password,
            Role = "staff", // Default role
            IsApproved = false // Requires approval
        };

        await _userRepository.AddAsync(newUser);
        return Ok(newUser);
    }
}

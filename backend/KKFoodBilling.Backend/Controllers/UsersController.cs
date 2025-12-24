using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KKFoodBilling.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetAll()
    {
        // In a real app, we would check if the requester is an admin
        var users = await _userRepository.GetAllAsync();
        return Ok(users);
    }

    [HttpPost("approve/{email}")]
    public async Task<IActionResult> Approve(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            return NotFound();
        }

        user.IsApproved = true;
        await _userRepository.UpdateAsync(user);
        return Ok(user);
    }

    [HttpPost("disapprove/{email}")]
    public async Task<IActionResult> Disapprove(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            return NotFound();
        }

        // Prevent disapproving the main admin
        if (email.ToLower() == "admin")
        {
            return BadRequest("Cannot disapprove the main admin account");
        }

        user.IsApproved = false;
        await _userRepository.UpdateAsync(user);
        return Ok(user);
    }

    [HttpPost("enable/{email}")]
    public async Task<IActionResult> Enable(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null) return NotFound();

        user.IsActive = true;
        await _userRepository.UpdateAsync(user);
        return Ok(user);
    }

    [HttpPost("disable/{email}")]
    public async Task<IActionResult> Disable(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null) return NotFound();

        if (email.ToLower() == "admin")
        {
            return BadRequest("Cannot disable the main admin account");
        }

        user.IsActive = false;
        await _userRepository.UpdateAsync(user);
        return Ok(user);
    }

    [HttpDelete("{email}")]
    public async Task<IActionResult> Delete(string email)
    {
        if (email == "admin")
        {
            return BadRequest("Cannot delete the main admin account");
        }

        var success = await _userRepository.DeleteAsync(email);
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}

using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KKFoodBilling.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillsController : ControllerBase
{
    private readonly IBillRepository _repository;

    public BillsController(IBillRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Bill>>> Get([FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var userEmail = Request.Headers["X-User-Email"].ToString();
        var userRole = Request.Headers["X-User-Role"].ToString();

        // Filter by user if not admin or manager
        string? filterUserId = (userRole == "admin" || userRole == "manager") ? null : userEmail;
        
        var bills = await _repository.GetAllAsync(filterUserId);
        
        if (!string.IsNullOrEmpty(startDate) && !string.IsNullOrEmpty(endDate))
        {
            if (DateTime.TryParse(startDate, out var start) && DateTime.TryParse(endDate, out var end))
            {
                bills = bills.Where(b => 
                {
                    if (DateTime.TryParse(b.Date, out var billDate))
                    {
                        return billDate >= start && billDate <= end;
                    }
                    return false;
                }).ToList();
            }
        }
        
        return Ok(bills);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Bill>> Get(string id)
    {
        var bill = await _repository.GetByIdAsync(id);
        if (bill == null)
        {
            return NotFound();
        }
        return Ok(bill);
    }

    [HttpPost]
    public async Task<ActionResult<Bill>> Post(Bill bill)
    {
        if (string.IsNullOrEmpty(bill.Id))
        {
            bill.Id = Guid.NewGuid().ToString();
        }
        if (bill.DateTime == null)
        {
            bill.DateTime = DateTime.UtcNow;
        }

        // Set CreatedBy from header if not provided
        if (string.IsNullOrEmpty(bill.CreatedBy))
        {
            bill.CreatedBy = Request.Headers["X-User-Email"].ToString() ?? "admin";
        }
        
        await _repository.AddAsync(bill);
        
        return CreatedAtAction(nameof(Get), new {id = bill.Id }, bill);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var bill = await _repository.GetByIdAsync(id);
        if (bill == null)
        {
            return NotFound();
        }

        var success = await _repository.DeleteAsync(id);
        if (!success)
        {
            return StatusCode(500, "Failed to delete bill");
        }

        return NoContent();
    }
}

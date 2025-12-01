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
        var bills = await _repository.GetAllAsync();
        
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

    [HttpPost]
    public async Task<ActionResult<Bill>> Post(Bill bill)
    {
        if (string.IsNullOrEmpty(bill.Id))
        {
            bill.Id = Guid.NewGuid().ToString();
        }
        
        await _repository.AddAsync(bill);
        
        return CreatedAtAction(nameof(Get), new { id = bill.Id }, bill);
    }
}

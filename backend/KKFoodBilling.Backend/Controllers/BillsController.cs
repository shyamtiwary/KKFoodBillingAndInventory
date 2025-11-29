using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace KKFoodBilling.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillsController : ControllerBase
{
    private const string FileName = "bills.json";

    [HttpGet]
    public ActionResult<IEnumerable<Bill>> Get([FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var bills = JsonFileHelper.GetData<Bill>(FileName);
        
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
    public ActionResult<Bill> Post(Bill bill)
    {
        var bills = JsonFileHelper.GetData<Bill>(FileName);
        
        if (string.IsNullOrEmpty(bill.Id))
        {
            bill.Id = Guid.NewGuid().ToString();
        }
        
        bills.Insert(0, bill); // Add to beginning
        JsonFileHelper.SaveData(FileName, bills);
        
        return CreatedAtAction(nameof(Get), new { id = bill.Id }, bill);
    }
}

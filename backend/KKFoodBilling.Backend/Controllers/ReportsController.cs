using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace KKFoodBilling.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private const string BillsFileName = "bills.json";

    [HttpGet("sales")]
    public ActionResult<IEnumerable<object>> GetProductSales([FromQuery] string? startDate, [FromQuery] string? endDate)
    {
        var bills = JsonFileHelper.GetData<Bill>(BillsFileName);

        // Filter by date if provided
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

        // Aggregate sales by product
        var productSales = bills
            .SelectMany(b => b.Items)
            .GroupBy(i => new { i.ProductId, i.ProductName })
            .Select(g => new
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                TotalQuantity = g.Sum(i => i.Quantity),
                TotalRevenue = g.Sum(i => i.Total),
                InvoiceCount = g.Count() // This counts line items, which is roughly invoice count per product
            })
            .OrderByDescending(x => x.TotalRevenue)
            .ToList();

        return Ok(productSales);
    }
}

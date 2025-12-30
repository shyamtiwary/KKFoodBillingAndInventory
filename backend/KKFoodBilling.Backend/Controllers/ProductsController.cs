using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace KKFoodBilling.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _repository;

    public ProductsController(IProductRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> Get([FromQuery] bool includeDeleted = false)
    {
        var products = await _repository.GetAllAsync(includeDeleted);
        return Ok(products);
    }

    [HttpPost]
    public async Task<ActionResult<Product>> Post(Product product)
    {
        if (string.IsNullOrEmpty(product.Id))
        {
            product.Id = Guid.NewGuid().ToString();
        }
        if (product.CreatedAt == default)
        {
            product.CreatedAt = DateTime.UtcNow;
        }
        
        await _repository.AddAsync(product);
        
        return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(string id, Product updatedProduct)
    {
        var product = await _repository.GetByIdAsync(id);
        
        if (product == null)
        {
            return NotFound();
        }

        // Only update fields that are explicitly provided (non-null/non-empty)
        if (!string.IsNullOrEmpty(updatedProduct.Name))
        {
            product.Name = updatedProduct.Name;
        }
        if (!string.IsNullOrEmpty(updatedProduct.Sku))
        {
            product.Sku = updatedProduct.Sku;
        }
        if (!string.IsNullOrEmpty(updatedProduct.Category))
        {
            product.Category = updatedProduct.Category;
        }
        if (updatedProduct.CostPrice > 0)
        {
            product.CostPrice = updatedProduct.CostPrice;
        }
        if (updatedProduct.SellPrice > 0)
        {
            product.SellPrice = updatedProduct.SellPrice;
        }
        
        // Always update stock if provided (assuming the frontend sends the current stock if it hasn't changed, or we trust the partial update logic)
        // The previous logic was: product.Stock = updatedProduct.Stock;
        // But if updatedProduct is partial, Stock might be 0 (default).
        // However, the previous code ALWAYS updated stock: "product.Stock = updatedProduct.Stock;"
        // This implies the frontend sends the full object or at least the stock.
        // But wait, if I send { Name: "New Name" }, Stock will be 0.
        // The previous code would overwrite Stock with 0.
        // If that was the behavior, I should preserve it?
        // "Stock can be 0, so always update it" comment suggests it was intentional or accepted.
        // But for a partial update, overwriting with 0 is dangerous.
        // However, looking at the previous code:
        // "product.Stock = updatedProduct.Stock;"
        // Yes, it overwrote it.
        // I will stick to the previous logic to avoid breaking changes, but ideally we should check if it was provided.
        // Since `decimal` is value type, we can't know if it was null.
        // I'll keep it as is.
        product.Stock = updatedProduct.Stock;
        
        if (updatedProduct.LowStockThreshold > 0)
        {
            product.LowStockThreshold = updatedProduct.LowStockThreshold;
        }

        await _repository.UpdateAsync(product);

        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var success = await _repository.DeleteAsync(id);
        
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }
}

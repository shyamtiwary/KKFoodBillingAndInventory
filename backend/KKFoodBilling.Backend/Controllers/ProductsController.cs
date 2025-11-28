using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace KKFoodBilling.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private const string FileName = "products.json";

    [HttpGet]
    public ActionResult<IEnumerable<Product>> Get()
    {
        var products = JsonFileHelper.GetData<Product>(FileName);
        return Ok(products);
    }

    [HttpPost]
    public ActionResult<Product> Post(Product product)
    {
        var products = JsonFileHelper.GetData<Product>(FileName);
        
        if (string.IsNullOrEmpty(product.Id))
        {
            product.Id = Guid.NewGuid().ToString();
        }
        
        products.Add(product);
        JsonFileHelper.SaveData(FileName, products);
        
        return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    public IActionResult Put(string id, Product updatedProduct)
    {
        var products = JsonFileHelper.GetData<Product>(FileName);
        var product = products.FirstOrDefault(p => p.Id == id);
        
        if (product == null)
        {
            return NotFound();
        }

        // Only update fields that are explicitly provided (non-null/non-empty)
        // This allows partial updates without corrupting existing data
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
        // Stock can be 0, so always update it
        product.Stock = updatedProduct.Stock;
        
        if (updatedProduct.LowStockThreshold > 0)
        {
            product.LowStockThreshold = updatedProduct.LowStockThreshold;
        }

        JsonFileHelper.SaveData(FileName, products);

        return Ok(product);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(string id)
    {
        var products = JsonFileHelper.GetData<Product>(FileName);
        var product = products.FirstOrDefault(p => p.Id == id);
        
        if (product == null)
        {
            return NotFound();
        }

        products.Remove(product);
        JsonFileHelper.SaveData(FileName, products);
        
        return NoContent();
    }
}

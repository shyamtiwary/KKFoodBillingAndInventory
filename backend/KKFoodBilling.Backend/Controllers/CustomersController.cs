using Microsoft.AspNetCore.Mvc;
using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;

namespace KKFoodBilling.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerRepository _customerRepository;

    public CustomersController(ICustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Customer>>> GetAll()
    {
        var customers = await _customerRepository.GetAllAsync();
        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Customer>> GetById(string id)
    {
        var customer = await _customerRepository.GetByIdAsync(id);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpGet("mobile/{mobile}")]
    public async Task<ActionResult<Customer>> GetByMobile(string mobile)
    {
        var customer = await _customerRepository.GetByMobileAsync(mobile);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpPost]
    public async Task<ActionResult<Customer>> Create(Customer customer)
    {
        var existing = await _customerRepository.GetByMobileAsync(customer.Mobile);
        if (existing != null) return BadRequest("Customer with this mobile already exists");

        await _customerRepository.AddAsync(customer);
        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Customer customer)
    {
        if (id != customer.Id) return BadRequest();
        await _customerRepository.UpdateAsync(customer);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var success = await _customerRepository.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}

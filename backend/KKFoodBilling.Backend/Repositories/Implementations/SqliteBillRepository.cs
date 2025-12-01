using System.Data;
using Dapper;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;

namespace KKFoodBilling.Backend.Repositories.Implementations;

public class SqliteBillRepository : IBillRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public SqliteBillRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Bill>> GetAllAsync()
    {
        using var connection = _connectionFactory.CreateConnection();
        var bills = await connection.QueryAsync<Bill>("SELECT * FROM Bills ORDER BY Date DESC");
        
        if (bills.Any())
        {
            var items = await connection.QueryAsync<dynamic>("SELECT * FROM BillItems");
            var itemsLookup = items.ToLookup(i => (string)i.BillId);

            foreach (var bill in bills)
            {
                bill.Items = itemsLookup[bill.Id].Select(i => new BillItem
                {
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    Quantity = (decimal)i.Quantity, // SQLite REAL/NUMERIC maps to double/decimal
                    Price = (decimal)i.Price,
                    Total = (decimal)i.Total
                }).ToList();
            }
        }

        return bills;
    }

    public async Task<Bill?> GetByIdAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        var bill = await connection.QueryFirstOrDefaultAsync<Bill>("SELECT * FROM Bills WHERE Id = @Id", new { Id = id });
        
        if (bill != null)
        {
            var items = await connection.QueryAsync<dynamic>("SELECT * FROM BillItems WHERE BillId = @BillId", new { BillId = id });
            bill.Items = items.Select(i => new BillItem
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = (decimal)i.Quantity,
                Price = (decimal)i.Price,
                Total = (decimal)i.Total
            }).ToList();
        }

        return bill;
    }

    public async Task<Bill> AddAsync(Bill bill)
    {
        using var connection = _connectionFactory.CreateConnection();
        if (connection.State != ConnectionState.Open) connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            const string insertBillSql = @"
                INSERT INTO Bills (Id, BillNumber, CustomerName, CustomerEmail, Date, Subtotal, DiscountAmount, DiscountPercentage, TaxAmount, Total, Status, CreatedBy)
                VALUES (@Id, @BillNumber, @CustomerName, @CustomerEmail, @Date, @Subtotal, @DiscountAmount, @DiscountPercentage, @TaxAmount, @Total, @Status, @CreatedBy)";

            await connection.ExecuteAsync(insertBillSql, bill, transaction);

            const string insertItemSql = @"
                INSERT INTO BillItems (BillId, ProductId, ProductName, Quantity, Price, Total)
                VALUES (@BillId, @ProductId, @ProductName, @Quantity, @Price, @Total)";

            foreach (var item in bill.Items)
            {
                await connection.ExecuteAsync(insertItemSql, new 
                { 
                    BillId = bill.Id, 
                    item.ProductId, 
                    item.ProductName, 
                    item.Quantity, 
                    item.Price, 
                    item.Total 
                }, transaction);
            }

            transaction.Commit();
            return bill;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}

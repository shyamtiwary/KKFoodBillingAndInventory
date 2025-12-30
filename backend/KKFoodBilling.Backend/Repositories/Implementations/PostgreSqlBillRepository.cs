using System.Data;
using Dapper;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;

namespace KKFoodBilling.Backend.Repositories.Implementations;

public class PostgreSqlBillRepository : IBillRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public PostgreSqlBillRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Bill>> GetAllAsync(string? userId = null, bool includeDeleted = false)
    {
        using var connection = _connectionFactory.CreateConnection();
        string sql = "SELECT * FROM bills";
        var conditions = new List<string>();

        if (!string.IsNullOrEmpty(userId))
        {
            conditions.Add("createdby = @UserId");
        }

        if (!includeDeleted)
        {
            conditions.Add("isdeleted = FALSE");
        }

        if (conditions.Any())
        {
            sql += " WHERE " + string.Join(" AND ", conditions);
        }

        sql += " ORDER BY date DESC";
        
        var bills = await connection.QueryAsync<Bill>(sql, new { UserId = userId });
        
        if (bills.Any())
        {
            var items = await connection.QueryAsync<dynamic>("SELECT * FROM billitems");
            var itemsLookup = items.ToLookup(i => (string)i.billid);

            foreach (var bill in bills)
            {
                bill.Items = itemsLookup[bill.Id].Select(i => new BillItem
                {
                    ProductId = i.productid,
                    ProductName = i.productname,
                    Quantity = (decimal)i.quantity,
                    Price = (decimal)i.price,
                    Total = (decimal)i.total
                }).ToList();
            }
        }

        return bills;
    }

    public async Task<Bill?> GetByIdAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        var bill = await connection.QueryFirstOrDefaultAsync<Bill>("SELECT * FROM bills WHERE id = @Id", new { Id = id });
        
        if (bill != null)
        {
            var items = await connection.QueryAsync<dynamic>("SELECT * FROM billitems WHERE billid = @BillId", new { BillId = id });
            bill.Items = items.Select(i => new BillItem
            {
                ProductId = i.productid,
                ProductName = i.productname,
                Quantity = (decimal)i.quantity,
                Price = (decimal)i.price,
                Total = (decimal)i.total
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
                INSERT INTO bills (id, billnumber, customername, customeremail, customermobile, date, datetime, subtotal, discountamount, discountpercentage, taxamount, total, amountpaid, status, createdby, isdeleted)
                VALUES (@Id, @BillNumber, @CustomerName, @CustomerEmail, @CustomerMobile, @Date, @DateTime, @Subtotal, @DiscountAmount, @DiscountPercentage, @TaxAmount, @Total, @AmountPaid, @Status, @CreatedBy, @IsDeleted)";

            await connection.ExecuteAsync(insertBillSql, bill, transaction);

            const string insertItemSql = @"
                INSERT INTO billitems (billid, productid, productname, quantity, price, total)
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

    public async Task<bool> DeleteAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        const string sql = "UPDATE bills SET isdeleted = TRUE WHERE id = @Id";
        var rows = await connection.ExecuteAsync(sql, new { Id = id });
        return rows > 0;
    }
}

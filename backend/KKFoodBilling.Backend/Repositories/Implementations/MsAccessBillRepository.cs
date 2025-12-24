using System.Data;
using Dapper;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Models;
using KKFoodBilling.Backend.Repositories.Interfaces;

namespace KKFoodBilling.Backend.Repositories.Implementations;

public class MsAccessBillRepository : IBillRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public MsAccessBillRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IEnumerable<Bill>> GetAllAsync(string? userId = null)
    {
        using var connection = _connectionFactory.CreateConnection();
        string sql = "SELECT * FROM Bills";
        if (!string.IsNullOrEmpty(userId))
        {
            sql += " WHERE CreatedBy = ?";
        }
        sql += " ORDER BY [Date] DESC";
        
        var bills = await connection.QueryAsync<Bill>(sql, new { UserId = userId });
        
        // For now, let's not fetch items for the list view to keep it fast, 
        // unless the frontend explicitly needs them for the list.
        // Checking the frontend Bills.tsx... it seems to just show summary.
        // But the model has List<BillItem>. I should probably return empty list or fetch them.
        // Let's fetch them to be correct.
        
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
                    Quantity = (decimal)i.Quantity,
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
        var bill = await connection.QueryFirstOrDefaultAsync<Bill>("SELECT * FROM Bills WHERE Id = ?", new { Id = id });
        
        if (bill != null)
        {
            var items = await connection.QueryAsync<dynamic>("SELECT * FROM BillItems WHERE BillId = ?", new { BillId = id });
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
                INSERT INTO Bills (Id, BillNumber, CustomerName, CustomerEmail, [Date], Subtotal, DiscountAmount, DiscountPercentage, TaxAmount, Total, Status, CreatedBy)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            using (var cmd = connection.CreateCommand())
            {
                cmd.Transaction = transaction;
                cmd.CommandText = insertBillSql;
                AddParameter(cmd, "@Id", bill.Id);
                AddParameter(cmd, "@BillNumber", bill.BillNumber);
                AddParameter(cmd, "@CustomerName", bill.CustomerName);
                AddParameter(cmd, "@CustomerEmail", bill.CustomerEmail);
                AddParameter(cmd, "@Date", bill.Date);
                AddParameter(cmd, "@Subtotal", bill.Subtotal);
                AddParameter(cmd, "@DiscountAmount", bill.DiscountAmount);
                AddParameter(cmd, "@DiscountPercentage", bill.DiscountPercentage);
                AddParameter(cmd, "@TaxAmount", bill.TaxAmount);
                AddParameter(cmd, "@Total", bill.Total);
                AddParameter(cmd, "@Status", bill.Status);
                AddParameter(cmd, "@CreatedBy", bill.CreatedBy);
                
                await Task.Run(() => cmd.ExecuteNonQuery());
            }

            const string insertItemSql = @"
                INSERT INTO BillItems (BillId, ProductId, ProductName, Quantity, Price, Total)
                VALUES (?, ?, ?, ?, ?, ?)";

            foreach (var item in bill.Items)
            {
                using (var cmd = connection.CreateCommand())
                {
                    cmd.Transaction = transaction;
                    cmd.CommandText = insertItemSql;
                    AddParameter(cmd, "@BillId", bill.Id);
                    AddParameter(cmd, "@ProductId", item.ProductId);
                    AddParameter(cmd, "@ProductName", item.ProductName);
                    AddParameter(cmd, "@Quantity", item.Quantity);
                    AddParameter(cmd, "@Price", item.Price);
                    AddParameter(cmd, "@Total", item.Total);

                    await Task.Run(() => cmd.ExecuteNonQuery());
                }
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

    private void AddParameter(IDbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        using var connection = _connectionFactory.CreateConnection();
        if (connection.State != ConnectionState.Open) connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            // Delete bill items first
            const string deleteItemsSql = "DELETE FROM BillItems WHERE BillId = ?";
            using (var cmd = connection.CreateCommand())
            {
                cmd.Transaction = transaction;
                cmd.CommandText = deleteItemsSql;
                AddParameter(cmd, "@BillId", id);
                await Task.Run(() => cmd.ExecuteNonQuery());
            }

            // Delete the bill
            const string deleteBillSql = "DELETE FROM Bills WHERE Id = ?";
            int rows;
            using (var cmd = connection.CreateCommand())
            {
                cmd.Transaction = transaction;
                cmd.CommandText = deleteBillSql;
                AddParameter(cmd, "@Id", id);
                rows = await Task.Run(() => cmd.ExecuteNonQuery());
            }

            transaction.Commit();
            return rows > 0;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}

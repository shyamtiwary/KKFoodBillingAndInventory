using KKFoodBilling.Backend.Data;
using KKFoodBilling.Backend.Data.Infrastructure;
using KKFoodBilling.Backend.Repositories.Implementations;
using KKFoodBilling.Backend.Repositories.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "KK Food Billing & Inventory API",
        Version = "v1",
        Description = "API for managing products, bills, and authentication",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "KK Food",
            Email = "support@kkfood.com"
        }
    });
});

// Register Database Services based on configuration
var databaseProvider = builder.Configuration["DatabaseProvider"] ?? "SQLite";

if (databaseProvider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<IDbConnectionFactory, PostgreSqlConnectionFactory>();
    builder.Services.AddScoped<IProductRepository, PostgreSqlProductRepository>();
    builder.Services.AddScoped<IBillRepository, PostgreSqlBillRepository>();
    builder.Services.AddScoped<IUserRepository, PostgreSqlUserRepository>();
    builder.Services.AddScoped<ICustomerRepository, PostgreSqlCustomerRepository>();
}
else
{
    // Default to SQLite
    builder.Services.AddSingleton<IDbConnectionFactory, SqliteConnectionFactory>();
    builder.Services.AddScoped<IProductRepository, SqliteProductRepository>();
    builder.Services.AddScoped<IBillRepository, SqliteBillRepository>();
    builder.Services.AddScoped<IUserRepository, SqliteUserRepository>();
    builder.Services.AddScoped<ICustomerRepository, SqliteCustomerRepository>();
}

builder.Services.AddScoped<DatabaseInitializer>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.SetIsOriginAllowed(origin => 
                {
                    if (string.IsNullOrWhiteSpace(origin)) return false;
                    
                    var uri = new Uri(origin);
                    // Allow localhost (Web dev and Mobile)
                    if (uri.Host == "localhost") return true;
                    // Allow Capacitor iOS
                    if (origin.StartsWith("capacitor://")) return true;
                    // Allow specific production domain
                    if (origin.TrimEnd('/') == "https://kk-food-billing-and-inventory.vercel.app") return true;
                    // Allow any vercel.app subdomain (for previews)
                    if (uri.Host.EndsWith(".vercel.app")) return true;
                    // Allow Render backend (for health checks and Swagger)
                    if (uri.Host.EndsWith(".onrender.com")) return true;
                    
                    return false;
                })
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});

// Configure Kestrel to listen on port 55219 for local dev, or use default port for cloud
if (builder.Environment.IsDevelopment())
{
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ListenLocalhost(55219, listenOptions =>
        {
            // listenOptions.UseHttps(); // Disabled HTTPS for HTTP communication
        });
    });
}

var app = builder.Build();

app.UseCors("AllowFrontend");

// Initialize Database
using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    try 
    {
        initializer.Initialize();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database.");
    }
}

// Configure the HTTP request pipeline.
// Enable Swagger in both development and production for API documentation
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "KK Food Billing API v1");
    c.RoutePrefix = "swagger"; // Access via /swagger
});

// app.UseHttpsRedirection(); // Disabled for HTTP communication

app.UseAuthorization();

app.MapControllers();

app.Run();

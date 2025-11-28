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


// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:8080", 
                    "http://localhost:8081",
                    "https://kk-food-billing-and-inventory.vercel.app", // Production Vercel URL
                    "https://*.vercel.app" // Allow all Vercel preview deployments
                  )
                  .AllowAnyHeader()
                  .AllowAnyMethod();
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

// Configure the HTTP request pipeline.
// Enable Swagger in both development and production for API documentation
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "KK Food Billing API v1");
    c.RoutePrefix = "swagger"; // Access via /swagger
});

// app.UseHttpsRedirection(); // Disabled for HTTP communication

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();

// .NET Core 6 API - For https://todobackend.com/
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph;
using Microsoft.Net.Http.Headers;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text.Json;

// https://docs.microsoft.com/en-us/azure/active-directory/develop/multi-service-web-app-access-microsoft-graph-as-user?tabs=azure-resource-explorer%2Cprogramming-language-csharp 



// set up web app
var builder = Microsoft.AspNetCore.Builder.WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<TodoDb>(opt => opt.UseInMemoryDatabase("TodoList"));
// Get incoming request headers
builder.Services.AddHttpContextAccessor();

// Make outgoing HTTP calls
builder.Services.AddHttpClient();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            // CAUTION: DO NOT USE THIS IN PRODUCTION
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        });
});

var app = builder.Build();
app.UseCors();

/* 
 * 
 * 1) get user bearer token from client 
 * or 2) get easy auth request injected header value

*/


// Set up routes
// Root
app.MapGet("/", () => "Hello World!");


// This is the downstream API called from the upstream API
// minimal api
// https://docs.microsoft.com/en-us/aspnet/core/fundamentals/http-context?view=aspnetcore-6.0
// https://docs.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-6.0
// https://developer.microsoft.com/en-us/graph/graph-explorer
app.MapGet("/graph/me", async (TodoDb db, HttpContext httpContext, IHttpClientFactory httpClientFactory) =>
{
    // Header is only injected and available in Azure Cloud App Service environment
    var bearerToken = httpContext.Request.Headers.FirstOrDefault(x => x.Key == "Authorization").Value.FirstOrDefault();

    if (String.IsNullOrEmpty(bearerToken)) return Results.BadRequest("Didn't find bearer token in header");


    Debug.WriteLine("bearerToken: " + bearerToken);

    // https://developer.microsoft.com/en-us/graph/graph-explorer?request=me&method=GET&version=v1.0&GraphUrl=https://graph.microsoft.com
    // GET https://graph.microsoft.com/v1.0/me/messages?filter=emailAddress eq 'jon@contoso.com'

    var graphServiceClient = new GraphServiceClient(
        new DelegateAuthenticationProvider((requestMessage) =>
        {
            requestMessage
            .Headers
            .Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

            return Task.CompletedTask;
        }));

    var user = await graphServiceClient.Me
    .Request()
    .GetAsync();

    Debug.Write("user: " + user.DisplayName);

    return Results.Ok(user);

});

// This is the upstream API, calls to the downstream API
app.MapGet("/api/me", async (TodoDb db, HttpContext httpContext, IHttpClientFactory httpClientFactory) =>
{
    // Header is only injected and available in Azure Cloud App Service environment
    //httpContext.Request.Headers.TryGetValue("X-MS-TOKEN-AAD-ACCESS-TOKEN", out var aadAccessTokenValues);
    var aadAccessToken = httpContext.Request.Headers.FirstOrDefault(x => x.Key == "X-MS-TOKEN-AAD-ACCESS-TOKEN").Value.FirstOrDefault();

    if (String.IsNullOrEmpty(aadAccessToken)) return Results.BadRequest("Didn't find access token in header");


    Debug.WriteLine("X-MS-TOKEN-AAD-ACCESS-TOKEN: " + aadAccessToken);

    var httpClient = httpClientFactory.CreateClient("Downstream API server");

    var httpRequestMessage = new HttpRequestMessage(
            HttpMethod.Get,
            "https://diberry-app-service-downstream/graph/me")
    {
        Headers =
            {
                { HeaderNames.Accept, "application/json" },
                { HeaderNames.Authorization, "Bearer " + aadAccessToken }
            }
    };
    var httpResponseMessage = await httpClient.SendAsync(httpRequestMessage);

    if (httpResponseMessage.IsSuccessStatusCode)
    {
        using var contentStream =
            await httpResponseMessage.Content.ReadAsStreamAsync();

        var parsedObject = JsonSerializer.Deserialize<Dictionary<string, string>>(contentStream);
        var displayName = parsedObject?["displayName"];
        Debug.WriteLine("returned displayName: " + displayName);

        return Results.Ok(displayName);
    }

    return Results.Problem("Can't get user from Graph");

});

app.Run();

// Title column is unique
[Index(nameof(Title), IsUnique = true)]
class Todo
{
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    [Column("title")]
    public string Title { get; set; }

    [Column("completed")]
    public bool Completed { get; set; }
}

class TodoDb : DbContext
{
    public TodoDb(DbContextOptions<TodoDb> options)
        : base(options) { }

    public DbSet<Todo> Todos => Set<Todo>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<Todo>()
            .HasIndex(u => u.Title)
            .IsUnique();
    }
}
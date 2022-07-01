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
using System.Web;

// https://docs.microsoft.com/en-us/azure/active-directory/develop/multi-service-web-app-access-microsoft-graph-as-user?tabs=azure-resource-explorer%2Cprogramming-language-csharp 



// set up web app
var builder = Microsoft.AspNetCore.Builder.WebApplication.CreateBuilder(args);

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


// This is the upstream API, calls to the downstream API
app.MapGet("/api/me", async (HttpContext httpContext, IHttpClientFactory httpClientFactory) =>
{
    try {
        app.Logger.LogInformation("/api/me");

        // Header is only injected and available in Azure Cloud App Service environment
        //httpContext.Request.Headers.TryGetValue("X-MS-TOKEN-AAD-ACCESS-TOKEN", out var aadAccessTokenValues);
        var aadAccessToken = httpContext.Request.Headers.FirstOrDefault(x => x.Key == "X-MS-TOKEN-AAD-ACCESS-TOKEN").Value.FirstOrDefault();
        app.Logger.LogInformation("X-MS-TOKEN-AAD-ACCESS-TOKEN (as bearer token): " + aadAccessToken);

        if (String.IsNullOrEmpty(aadAccessToken)) return Results.Ok("Didn't find access token in header");

        app.Logger.LogInformation("about to make http call");

        var httpClient = httpClientFactory.CreateClient("Downstream API server");

        var local = "https://localhost:7065";
        var remote = "https://diberry-dotnet-6-windows-b.azurewebsites.net";

        var url = local + "/graph/bearertoken/me";

        var httpRequestMessage = new HttpRequestMessage(
                HttpMethod.Get,
                url)
        {
            Headers =
            {
                { HeaderNames.Accept, "application/json" },
                { HeaderNames.Authorization, "Bearer " + aadAccessToken }
            }
        };

        var httpResponseMessage = await httpClient.SendAsync(httpRequestMessage);
        app.Logger.LogInformation("after http call");

        if (httpResponseMessage.IsSuccessStatusCode)
        {
            using var contentStream =
                await httpResponseMessage.Content.ReadAsStreamAsync();

            var parsedObject = JsonSerializer.Deserialize<Dictionary<string, string>>(contentStream);
            //var displayName = parsedObject?["displayName"];
            //System.Diagnostics.Trace.TraceError("returned displayName: " + displayName);

            IEnumerable<string> keyValues = httpContext.Request.Headers.Keys.Select(key => key + ": " + string.Join(",", httpContext.Request.Headers[key]));
            string requestHeaders = string.Join(System.Environment.NewLine, keyValues);
            app.Logger.LogInformation("request headers: " + requestHeaders);


            return Results.Ok(requestHeaders);

            //return Results.Ok(displayName);
        }
        else
        {
            app.Logger.LogInformation("error: " + httpResponseMessage.Content.ToString());

            return Results.Ok(httpResponseMessage.Content.ToString());
        }
    }
    catch(Exception ex) {
        app.Logger.LogInformation("Exception " + ex.Message.ToString());
        return Results.Ok(ex.Message.ToString());
    }


    

});

app.MapGet("/admin/headers", (HttpContext httpContext) =>
{
#pragma warning disable CS8600 // Converting null literal or possible null value to non-nullable type.
    IEnumerable<string> keyValues = httpContext.Request.Headers.Keys.Select(key => key + ": " + string.Join(",", httpContext.Request.Headers[key]));
    string requestHeaders = string.Join(System.Environment.NewLine, keyValues);
        app.Logger.LogInformation("request headers: " + requestHeaders);
    return Results.Ok(requestHeaders);
#pragma warning restore CS8600 // Converting null literal or possible null value to non-nullable type.
});


app.Run();

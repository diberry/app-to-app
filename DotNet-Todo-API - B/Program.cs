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


app.MapGet("/graph/accesstoken/me", async (HttpContext httpContext) =>
{

    try
    {
        app.Logger.LogInformation("/graph/accesstoken/me");

        var accessToken = httpContext.Request.Headers.FirstOrDefault(x => x.Key == "X-MS-TOKEN-AAD-ACCESS-TOKEN").Value.FirstOrDefault();
        app.Logger.LogInformation("accessToken: " + accessToken);


        IEnumerable<string> keyValues = httpContext.Request.Headers.Keys.Select(key => key + ": " + string.Join(",", httpContext.Request.Headers[key]));
        string requestHeaders = string.Join(System.Environment.NewLine, keyValues);
        app.Logger.LogInformation("requestHeaders: " + requestHeaders);



        if (!String.IsNullOrEmpty(accessToken))
        {
            var graphServiceClientAccessToken = new GraphServiceClient(
            new DelegateAuthenticationProvider((requestMessage) =>
            {
                requestMessage
                .Headers
                .Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                return Task.CompletedTask;
            }));

            var user = await graphServiceClientAccessToken.Me
                .Request()
                .GetAsync();

            app.Logger.LogInformation(user.ToString());
            return Results.Ok(user);
        }
        else
        {
            return Results.Ok("else");
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogInformation("Exception " + ex.Message.ToString());
        return Results.Ok(ex.Message.ToString());
    }
});

// This is the downstream API called from the upstream API
// minimal api
// https://docs.microsoft.com/en-us/aspnet/core/fundamentals/http-context?view=aspnetcore-6.0
// https://docs.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis?view=aspnetcore-6.0
// https://developer.microsoft.com/en-us/graph/graph-explorer
app.MapGet("/graph/bearertoken/me", async (HttpContext httpContext) =>
{

    try
    {
        app.Logger.LogInformation("/graph/bearertoken/me");

        var bearerToken = httpContext.Request.Headers.FirstOrDefault(x => x.Key == "Authorization").Value.FirstOrDefault();
        app.Logger.LogInformation("accessToken: " + bearerToken);


        IEnumerable<string> keyValues = httpContext.Request.Headers.Keys.Select(key => key + ": " + string.Join(",", httpContext.Request.Headers[key]));
        string requestHeaders = string.Join(System.Environment.NewLine, keyValues);
        app.Logger.LogInformation("requestHeaders: " + requestHeaders);


        if (!String.IsNullOrEmpty(bearerToken))
        {
            var graphServiceClientAccessToken = new GraphServiceClient(
            new DelegateAuthenticationProvider((requestMessage) =>
            {
                requestMessage
                .Headers
                .Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

                return Task.CompletedTask;
            }));

            var user = await graphServiceClientAccessToken.Me
                .Request()
                .GetAsync();

            app.Logger.LogInformation(user.ToString());
            return Results.Ok(user);
        }
        else
        {
            return Results.Ok("else");
        }

    }catch(Exception ex)
    {
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

// .NET Core 6 API - For https://todobackend.com/
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

// set up web app
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<TodoDb>(opt => opt.UseInMemoryDatabase("TodoList"));

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

// Set up routes
// Root
app.MapGet("/", () => "Hello World!");

// get all
app.MapGet("/todoitems", async (TodoDb db) =>
{
    var todos = await db.Todos.ToListAsync();
    return Results.Ok(todos);
});


// get 1
app.MapGet("/todoitems/{id}", async (int id, TodoDb db) =>
{
    var todo = await db.Todos.FindAsync(id);

    if (todo is null) return Results.NotFound();

    return Results.Ok(todo);

});
// add 1
app.MapPost("/todoitems", async (Todo todo, TodoDb db) =>
{

    if (String.IsNullOrEmpty(todo.Title))
        return Results.BadRequest("Title is empty");

    todo.Title = todo.Title.ToLower();

    db.Todos.Add(todo);
    await db.SaveChangesAsync();

    var returnedTodo = await db.Todos.Where(t => t.Title == todo.Title).ToListAsync();

    return Results.Ok(returnedTodo);

});
// update 1 by id
app.MapPut("/todoitems/{id}", async (int id, [FromBody] Todo updateData, TodoDb db) =>
{

    var todo = await db.Todos.FindAsync(id);

    if (todo is null) return Results.NotFound();

    todo.Title = updateData.Title.ToLower();
    todo.Completed = updateData.Completed;

    await db.SaveChangesAsync();

    var returnedTodo = await db.Todos.FindAsync(id);

    return Results.Ok(returnedTodo);
});

// delete all
app.MapDelete("/todoitems", async (TodoDb db) =>
{
        db.Todos.RemoveRange(db.Todos);
        await db.SaveChangesAsync();

    var todos = await db.Todos.ToListAsync();
    return Results.Ok(todos);

  
});
// delete 1
app.MapDelete("/todoitems/{id}", async (int id, TodoDb db) =>
{
    if (await db.Todos.FindAsync(id) is Todo todo)
    {
        db.Todos.Remove(todo);
        await db.SaveChangesAsync();
        var todos = await db.Todos.ToListAsync();
        return Results.Ok(todos);
    }

    return Results.NotFound();
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
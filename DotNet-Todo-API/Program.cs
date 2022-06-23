using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<TodoDb>(opt => opt.UseInMemoryDatabase("TodoList"));

var app = builder.Build();

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


/*

add 1 

headers: content-type: application/json

{
    "title": "Buy milk",
    "completed": false
}
 */
app.MapPost("/todoitems", async (Todo todo, TodoDb db) =>
{
    db.Todos.Add(todo);
    await db.SaveChangesAsync();

    return Results.Created($"/todoitems/{todo.Id}", todo);
});
// update 1 by id
app.MapPut("/todoitems/{id}", async (int id, Todo inputTodo, TodoDb db) =>
{
    var todo = await db.Todos.FindAsync(id);

    if (todo is null) return Results.NotFound();

    todo.Title = inputTodo.Title;
    todo.Completed = inputTodo.Completed;

    await db.SaveChangesAsync();

    return Results.NoContent();
});

// delete all
app.MapDelete("/todoitems", async (TodoDb db) =>
{
        db.Todos.RemoveRange(db.Todos);
        await db.SaveChangesAsync();
        return Results.Ok();
  
});

app.MapDelete("/todoitems/{id}", async (int id, TodoDb db) =>
{
    if (await db.Todos.FindAsync(id) is Todo todo)
    {
        db.Todos.Remove(todo);
        await db.SaveChangesAsync();
        return Results.Ok(todo);
    }

    return Results.NotFound();
});

app.Run();

class Todo
{
    [Column("id")]
    public int Id { get; set; }
    [Column("title")]
    public string? Title { get; set; }
    [Column("completed")]
    public bool Completed { get; set; }
}

class TodoDb : DbContext
{
    public TodoDb(DbContextOptions<TodoDb> options)
        : base(options) { }

    public DbSet<Todo> Todos => Set<Todo>();
}
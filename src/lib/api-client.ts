import type { Todo } from "@/lib/db";

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch("/api/todos", { cache: "no-store" });
  if (!res.ok) throw new Error("failed to fetch");
  return res.json();
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("failed to create");
  return res.json();
}

export async function updateTodo(id: string, patch: Partial<Pick<Todo, "title" | "done">>): Promise<Todo> {
  const res = await fetch(`/api/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("failed to update");
  return res.json();
}

export async function deleteTodo(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("failed to delete");
  return res.json();
}

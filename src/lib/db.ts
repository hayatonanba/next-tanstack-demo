import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { nanoid } from "nanoid";

export type Todo = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  updatedAt: number;
};

export const TodoCreateSchema = z.object({
  title: z.string().min(1, "title is required"),
});

export const TodoUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  done: z.boolean().optional(),
});

const DB_PATH = path.join(process.cwd(), "data", "todos.json");

async function readAll(): Promise<Todo[]> {
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw) as Todo[];
}

async function writeAll(todos: Todo[]) {
  await fs.writeFile(DB_PATH, JSON.stringify(todos, null, 2), "utf8");
}

export const db = {
  async list(): Promise<Todo[]> {
    const todos = await readAll();
    return todos.sort((a, b) => b.createdAt - a.createdAt);
  },

  async create(input: z.infer<typeof TodoCreateSchema>): Promise<Todo> {
    const now = Date.now();
    const todo: Todo = {
      id: nanoid(),
      title: input.title,
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    const todos = await readAll();
    todos.push(todo);
    await writeAll(todos);
    return todo;
  },

  async update(id: string, patch: z.infer<typeof TodoUpdateSchema>): Promise<Todo> {
    const todos = await readAll();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) throw new Error("not found");
    const updated: Todo = {
      ...todos[idx],
      ...patch,
      updatedAt: Date.now(),
    };
    todos[idx] = updated;
    await writeAll(todos);
    return updated;
  },

  async remove(id: string): Promise<{ id: string }> {
    const todos = await readAll();
    const next = todos.filter(t => t.id !== id);
    await writeAll(next);
    return { id };
  },
};

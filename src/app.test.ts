import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { createDb } from "./db";
import { createApp } from "./app";

type Todo = { id: number; title: string; done: boolean; created_at: string };

let server: ReturnType<typeof Bun.serve>;
const url = (p: string) => new URL(p, server.url);
const json = (method: string, p: string, body?: unknown) =>
  fetch(url(p), {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeAll(() => {
  server = Bun.serve({ ...createApp(createDb(":memory:")), port: 0 });
});
afterAll(() => server.stop(true));

describe("todos API", () => {
  test("create, read, update, delete", async () => {
    const created = await json("POST", "/todos", { title: "Learn Bun" });
    expect(created.status).toBe(201);
    const todo = (await created.json()) as Todo;
    expect(todo).toMatchObject({ title: "Learn Bun", done: false });

    const patched = await json("PATCH", `/todos/${todo.id}`, { done: true });
    expect(((await patched.json()) as Todo).done).toBe(true);

    const all = (await (await fetch(url("/todos"))).json()) as Todo[];
    expect(all.length).toBe(1);

    expect((await json("DELETE", `/todos/${todo.id}`)).status).toBe(204);
    expect((await fetch(url(`/todos/${todo.id}`))).status).toBe(404);
  });

  test("rejects invalid input", async () => {
    expect((await json("POST", "/todos", { title: "" })).status).toBe(400);
    expect((await json("POST", "/todos", {})).status).toBe(400);
  });
});
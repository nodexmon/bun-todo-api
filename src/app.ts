import type { Database } from "bun:sqlite";
import { createTodoSchema, updateTodoSchema } from "./schemas";

type TodoRaw = {
  id: number;
  title: string;
  done: number;
  created_at: string;
};
const toTodo = (raw: TodoRaw) => ({
  ...raw,
  done: Boolean(raw.done),
});

type Routes = "/health" | "/todos" | "/todos/:id";

export function createApp(db: Database) {
  const list = db.query<TodoRaw, []>("SELECT * FROM todos ORDER BY id");
  const get = db.query<TodoRaw, [number]>("SELECT * FROM todos WHERE id = ?");
  const insert = db.query<TodoRaw, [string]>(
    "INSERT INTO todos (title) VALUES (?) RETURNING *",
  );
  const remove = db.query("DELETE FROM todos WHERE id = ?");

  async function parse<T>(
    req: Request,
    schema: import("zod").ZodType<T>,
  ): Promise<T | Response> {
    const body = await req.json().catch(() => null);
    const result = schema.safeParse(body);
    if (!result.success)
      return Response.json({ errors: result.error.issues }, { status: 400 });
    return result.data;
  }

  return {
    port: Number(process.env.PORT ?? 3000),
    routes: {
      "/health": () => Response.json({ status: "ok" }),
      "/todos": {
        GET: () => Response.json(list.all().map(toTodo)),
        POST: async (req: Request) => {
          const data = await parse(req, createTodoSchema);
          if (data instanceof Response) return data;
          return Response.json(toTodo(insert.get(data.title)!), {
            status: 201,
          });
        },
      },
      "/todos/:id": {
        GET: (req: Bun.BunRequest<"/todos/:id">) => {
          const row = get.get(Number(req.params.id));
          return row
            ? Response.json(toTodo(row))
            : Response.json({ error: "Not found" }, { status: 404 });
        },
        PATCH: async (req: Bun.BunRequest<"/todos/:id">) => {
          const id = Number(req.params.id);
          const current = get.get(id);
          if (!current)
            return Response.json({ error: "Not found" }, { status: 404 });
          const data = await parse(req, updateTodoSchema);
          if (data instanceof Response) return data;
          const next = {
            title: data.title ?? current.title,
            done: data.done ?? Boolean(current.done),
          };
          db.query("UPDATE todos SET title = ?, done = ? WHERE id = ?").run(
            next.title,
            next.done ? 1 : 0,
            id,
          );
          return Response.json(toTodo(get.get(id)!));
        },
        DELETE: (req: Bun.BunRequest<"/todos/:id">) => {
          const { changes } = remove.run(Number(req.params.id));
          return changes
            ? new Response(null, { status: 204 })
            : Response.json({ error: "Not found" }, { status: 404 });
        },
      },
    },
    fetch: () => Response.json({ error: "Not found" }, { status: 404 }),
    error(err: Error) {
      console.error(err);
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
    },
  } satisfies Bun.Serve.Options<undefined, Routes>;
}

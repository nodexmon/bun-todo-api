import { createApp } from "./app";
import { createDb } from "./db";

const server = Bun.serve(createApp(createDb()));
console.log(`Listening on ${server.url}`);

import { Hono } from "hono";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/message", (c) => {
  return c.text("Hello Hono!");
});

app.post("/test-relayed-transaction", async (c) => {
  const body = await c.req.json();
  console.log("Received relayed transaction:", body);
});

export default app;

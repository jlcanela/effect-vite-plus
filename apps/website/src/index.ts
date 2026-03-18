// import { Effect } from "effect";

// const program = Effect.gen(function* () {
//     yield* Effect.log("Hello, world!");
// })

// await program.pipe(Effect.runPromise);

/**
 * @title Getting started with HttpApi
 *
 * Define a schema-first API, implement handlers, secure endpoints with
 * middleware, serve it over HTTP, and call it using a generated typed client.
 */
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { createServer } from "node:http";
// Api definitions should **always** be seperate from the server implementation,
// so that they can be shared between the server and client without leaking
// server code into clients.
// Ideally, the would use a seperate package in a monorepo.
import { Api } from "./fixtures/api/Api.js";
import { UsersApiHandlers } from "./fixtures/server/Users/http";

// This walkthrough focuses on runtime wiring and typed client usage.
// See the fixture files for the API schemas, endpoint definitions and handlers:

const SystemApiHandlers = HttpApiBuilder.group(
  Api,
  "system",
  Effect.fn(function* (handlers) {
    yield* Effect.yieldNow;
    return handlers.handle("health", () => Effect.void);
  }),
);

const ApiRoutes = HttpApiBuilder.layer(Api, {
  openapiPath: "/openapi.json",
}).pipe(
  // Provide all the handler Layers for the API.
  Layer.provide([UsersApiHandlers, SystemApiHandlers]),
);

// Define a /docs route that serves scalar documentation
const DocsRoute = HttpApiScalar.layer(Api, {
  path: "/docs",
});

// Merge all the http routes together
const AllRoutes = Layer.mergeAll(ApiRoutes, DocsRoute);

// Create an HTTP server Layer that serves the API routes.
//
// Here we are using the NodeHttpServer, but you could also use the
// BunHttpServer
export const HttpServerLayer = HttpRouter.serve(AllRoutes).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);

// Then run the server using Layer.launch
Layer.launch(HttpServerLayer).pipe(NodeRuntime.runMain);

import { OpenAiClient } from '@effect/ai-openai-compat';
import { NodeRuntime } from '@effect/platform-node';
import { Effect, Layer, Schema } from 'effect';
import { toDocumentDraft07 } from 'effect/JsonSchema';
import { type JsonObject, toJsonSchemaDocument } from 'effect/Schema';
import { FetchHttpClient, HttpClient, HttpClientResponse } from 'effect/unstable/http';

const program = Effect.gen(function* () {
  const client = yield* OpenAiClient.OpenAiClient;

  const OutputSchema = Schema.Struct({
    feeling: Schema.String.pipe(
      Schema.annotate({
        description: 'The detected feeling or emotion',
      }),
    ),
    weather: Schema.String.pipe(
      Schema.annotate({
        description: 'The detected weather condition',
      }),
    ),
  });

  const schema = toDocumentDraft07(toJsonSchemaDocument(OutputSchema)).schema as JsonObject;

  // console.log("Generated JSON Schema:", JSON.stringify(schema, null, 2))
  const rf = {
    type: 'json_schema' as const,
    json_schema: {
      name: 'OutputSchema',
      strict: true,
      schema,
    },
  };

  // This returns an Effect, so we must yield* it to execute
  const [body, _response] = yield* client.createResponse({
    model: 'gpt120b',
    messages: [{ role: 'system', content: 'You are a helpful assistant.' }],
    tool_choice: undefined,
    response_format: rf,
  });

  // yield* Effect.log("Response: " + JSON.stringify(response, null, 2));
  const result = JSON.parse(body.choices[0].message?.content ?? '{}');
  yield* Effect.log(`feeling: ${result.feeling}, weather: ${result.weather}`);
});

const transformClient = (client: HttpClient.HttpClient) =>
  client.pipe(
    // Patch null fields incompatible with Effect schema
    HttpClient.transformResponse((effect) =>
      Effect.flatMap(effect, (response) =>
        Effect.gen(function* () {
          const json = yield* response.json as Effect.Effect<any, any, never>;
          const patched = {
            ...json,
            service_tier: json.service_tier ?? 'default',
            system_fingerprint: json.system_fingerprint ?? '',
          };
          const patchedBody = JSON.stringify(patched);
          return HttpClientResponse.fromWeb(
            response.request,
            new Response(patchedBody, {
              status: response.status,
              headers: { 'content-type': 'application/json' },
            }),
          );
        }),
      ),
    ),
    // Logging
    HttpClient.tap(
      (_request) => Effect.void, //Effect.gen(function* () {
      //yield* Effect.log("--- OUTGOING REQUEST ---")
      //yield* Effect.log(request)
      //})
    ),
  );

const OpenAiLive = OpenAiClient.layer({
  apiUrl: process.env.OPENAI_API_URL,
  transformClient,
});

const MainLayer = Layer.provide(OpenAiLive, FetchHttpClient.layer);

// --- Run Program ---
program.pipe(Effect.provide(MainLayer), NodeRuntime.runMain);

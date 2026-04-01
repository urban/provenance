import type { LLMResponse } from "@urban/provenance-shared";
import { Effect, Layer, Schema } from "effect";
import { LLMGateway, type GenerateResearchInput } from "./LLMGateway";

export interface PiGatewayConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly baseUrl?: string;
}

const PiMessageSchema = Schema.Struct({
  role: Schema.String,
  content: Schema.String,
});

const PiCompletionResponseSchema = Schema.Struct({
  model: Schema.String,
  choices: Schema.Array(
    Schema.Struct({
      index: Schema.Number,
      finish_reason: Schema.NullOr(Schema.String),
      message: PiMessageSchema,
    }),
  ),
});

const defaultPiBaseUrl = "https://api.piapi.ai/v1/chat/completions";
const defaultPiModel = "gpt-4.1-mini";

const normalizeWhitespace = (value: string): string => value.trim().replace(/\s+/g, " ");

const buildSystemPrompt = (): string =>
  [
    "You generate concise research assistance for an Obsidian note author.",
    "Use only the supplied note context and question.",
    "Return markdown with a short title, key findings, evidence gaps, and next steps.",
  ].join(" ");

const buildUserPrompt = (input: GenerateResearchInput): string => {
  const question =
    input.question === undefined || normalizeWhitespace(input.question).length === 0
      ? "No explicit research question provided."
      : normalizeWhitespace(input.question);

  return [
    `Note title: ${input.note.title}`,
    `Note path: ${input.note.path}`,
    "",
    "Active note markdown:",
    input.note.markdown,
    "",
    `Research question: ${question}`,
  ].join("\n");
};

const extractResearchResponse = (
  response: Schema.Schema.Type<typeof PiCompletionResponseSchema>,
): Effect.Effect<LLMResponse> => {
  const firstChoice = response.choices[0];

  if (firstChoice === undefined) {
    return Effect.die(new Error("Pi API returned no completion choices."));
  }

  const content = normalizeWhitespace(firstChoice.message.content);

  if (content.length === 0) {
    return Effect.die(new Error("Pi API returned an empty completion."));
  }

  return Effect.succeed({
    model: response.model,
    content: firstChoice.message.content,
  });
};

export const makePiLLMGatewayLayer = (
  config: PiGatewayConfig,
): Layer.Layer<LLMGateway, never, never> => {
  const model = config.model.trim().length === 0 ? defaultPiModel : config.model;
  const baseUrl =
    config.baseUrl === undefined || config.baseUrl.trim().length === 0
      ? defaultPiBaseUrl
      : config.baseUrl;

  return Layer.succeed(
    LLMGateway,
    LLMGateway.of({
      generateResearch: (input) =>
        Effect.tryPromise({
          try: async () => {
            const response = await fetch(baseUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`,
              },
              body: JSON.stringify({
                model,
                messages: [
                  {
                    role: "system",
                    content: buildSystemPrompt(),
                  },
                  {
                    role: "user",
                    content: buildUserPrompt(input),
                  },
                ],
              }),
            });

            if (!response.ok) {
              throw new Error(`Pi API request failed with status ${response.status}.`);
            }

            return response.json();
          },
          catch: (error) =>
            error instanceof Error ? error : new Error("Pi API request failed unexpectedly."),
        }).pipe(
          Effect.orDie,
          Effect.flatMap((payload) =>
            Schema.decodeUnknownEffect(PiCompletionResponseSchema)(payload).pipe(
              Effect.mapError(() => new Error("Pi API returned an invalid completion payload.")),
              Effect.orDie,
            ),
          ),
          Effect.flatMap(extractResearchResponse),
        ),
    }),
  );
};

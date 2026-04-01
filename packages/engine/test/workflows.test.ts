import { describe, expect, test } from "bun:test";
import type { ActiveNoteContext, ArtifactDraft, LLMResponse } from "@urban/provenance-shared";
import { Effect, Layer } from "effect";
import {
  ActiveNoteReader,
  ArtifactWriter,
  generateResearchArtifact,
  GenerationFailure,
  generateResearchResponse,
  InvalidConfigurationFailure,
  LLMGateway,
  makePiLLMGatewayLayer,
  makeMockResearchResponse,
  makeResearchArtifactDraft,
  MissingActiveNoteFailure,
  mockLLMGatewayLayer,
  saveResearchArtifact,
} from "../src";

const activeNote: ActiveNoteContext = {
  path: "notes/example.md",
  title: "Example",
  markdown: "# Example\n\nImportant note context.",
};

const llmResponse: LLMResponse = {
  content: "Generated research response.",
  model: "mock-model",
};

const artifactDraft: ArtifactDraft = {
  title: "Example Research",
  body: llmResponse.content,
  sourceNotePath: activeNote.path,
};

const activeNoteReaderLayer = Layer.succeed(
  ActiveNoteReader,
  ActiveNoteReader.of({
    getActiveNote: Effect.succeed(activeNote),
  }),
);

const llmGatewayLayer = Layer.succeed(
  LLMGateway,
  LLMGateway.of({
    generateResearch: (_input) => Effect.succeed(llmResponse),
  }),
);

const artifactWriterLayer = Layer.succeed(
  ArtifactWriter,
  ArtifactWriter.of({
    writeResearchArtifact: (draft) =>
      Effect.succeed({
        path: `saved/${draft.title}.md`,
      }),
  }),
);

describe("engine workflows", () => {
  test("generateResearchResponse fails with a typed missing-active-note error", async () => {
    const missingActiveNoteLayer = Layer.succeed(
      ActiveNoteReader,
      ActiveNoteReader.of({
        getActiveNote: Effect.fail(
          new MissingActiveNoteFailure({
            message: "Open a markdown note before generating a response.",
          }),
        ),
      }),
    );

    await expect(
      Effect.runPromise(
        generateResearchResponse("Summarize the note").pipe(
          Effect.provide(missingActiveNoteLayer),
          Effect.provide(llmGatewayLayer),
        ),
      ),
    ).rejects.toMatchObject({
      _tag: "MissingActiveNoteFailure",
      message: "Open a markdown note before generating a response.",
    });
  });

  test("pi llm gateway fails with a typed invalid-configuration error when the api key is missing", async () => {
    await expect(
      Effect.runPromise(
        generateResearchResponse("Summarize the note").pipe(
          Effect.provide(activeNoteReaderLayer),
          Effect.provide(
            makePiLLMGatewayLayer({
              apiKey: "   ",
              model: "gpt-4.1-mini",
            }),
          ),
        ),
      ),
    ).rejects.toBeInstanceOf(InvalidConfigurationFailure);
  });

  test("generateResearchResponse preserves typed generation failures from the gateway", async () => {
    const failingGatewayLayer = Layer.succeed(
      LLMGateway,
      LLMGateway.of({
        generateResearch: () =>
          Effect.fail(new GenerationFailure({ message: "Pi API request failed with status 502." })),
      }),
    );

    await expect(
      Effect.runPromise(
        generateResearchResponse("Summarize the note").pipe(
          Effect.provide(activeNoteReaderLayer),
          Effect.provide(failingGatewayLayer),
        ),
      ),
    ).rejects.toMatchObject({
      _tag: "GenerationFailure",
      message: "Pi API request failed with status 502.",
    });
  });

  test("mock llm gateway returns a deterministic research response from note context", async () => {
    const result = await Effect.runPromise(
      generateResearchResponse("Summarize the note").pipe(
        Effect.provide(activeNoteReaderLayer),
        Effect.provide(mockLLMGatewayLayer),
      ),
    );

    expect(result).toEqual({
      note: activeNote,
      response: {
        model: "mock-research-v1",
        content: [
          "# Research Brief: Example",
          "",
          "Source note: notes/example.md",
          "Question: Summarize the note",
          "",
          "## Note Snapshot",
          "- Title: Example",
          "- Word count: 5",
          "- Preview: # Example Important note context.",
          "",
          "## Recommended Next Steps",
          "1. Verify the main claim in Example against the source note.",
          "2. Expand the evidence behind: Summarize the note",
          "3. Capture follow-up findings in a new artifact linked to notes/example.md.",
        ].join("\n"),
      },
    });
  });

  test("mock llm gateway falls back to a stable prompt when no explicit question is provided", () => {
    expect(makeMockResearchResponse({ note: activeNote })).toEqual({
      model: "mock-research-v1",
      content: [
        "# Research Brief: Example",
        "",
        "Source note: notes/example.md",
        "Question: No explicit research question provided.",
        "",
        "## Note Snapshot",
        "- Title: Example",
        "- Word count: 5",
        "- Preview: # Example Important note context.",
        "",
        "## Recommended Next Steps",
        "1. Verify the main claim in Example against the source note.",
        "2. Expand the evidence behind: No explicit research question provided.",
        "3. Capture follow-up findings in a new artifact linked to notes/example.md.",
      ].join("\n"),
    });
  });

  test("generateResearchResponse returns generated content without requiring an artifact writer", async () => {
    const result = await Effect.runPromise(
      generateResearchResponse("Summarize the note").pipe(
        Effect.provide(activeNoteReaderLayer),
        Effect.provide(llmGatewayLayer),
      ),
    );

    expect(result).toEqual({
      note: activeNote,
      response: llmResponse,
    });
    expect(makeResearchArtifactDraft(result)).toEqual(artifactDraft);
  });

  test("saveResearchArtifact persists an explicit draft without requiring note or llm services", async () => {
    const result = await Effect.runPromise(
      saveResearchArtifact(artifactDraft).pipe(Effect.provide(artifactWriterLayer)),
    );

    expect(result).toEqual({
      path: "saved/Example Research.md",
    });
  });

  test("generateResearchArtifact still composes generate and save into one flow", async () => {
    const result = await Effect.runPromise(
      generateResearchArtifact("Summarize the note").pipe(
        Effect.provide(activeNoteReaderLayer),
        Effect.provide(llmGatewayLayer),
        Effect.provide(artifactWriterLayer),
      ),
    );

    expect(result).toEqual({
      path: "saved/Example Research.md",
    });
  });

  test("pi llm gateway maps a completion response through the shared contract", async () => {
    const originalFetch = globalThis.fetch;
    const requests: Array<{ readonly url: string; readonly init?: RequestInit }> = [];

    globalThis.fetch = (async (input, init) => {
      const url = typeof input === "string" ? input : input.url;
      requests.push({ url, init });

      return new Response(
        JSON.stringify({
          model: "gpt-4.1-mini",
          choices: [
            {
              index: 0,
              finish_reason: "stop",
              message: {
                role: "assistant",
                content: "# Pi Result\n\nShared gateway response.",
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) satisfies typeof fetch;

    try {
      const result = await Effect.runPromise(
        generateResearchResponse("Summarize the note").pipe(
          Effect.provide(activeNoteReaderLayer),
          Effect.provide(
            makePiLLMGatewayLayer({
              apiKey: "test-key",
              model: "gpt-4.1-mini",
              baseUrl: "https://example.test/v1/chat/completions",
            }),
          ),
        ),
      );

      expect(result.response).toEqual({
        model: "gpt-4.1-mini",
        content: "# Pi Result\n\nShared gateway response.",
      });
      expect(requests).toHaveLength(1);
      expect(requests[0]?.url).toBe("https://example.test/v1/chat/completions");
      expect(requests[0]?.init?.method).toBe("POST");
      expect(requests[0]?.init?.headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer test-key",
      });
      expect(requests[0]?.init?.body).toContain('"model":"gpt-4.1-mini"');
      expect(requests[0]?.init?.body).toContain("Research question: Summarize the note");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("pi llm gateway fails when the provider payload has no completion choices", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          model: "gpt-4.1-mini",
          choices: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )) satisfies typeof fetch;

    try {
      await expect(
        Effect.runPromise(
          generateResearchResponse("Summarize the note").pipe(
            Effect.provide(activeNoteReaderLayer),
            Effect.provide(
              makePiLLMGatewayLayer({
                apiKey: "test-key",
                model: "gpt-4.1-mini",
              }),
            ),
          ),
        ),
      ).rejects.toMatchObject({
        _tag: "GenerationFailure",
        message: "Pi API returned no completion choices.",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

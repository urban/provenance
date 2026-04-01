import { describe, expect, test } from "bun:test";
import type { ActiveNoteContext, ArtifactDraft, LLMResponse } from "@urban/provenance-shared";
import { Effect, Layer } from "effect";
import {
  ActiveNoteReader,
  ArtifactWriter,
  generateResearchArtifact,
  generateResearchResponse,
  LLMGateway,
  makeResearchArtifactDraft,
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
});

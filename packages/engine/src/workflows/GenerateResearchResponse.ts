import type { ActiveNoteContext, ArtifactDraft, LLMResponse } from "@urban/provenance-shared";
import { Effect } from "effect";
import { ActiveNoteReader } from "../services/ActiveNoteReader";
import { LLMGateway } from "../services/LLMGateway";

export interface GeneratedResearch {
  readonly note: ActiveNoteContext;
  readonly response: LLMResponse;
}

export const makeResearchArtifactDraft = (generated: GeneratedResearch): ArtifactDraft => ({
  title: `${generated.note.title} Research`,
  body: generated.response.content,
  sourceNotePath: generated.note.path,
});

export const generateResearchResponse = Effect.fn("generateResearchResponse")(function* (
  question?: string,
) {
  const noteReader = yield* ActiveNoteReader;
  const llm = yield* LLMGateway;

  const note = yield* noteReader.getActiveNote;
  const response = yield* llm.generateResearch({ note, question });

  return { note, response } satisfies GeneratedResearch;
});

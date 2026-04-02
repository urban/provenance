import type { ActiveNoteContext, ArtifactDraft, LLMResponse } from "@urban/provenance-shared";
import { Effect } from "effect";
import { ActiveNoteReader } from "../services/ActiveNoteReader";
import { LLMGateway } from "../services/LLMGateway";

export interface GeneratedResearch {
  readonly note: ActiveNoteContext;
  readonly response: LLMResponse;
}

const normalizeWhitespace = (value: string): string => value.trim().replace(/\s+/g, " ");

const formatGenerationPrompt = (question: string | undefined): string => {
  const normalizedQuestion = question === undefined ? "" : normalizeWhitespace(question);

  return normalizedQuestion.length > 0
    ? normalizedQuestion
    : "No explicit research question provided.";
};

const formatGenerationModel = (model: string | undefined): string => {
  const normalizedModel = model === undefined ? "" : normalizeWhitespace(model);

  return normalizedModel.length > 0 ? normalizedModel : "unknown";
};

export const makeResearchArtifactDraft = (
  generated: GeneratedResearch,
  question?: string,
  generatedAt: string = new Date().toISOString(),
): ArtifactDraft => ({
  title: `${generated.note.title} Research`,
  body: generated.response.content,
  sourceNotePath: generated.note.path,
  generatedAt,
  generationContext: {
    prompt: formatGenerationPrompt(question),
    model: formatGenerationModel(generated.response.model),
  },
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

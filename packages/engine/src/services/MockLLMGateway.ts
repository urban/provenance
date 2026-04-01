import type { LLMResponse } from "@urban/provenance-shared";
import { Effect, Layer } from "effect";
import { LLMGateway, type GenerateResearchInput } from "./LLMGateway";

const normalizeWhitespace = (value: string): string => value.trim().replace(/\s+/g, " ");

const makeNotePreview = (markdown: string): string => {
  const normalizedMarkdown = normalizeWhitespace(markdown);

  if (normalizedMarkdown.length === 0) {
    return "The active note is empty.";
  }

  return normalizedMarkdown.slice(0, 240);
};

const countWords = (value: string): number => {
  const normalizedValue = normalizeWhitespace(value);

  if (normalizedValue.length === 0) {
    return 0;
  }

  return normalizedValue.split(" ").length;
};

const formatQuestion = (question: string | undefined): string => {
  const normalizedQuestion = question === undefined ? "" : normalizeWhitespace(question);

  if (normalizedQuestion.length === 0) {
    return "No explicit research question provided.";
  }

  return normalizedQuestion;
};

export const makeMockResearchResponse = (input: GenerateResearchInput): LLMResponse => {
  const prompt = formatQuestion(input.question);
  const preview = makeNotePreview(input.note.markdown);
  const noteWordCount = countWords(input.note.markdown);

  return {
    model: "mock-research-v1",
    content: [
      `# Research Brief: ${input.note.title}`,
      "",
      `Source note: ${input.note.path}`,
      `Question: ${prompt}`,
      "",
      "## Note Snapshot",
      `- Title: ${input.note.title}`,
      `- Word count: ${noteWordCount}`,
      `- Preview: ${preview}`,
      "",
      "## Recommended Next Steps",
      `1. Verify the main claim in ${input.note.title} against the source note.`,
      `2. Expand the evidence behind: ${prompt}`,
      `3. Capture follow-up findings in a new artifact linked to ${input.note.path}.`,
    ].join("\n"),
  };
};

export const mockLLMGatewayLayer = Layer.succeed(
  LLMGateway,
  LLMGateway.of({
    generateResearch: (input) => Effect.succeed(makeMockResearchResponse(input)),
  }),
);

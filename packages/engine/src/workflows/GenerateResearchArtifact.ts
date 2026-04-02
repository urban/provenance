import { Effect } from "effect";
import { generateResearchResponse, makeResearchArtifactDraft } from "./GenerateResearchResponse";
import { saveResearchArtifact } from "./SaveResearchArtifact";

export const generateResearchArtifact = Effect.fn("generateResearchArtifact")(function* (
  question?: string,
) {
  const generated = yield* generateResearchResponse(question);
  return yield* saveResearchArtifact(makeResearchArtifactDraft(generated, question));
});

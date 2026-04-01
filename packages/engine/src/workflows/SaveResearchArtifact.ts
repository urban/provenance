import type { ArtifactDraft } from "@urban/provenance-shared";
import { Effect } from "effect";
import { ArtifactWriter } from "../services/ArtifactWriter";

export const saveResearchArtifact = Effect.fn("saveResearchArtifact")(function* (
  draft: ArtifactDraft,
) {
  const writer = yield* ArtifactWriter;
  return yield* writer.writeResearchArtifact(draft);
});

import { Effect, Layer, ServiceMap } from "effect";
import type { ArtifactDraft } from "@urban/provenance-shared";

export interface ArtifactWriteResult {
  readonly path: string;
}

export class ArtifactWriter extends ServiceMap.Service<
  ArtifactWriter,
  {
    writeResearchArtifact(draft: ArtifactDraft): Effect.Effect<ArtifactWriteResult>;
  }
>()("@urban/provenance-engine/services/ArtifactWriter") {
  static readonly writeResearchArtifact = Effect.fn("ArtifactWriter.writeResearchArtifact")(
    function* (_draft: ArtifactDraft) {
      return yield* Effect.die("ArtifactWriter not implemented");
    },
  );

  static readonly layer = Layer.succeed(
    ArtifactWriter,
    ArtifactWriter.of({
      writeResearchArtifact: ArtifactWriter.writeResearchArtifact,
    }),
  );
}

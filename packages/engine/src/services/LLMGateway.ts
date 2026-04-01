import { Effect, Layer, ServiceMap } from "effect";
import type { ActiveNoteContext, LLMResponse } from "@urban/provenance-shared";

export interface GenerateResearchInput {
  readonly note: ActiveNoteContext;
  readonly question?: string;
}

export class LLMGateway extends ServiceMap.Service<
  LLMGateway,
  {
    generateResearch(input: GenerateResearchInput): Effect.Effect<LLMResponse>;
  }
>()("@urban/provenance-engine/services/LLMGateway") {
  static readonly generateResearch = Effect.fn("LLMGateway.generateResearch")(function* (
    _input: GenerateResearchInput,
  ) {
    return yield* Effect.die("LLMGateway not implemented");
  });

  static readonly layer = Layer.succeed(
    LLMGateway,
    LLMGateway.of({
      generateResearch: LLMGateway.generateResearch,
    }),
  );
}

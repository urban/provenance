import { Effect, Layer, ServiceMap } from "effect";
import type { ActiveNoteContext } from "@urban/provenance-shared";
import { GenerationFailure, type ResearchWorkflowFailure } from "../errors/ResearchWorkflowFailure";

export class ActiveNoteReader extends ServiceMap.Service<
  ActiveNoteReader,
  {
    readonly getActiveNote: Effect.Effect<ActiveNoteContext, ResearchWorkflowFailure>;
  }
>()("@urban/provenance-engine/services/ActiveNoteReader") {
  static readonly layer = Layer.succeed(
    ActiveNoteReader,
    ActiveNoteReader.of({
      getActiveNote: Effect.fail(
        new GenerationFailure({ message: "ActiveNoteReader not implemented." }),
      ),
    }),
  );
}

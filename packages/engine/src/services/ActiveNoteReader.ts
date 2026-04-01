import { Effect, Layer, ServiceMap } from "effect";
import type { ActiveNoteContext } from "@urban/provenance-shared";

export class ActiveNoteReader extends ServiceMap.Service<
  ActiveNoteReader,
  {
    readonly getActiveNote: Effect.Effect<ActiveNoteContext>;
  }
>()("@urban/provenance-engine/services/ActiveNoteReader") {
  static readonly layer = Layer.succeed(
    ActiveNoteReader,
    ActiveNoteReader.of({
      getActiveNote: Effect.die("ActiveNoteReader not implemented"),
    }),
  );
}

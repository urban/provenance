import {
  ActiveNoteReader,
  GenerationFailure,
  MissingActiveNoteFailure,
  type ResearchWorkflowFailure,
} from "@urban/provenance-engine";
import { Effect, Layer } from "effect";
import type { ActiveNoteContext } from "@urban/provenance-shared";
import type ProvenancePlugin from "../main";

const missingActiveNoteMessage = "Open a markdown note before generating a response.";

const readActiveNote = (
  plugin: ProvenancePlugin,
): Effect.Effect<ActiveNoteContext, ResearchWorkflowFailure> =>
  Effect.gen(function* () {
    const file = plugin.app.workspace.getActiveFile();

    if (file === null || file.extension !== "md") {
      return yield* Effect.fail(
        new MissingActiveNoteFailure({ message: missingActiveNoteMessage }),
      );
    }

    const markdown = yield* Effect.tryPromise({
      try: () => plugin.app.vault.cachedRead(file),
      catch: (cause) =>
        new GenerationFailure({
          message:
            cause instanceof Error
              ? `Failed to read the active note: ${cause.message}`
              : "Failed to read the active note.",
        }),
    });

    return {
      path: file.path,
      title: file.basename,
      markdown,
    };
  });

export const makeObsidianActiveNoteReaderLayer = (
  plugin: ProvenancePlugin,
): Layer.Layer<ActiveNoteReader> =>
  Layer.succeed(
    ActiveNoteReader,
    ActiveNoteReader.of({
      getActiveNote: readActiveNote(plugin),
    }),
  );

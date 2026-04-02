import {
  ActiveNoteReader,
  GenerationFailure,
  MissingActiveNoteFailure,
  type ResearchWorkflowFailure,
} from "@urban/provenance-engine";
import { Effect, Layer } from "effect";
import type { ActiveNoteContext } from "@urban/provenance-shared";

const missingActiveNoteMessage = "Open a markdown note before generating a response.";

interface ActiveMarkdownFile {
  readonly extension: string;
  readonly path: string;
  readonly basename: string;
}

export interface ObsidianActiveNoteReaderHost<
  File extends ActiveMarkdownFile = ActiveMarkdownFile,
> {
  readonly app: {
    readonly workspace: {
      readonly getActiveFile: () => File | null;
    };
    readonly vault: {
      readonly cachedRead: (file: File) => Promise<string>;
    };
  };
}

const readActiveNote = <File extends ActiveMarkdownFile>(
  host: ObsidianActiveNoteReaderHost<File>,
): Effect.Effect<ActiveNoteContext, ResearchWorkflowFailure> =>
  Effect.gen(function* () {
    const file = host.app.workspace.getActiveFile();

    if (file === null || file.extension !== "md") {
      return yield* Effect.fail(
        new MissingActiveNoteFailure({ message: missingActiveNoteMessage }),
      );
    }

    const markdown = yield* Effect.tryPromise({
      try: () => host.app.vault.cachedRead(file),
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

export const makeObsidianActiveNoteReaderLayer = <File extends ActiveMarkdownFile>(
  host: ObsidianActiveNoteReaderHost<File>,
): Layer.Layer<ActiveNoteReader> =>
  Layer.succeed(
    ActiveNoteReader,
    ActiveNoteReader.of({
      getActiveNote: readActiveNote(host),
    }),
  );

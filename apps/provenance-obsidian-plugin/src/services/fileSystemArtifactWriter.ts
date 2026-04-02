import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import {
  ArtifactWriter,
  ArtifactWriteFailure,
  BlockedWriteFailure,
  InvalidConfigurationFailure,
  saveResearchArtifact,
} from "@urban/provenance-engine";
import { isWithinBasePath, normalizeSlashes, type ArtifactDraft } from "@urban/provenance-shared";
import { Effect, Layer } from "effect";

export interface FileSystemArtifactWriterOptions {
  readonly outputPath: string;
  readonly vaultBasePath: string;
}

interface ResolvedArtifactTarget {
  readonly absoluteRootPath: string;
  readonly absolutePath: string;
  readonly savedPath: string;
}

const fallbackArtifactBasename = "research-artifact";

const sanitizeArtifactBasename = (value: string): string => {
  const collapsed = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return collapsed.length > 0 ? collapsed : fallbackArtifactBasename;
};

const toMarkdown = (draft: ArtifactDraft): string => {
  const trimmedBody = draft.body.trim();

  return [
    `# ${draft.title}`,
    "",
    `Source note: ${draft.sourceNotePath}`,
    "",
    trimmedBody.length > 0 ? trimmedBody : "_No generated content._",
    "",
  ].join("\n");
};

const resolveArtifactTarget = (
  options: FileSystemArtifactWriterOptions,
  draft: ArtifactDraft,
): Effect.Effect<ResolvedArtifactTarget, InvalidConfigurationFailure | BlockedWriteFailure> => {
  const normalizedOutputPath = normalizeSlashes(options.outputPath.trim());
  const artifactFileName = `${sanitizeArtifactBasename(draft.title)}.md`;

  if (normalizedOutputPath.length === 0) {
    return Effect.fail(
      new InvalidConfigurationFailure({
        message: "Set a research output path before saving artifacts.",
      }),
    );
  }

  if (isAbsolute(normalizedOutputPath)) {
    const absoluteRootPath = resolve(normalizedOutputPath);
    const absolutePath = resolve(normalizedOutputPath, artifactFileName);

    if (!isWithinBasePath(absoluteRootPath, absolutePath)) {
      return Effect.fail(
        new BlockedWriteFailure({
          message: `Blocked artifact save outside the configured output path: ${normalizeSlashes(absolutePath)}`,
        }),
      );
    }

    return Effect.succeed({
      absoluteRootPath,
      absolutePath,
      savedPath: normalizeSlashes(absolutePath),
    });
  }

  const absoluteRoot = resolve(options.vaultBasePath, normalizedOutputPath);
  const absolutePath = join(absoluteRoot, artifactFileName);

  if (!isWithinBasePath(resolve(options.vaultBasePath), absoluteRoot)) {
    return Effect.fail(
      new BlockedWriteFailure({
        message: `Blocked artifact save outside the configured output path: ${normalizeSlashes(absolutePath)}`,
      }),
    );
  }

  if (!isWithinBasePath(absoluteRoot, absolutePath)) {
    return Effect.fail(
      new BlockedWriteFailure({
        message: `Blocked artifact save outside the configured output path: ${normalizeSlashes(absolutePath)}`,
      }),
    );
  }

  return Effect.succeed({
    absoluteRootPath: absoluteRoot,
    absolutePath,
    savedPath: normalizeSlashes(join(normalizedOutputPath, artifactFileName)),
  });
};

const writeArtifactToFileSystem = Effect.fn("writeArtifactToFileSystem")(
  (options: FileSystemArtifactWriterOptions, draft: ArtifactDraft) =>
    Effect.gen(function* () {
      const target = yield* resolveArtifactTarget(options, draft);

      yield* Effect.tryPromise({
        try: () => mkdir(dirname(target.absolutePath), { recursive: true }),
        catch: (error) =>
          new ArtifactWriteFailure({
            message:
              error instanceof Error && error.message.trim().length > 0
                ? error.message
                : `Failed to create artifact directory under ${normalizeSlashes(target.absoluteRootPath)}.`,
          }),
      });

      yield* Effect.tryPromise({
        try: () => writeFile(target.absolutePath, toMarkdown(draft), "utf8"),
        catch: (error) =>
          new ArtifactWriteFailure({
            message:
              error instanceof Error && error.message.trim().length > 0
                ? error.message
                : `Failed to write artifact to ${normalizeSlashes(target.absolutePath)}.`,
          }),
      });

      return {
        path: target.savedPath,
      };
    }),
);

export const makeFileSystemArtifactWriterLayer = (
  options: FileSystemArtifactWriterOptions,
): Layer.Layer<ArtifactWriter> =>
  Layer.succeed(
    ArtifactWriter,
    ArtifactWriter.of({
      writeResearchArtifact: Effect.fn("ArtifactWriter.writeResearchArtifact")(function* (
        draft: ArtifactDraft,
      ) {
        return yield* writeArtifactToFileSystem(options, draft);
      }),
    }),
  );

export const saveDraftWithFileSystemArtifactWriter = (
  options: FileSystemArtifactWriterOptions,
  draft: ArtifactDraft,
) => saveResearchArtifact(draft).pipe(Effect.provide(makeFileSystemArtifactWriterLayer(options)));

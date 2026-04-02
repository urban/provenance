import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, parse, resolve } from "node:path";
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

const formatMetadataLine = (label: string, value: string): string => `- ${label}: ${value}`;

const toMarkdown = (draft: ArtifactDraft): string => {
  const trimmedBody = draft.body.trim();

  return [
    `# ${draft.title}`,
    "",
    "## Metadata",
    formatMetadataLine("Source note", draft.sourceNotePath),
    formatMetadataLine("Generated at", draft.generatedAt),
    formatMetadataLine("Generation model", draft.generationContext.model),
    formatMetadataLine("Prompt", draft.generationContext.prompt),
    "",
    "## Response",
    trimmedBody.length > 0 ? trimmedBody : "_No generated content._",
    "",
  ].join("\n");
};

const appendCollisionSuffix = (artifactFileName: string, index: number): string => {
  const parsedPath = parse(artifactFileName);
  const fileExtension = extname(artifactFileName);
  const basename = fileExtension.length > 0 ? parsedPath.name : artifactFileName;

  return `${basename}-${index}${fileExtension}`;
};

const findAvailableArtifactFileName = Effect.fn("findAvailableArtifactFileName")(function* (
  absoluteRootPath: string,
  artifactFileName: string,
) {
  for (let collisionIndex = 1; collisionIndex < 10_000; collisionIndex += 1) {
    const candidateFileName =
      collisionIndex === 1
        ? artifactFileName
        : appendCollisionSuffix(artifactFileName, collisionIndex);
    const candidateAbsolutePath = join(absoluteRootPath, candidateFileName);

    const exists = yield* Effect.tryPromise({
      try: () =>
        access(candidateAbsolutePath)
          .then(() => true)
          .catch(() => false),
      catch: (error) =>
        new ArtifactWriteFailure({
          message:
            error instanceof Error
              ? error.message
              : `Failed to inspect artifact path ${normalizeSlashes(candidateAbsolutePath)}.`,
        }),
    });

    if (!exists) {
      return candidateFileName;
    }
  }

  return yield* Effect.fail(
    new ArtifactWriteFailure({
      message: `Failed to derive an available artifact name under ${normalizeSlashes(absoluteRootPath)}.`,
    }),
  );
});

const resolveArtifactRoot = (
  options: FileSystemArtifactWriterOptions,
  artifactFileName: string,
): Effect.Effect<
  {
    readonly absoluteRootPath: string;
    readonly savedPathFromFileName: (fileName: string) => string;
  },
  InvalidConfigurationFailure | BlockedWriteFailure
> => {
  const normalizedOutputPath = normalizeSlashes(options.outputPath.trim());

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
      savedPathFromFileName: (fileName) => normalizeSlashes(resolve(absoluteRootPath, fileName)),
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
    savedPathFromFileName: (fileName) => normalizeSlashes(join(normalizedOutputPath, fileName)),
  });
};

const writeArtifactToFileSystem = Effect.fn("writeArtifactToFileSystem")(
  (options: FileSystemArtifactWriterOptions, draft: ArtifactDraft) =>
    Effect.gen(function* () {
      const baseArtifactFileName = `${sanitizeArtifactBasename(draft.title)}.md`;
      const resolvedRoot = yield* resolveArtifactRoot(options, baseArtifactFileName);
      const artifactFileName = yield* findAvailableArtifactFileName(
        resolvedRoot.absoluteRootPath,
        baseArtifactFileName,
      );
      const absolutePath = join(resolvedRoot.absoluteRootPath, artifactFileName);
      const target: ResolvedArtifactTarget = {
        absoluteRootPath: resolvedRoot.absoluteRootPath,
        absolutePath,
        savedPath: resolvedRoot.savedPathFromFileName(artifactFileName),
      };

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

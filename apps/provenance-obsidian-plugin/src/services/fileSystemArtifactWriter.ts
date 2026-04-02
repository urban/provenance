import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import {
  ArtifactWriter,
  type ArtifactWriteResult,
  saveResearchArtifact,
} from "@urban/provenance-engine";
import { normalizeSlashes, type ArtifactDraft } from "@urban/provenance-shared";
import { Effect, Layer } from "effect";

export interface FileSystemArtifactWriterOptions {
  readonly outputPath: string;
  readonly vaultBasePath: string;
}

interface ResolvedArtifactTarget {
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
): ResolvedArtifactTarget => {
  const normalizedOutputPath = normalizeSlashes(options.outputPath.trim());
  const artifactFileName = `${sanitizeArtifactBasename(draft.title)}.md`;

  if (normalizedOutputPath.length === 0) {
    throw new Error("Set a research output path before saving artifacts.");
  }

  if (isAbsolute(normalizedOutputPath)) {
    const absolutePath = resolve(normalizedOutputPath, artifactFileName);
    return {
      absolutePath,
      savedPath: normalizeSlashes(absolutePath),
    };
  }

  const absoluteRoot = resolve(options.vaultBasePath, normalizedOutputPath);
  const absolutePath = join(absoluteRoot, artifactFileName);

  return {
    absolutePath,
    savedPath: normalizeSlashes(join(normalizedOutputPath, artifactFileName)),
  };
};

const writeArtifactToFileSystem = async (
  options: FileSystemArtifactWriterOptions,
  draft: ArtifactDraft,
): Promise<ArtifactWriteResult> => {
  const target = resolveArtifactTarget(options, draft);

  await mkdir(dirname(target.absolutePath), { recursive: true });
  await writeFile(target.absolutePath, toMarkdown(draft), "utf8");

  return {
    path: target.savedPath,
  };
};

export const makeFileSystemArtifactWriterLayer = (
  options: FileSystemArtifactWriterOptions,
): Layer.Layer<ArtifactWriter> =>
  Layer.succeed(
    ArtifactWriter,
    ArtifactWriter.of({
      writeResearchArtifact: Effect.fn("ArtifactWriter.writeResearchArtifact")(function* (
        draft: ArtifactDraft,
      ) {
        return yield* Effect.tryPromise(() => writeArtifactToFileSystem(options, draft)).pipe(
          Effect.orDie,
        );
      }),
    }),
  );

export const saveDraftWithFileSystemArtifactWriter = (
  options: FileSystemArtifactWriterOptions,
  draft: ArtifactDraft,
) => saveResearchArtifact(draft).pipe(Effect.provide(makeFileSystemArtifactWriterLayer(options)));

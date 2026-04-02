import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactDraft } from "@urban/provenance-shared";
import { Effect } from "effect";
import { saveDraftWithFileSystemArtifactWriter } from "./fileSystemArtifactWriter";

const artifactDraft: ArtifactDraft = {
  title: "Example Research",
  body: "Generated research response.",
  sourceNotePath: "notes/example.md",
};

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("artifact writer", () => {
  test("writes generated markdown into the configured relative output path", async () => {
    const vaultBasePath = await mkdtemp(join(tmpdir(), "provenance-plugin-"));
    tempDirectories.push(vaultBasePath);

    const result = await Effect.runPromise(
      saveDraftWithFileSystemArtifactWriter(
        {
          outputPath: ".provenance/knowledge/research",
          vaultBasePath,
        },
        artifactDraft,
      ),
    );

    expect(result).toEqual({
      path: ".provenance/knowledge/research/example-research.md",
    });

    const savedArtifact = await readFile(
      join(vaultBasePath, ".provenance/knowledge/research/example-research.md"),
      "utf8",
    );

    expect(savedArtifact).toBe(
      [
        "# Example Research",
        "",
        "Source note: notes/example.md",
        "",
        "Generated research response.",
        "",
      ].join("\n"),
    );
  });

  test("writes generated markdown into an absolute output path", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "provenance-plugin-"));
    tempDirectories.push(tempRoot);

    const absoluteOutputPath = join(tempRoot, "external-artifacts");
    const result = await Effect.runPromise(
      saveDraftWithFileSystemArtifactWriter(
        {
          outputPath: absoluteOutputPath,
          vaultBasePath: join(tempRoot, "vault"),
        },
        artifactDraft,
      ),
    );

    expect(result).toEqual({
      path: `${absoluteOutputPath.replace(/\\/g, "/")}/example-research.md`,
    });

    const savedArtifact = await readFile(join(absoluteOutputPath, "example-research.md"), "utf8");
    expect(savedArtifact).toContain("Source note: notes/example.md");
    expect(savedArtifact).toContain("Generated research response.");
  });
});

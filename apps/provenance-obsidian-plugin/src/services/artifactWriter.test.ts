import { afterEach, describe, expect, test } from "bun:test";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactDraft } from "@urban/provenance-shared";
import { Effect } from "effect";
import { saveDraftWithFileSystemArtifactWriter } from "./fileSystemArtifactWriter";

const artifactDraft: ArtifactDraft = {
  title: "Example Research",
  body: "Generated research response.",
  sourceNotePath: "notes/example.md",
  generatedAt: "2026-04-02T02:15:00.000Z",
  generationContext: {
    prompt: "Summarize the current note.",
    model: "mock-research-v1",
  },
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
        "## Metadata",
        "- Source note: notes/example.md",
        "- Generated at: 2026-04-02T02:15:00.000Z",
        "- Generation model: mock-research-v1",
        "- Prompt: Summarize the current note.",
        "",
        "## Response",
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
    expect(savedArtifact).toContain("## Metadata");
    expect(savedArtifact).toContain("- Source note: notes/example.md");
    expect(savedArtifact).toContain("Generated research response.");
  });

  test("preserves prior artifacts by suffixing repeat saves from the same note", async () => {
    const vaultBasePath = await mkdtemp(join(tmpdir(), "provenance-plugin-"));
    tempDirectories.push(vaultBasePath);

    const firstResult = await Effect.runPromise(
      saveDraftWithFileSystemArtifactWriter(
        {
          outputPath: ".provenance/knowledge/research",
          vaultBasePath,
        },
        artifactDraft,
      ),
    );

    const secondResult = await Effect.runPromise(
      saveDraftWithFileSystemArtifactWriter(
        {
          outputPath: ".provenance/knowledge/research",
          vaultBasePath,
        },
        artifactDraft,
      ),
    );

    expect(firstResult).toEqual({
      path: ".provenance/knowledge/research/example-research.md",
    });
    expect(secondResult).toEqual({
      path: ".provenance/knowledge/research/example-research-2.md",
    });

    const firstArtifact = await readFile(
      join(vaultBasePath, ".provenance/knowledge/research/example-research.md"),
      "utf8",
    );
    const secondArtifact = await readFile(
      join(vaultBasePath, ".provenance/knowledge/research/example-research-2.md"),
      "utf8",
    );

    expect(secondArtifact).toBe(firstArtifact);
  });

  test("rejects writes when a relative output path escapes the vault boundary", async () => {
    const vaultBasePath = await mkdtemp(join(tmpdir(), "provenance-plugin-"));
    tempDirectories.push(vaultBasePath);

    await expect(
      Effect.runPromise(
        saveDraftWithFileSystemArtifactWriter(
          {
            outputPath: "../outside-artifacts",
            vaultBasePath,
          },
          artifactDraft,
        ),
      ),
    ).rejects.toMatchObject({
      _tag: "BlockedWriteFailure",
      message: `Blocked artifact save outside the configured output path: ${join(
        vaultBasePath,
        "../outside-artifacts/example-research.md",
      ).replace(/\\/g, "/")}`,
    });

    await expect(
      access(join(vaultBasePath, "../outside-artifacts/example-research.md")),
    ).rejects.toBeDefined();
  });

  test("surfaces artifact write failures when the configured output root cannot be created", async () => {
    const vaultBasePath = await mkdtemp(join(tmpdir(), "provenance-plugin-"));
    tempDirectories.push(vaultBasePath);

    const blockedRootPath = join(vaultBasePath, "existing-file");
    await writeFile(blockedRootPath, "occupied", "utf8");

    await expect(
      Effect.runPromise(
        saveDraftWithFileSystemArtifactWriter(
          {
            outputPath: "existing-file",
            vaultBasePath,
          },
          artifactDraft,
        ),
      ),
    ).rejects.toMatchObject({
      _tag: "ArtifactWriteFailure",
    });

    expect(artifactDraft.body).toBe("Generated research response.");
    await expect(access(join(blockedRootPath, "example-research.md"))).rejects.toBeDefined();
  });
});

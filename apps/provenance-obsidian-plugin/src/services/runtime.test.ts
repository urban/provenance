import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mockLLMGatewayLayer } from "@urban/provenance-engine";
import { Layer } from "effect";
import {
  makeObsidianActiveNoteReaderLayer,
  type ObsidianActiveNoteReaderHost,
} from "./activeNoteReader";
import { makeFileSystemArtifactWriterLayer } from "./fileSystemArtifactWriter";
import { makePanelWorkflowRuntime } from "./panelWorkflowRuntime";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("panel workflow runtime", () => {
  test("generates and saves an artifact under the in-vault machine-owned path", async () => {
    const vaultBasePath = await mkdtemp(join(tmpdir(), "provenance-plugin-validation-"));
    tempDirectories.push(vaultBasePath);

    const notePath = join(vaultBasePath, "notes", "source-note.md");
    const noteMarkdown = [
      "# Source Note",
      "",
      "A short note about preserving the separation between authored notes and generated research.",
    ].join("\n");

    await mkdir(join(vaultBasePath, "notes"), { recursive: true });
    await writeFile(notePath, noteMarkdown, "utf8");

    const host: ObsidianActiveNoteReaderHost = {
      app: {
        workspace: {
          getActiveFile: () => ({
            extension: "md",
            path: "notes/source-note.md",
            basename: "Source Note",
          }),
        },
        vault: {
          cachedRead: async () => noteMarkdown,
        },
      },
    };

    const runtime = makePanelWorkflowRuntime(
      Layer.merge(
        Layer.merge(makeObsidianActiveNoteReaderLayer(host), mockLLMGatewayLayer),
        makeFileSystemArtifactWriterLayer({
          outputPath: ".provenance/knowledge/research",
          vaultBasePath,
        }),
      ),
    );

    try {
      const generated = await runtime.generatePanelResponse(
        "Summarize the current note and suggest next research questions.",
      );

      expect(generated.content).toContain("# Research Brief: Source Note");
      expect(generated.content).toContain("Source note: notes/source-note.md");
      expect(generated.artifactDraft).toMatchObject({
        title: "Source Note Research",
        sourceNotePath: "notes/source-note.md",
        generationContext: {
          model: "mock-research-v1",
          prompt: "Summarize the current note and suggest next research questions.",
        },
      });

      const saved = await runtime.saveGeneratedResponse(generated.artifactDraft);

      expect(saved).toEqual({
        message: "Saved artifact to .provenance/knowledge/research/source-note-research.md.",
      });

      const savedArtifact = await readFile(
        join(vaultBasePath, ".provenance/knowledge/research/source-note-research.md"),
        "utf8",
      );

      expect(savedArtifact).toContain("# Source Note Research");
      expect(savedArtifact).toContain("- Source note: notes/source-note.md");
      expect(savedArtifact).toContain(
        "- Prompt: Summarize the current note and suggest next research questions.",
      );
      expect(savedArtifact).toContain("## Response");
    } finally {
      runtime.dispose();
    }
  });
});

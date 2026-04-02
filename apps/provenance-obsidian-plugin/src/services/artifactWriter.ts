import { ArtifactWriter } from "@urban/provenance-engine";
import { Layer } from "effect";
import { FileSystemAdapter } from "obsidian";
import type ProvenancePlugin from "../main";
import { makeFileSystemArtifactWriterLayer } from "./fileSystemArtifactWriter";

const resolveVaultBasePath = (plugin: ProvenancePlugin): string => {
  const adapter = plugin.app.vault.adapter;

  if (!(adapter instanceof FileSystemAdapter)) {
    throw new Error("Artifact saving requires the Obsidian desktop file system adapter.");
  }

  return adapter.getBasePath();
};

export const makeObsidianArtifactWriterLayer = (
  plugin: ProvenancePlugin,
  outputPath: string,
): Layer.Layer<ArtifactWriter> =>
  makeFileSystemArtifactWriterLayer({
    outputPath,
    vaultBasePath: resolveVaultBasePath(plugin),
  });

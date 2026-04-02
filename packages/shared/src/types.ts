export interface ArtifactGenerationContext {
  prompt: string;
  model: string;
}

export interface ArtifactDraft {
  title: string;
  body: string;
  sourceNotePath: string;
  generatedAt: string;
  generationContext: ArtifactGenerationContext;
}

export interface ActiveNoteContext {
  path: string;
  title: string;
  markdown: string;
}

export interface LLMResponse {
  content: string;
  model?: string;
}

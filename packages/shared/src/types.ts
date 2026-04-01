export interface ArtifactDraft {
  title: string;
  body: string;
  sourceNotePath: string;
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

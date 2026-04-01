import { useSyncExternalStore } from "react";
import type ProvenancePlugin from "../main";
import { type PersistedSettings } from "../config";

const isLlmMode = (value: string): value is PersistedSettings["llmMode"] =>
  value === "disabled" || value === "mock" || value === "pi";

export const SettingsView = ({ plugin }: { plugin: ProvenancePlugin }) => {
  const settings = useSyncExternalStore(
    (onStoreChange) => plugin.appAccess.subscribeSettings(onStoreChange),
    () => plugin.appAccess.getSettings(),
    () => plugin.appAccess.getSettings(),
  );

  return (
    <div>
      <h2>LLM mode</h2>
      <p>Choose how Provenance should generate research artifacts.</p>
      <select
        value={settings.llmMode}
        onChange={async (e) => {
          const value = e.target.value;
          if (!isLlmMode(value)) return;

          await plugin.updateSettings({
            ...plugin.appAccess.getSettings(),
            llmMode: value,
          });
        }}
      >
        <option value="disabled">Disabled</option>
        <option value="mock">Mock</option>
        <option value="pi">Pi</option>
      </select>
      <hr />
      <h2>Research output path</h2>
      <p>Relative vault path where generated research artifacts should be written.</p>
      <input
        type="text"
        placeholder=".provenance/knowledge/research"
        value={settings.llmOutputPath}
        onChange={async (e) => {
          await plugin.updateSettings({
            ...plugin.appAccess.getSettings(),
            llmOutputPath: e.target.value,
          });
        }}
      />
    </div>
  );
};

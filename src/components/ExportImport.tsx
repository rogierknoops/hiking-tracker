import { useRef } from "react";
import { useHikeStore } from "../stores/hikeStore";
import { exportSession, importSession } from "../lib/storage";

export function ExportImport() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const state = useHikeStore.getState();
    const session = {
      id: state.id,
      name: state.name,
      segments: state.segments,
      departureTime: state.departureTime,
      departureLogged: state.departureLogged,
      durationFormula: state.durationFormula,
    };
    const data = exportSession(session);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hike-${state.name.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const imported = importSession(text);
      if (imported) {
        useHikeStore.setState(imported);
        useHikeStore.getState().persist();
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="font-[var(--ds-font-family)] text-[length:var(--ds-font-size)] uppercase tracking-[var(--ds-letter-spacing)] text-[var(--ds-black)] hover:underline px-1"
      >
        Export
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="font-[var(--ds-font-family)] text-[length:var(--ds-font-size)] uppercase tracking-[var(--ds-letter-spacing)] text-[var(--ds-black)] hover:underline px-1"
      >
        Import
      </button>
    </div>
  );
}

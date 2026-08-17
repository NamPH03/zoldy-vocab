// src/components/dictionary/SearchBar.tsx
"use client";

type Props = {
  query: string;
  onChange: (value: string) => void;
  onClear: () => void;
  loading: boolean;
  placeholder?: string;
};

export default function SearchBar({
  query,
  onChange,
  onClear,
  loading,
  placeholder,
}: Props) {
  return (
    <div className="relative flex gap-2 items-center">
      <div className="relative flex-1">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg" style={{ color: "var(--text-faint)" }}>
          🔍
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Nhập từ tiếng Anh hoặc nghĩa tiếng Việt..."}
          className="input pl-11 pr-11 py-3.5 text-base rounded-2xl w-full border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
            color: "var(--text)",
          }}
        />

        {/* Loading */}
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          </div>
        )}

        {/* Clear button */}
        {query && !loading && (
          <button
            onClick={onClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
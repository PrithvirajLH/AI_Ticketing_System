"use client";

interface DepartmentOption {
  id: string;
  name: string;
  confidence: number;
  isSuggested: boolean;
}

interface DepartmentPickerProps {
  options: DepartmentOption[];
  onSelect: (dept: DepartmentOption) => void;
  isLoading: boolean;
}

export function DepartmentPicker({ options, onSelect, isLoading }: DepartmentPickerProps) {
  if (options.length === 0) return null;

  return (
    <div className="border border-blue-800 bg-blue-950/50 rounded p-4 space-y-3">
      <div>
        <h3 className="text-sm font-medium text-blue-300">Step 2.5 — Select Department</h3>
        <p className="text-xs text-gray-400 mt-1">
          The AI suggests a department below. Confirm or pick a different one.
        </p>
      </div>

      <div className="space-y-2">
        {options.map((dept) => (
          <button
            key={dept.id}
            onClick={() => onSelect(dept)}
            disabled={isLoading}
            className={`w-full text-left px-3 py-2 rounded border transition-colors disabled:opacity-50 ${
              dept.isSuggested
                ? "border-blue-500 bg-blue-900/50 hover:bg-blue-900"
                : "border-gray-700 bg-gray-800/50 hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium">{dept.name}</span>
                {dept.isSuggested ? (
                  <span className="text-xs bg-blue-800 text-blue-200 px-1.5 py-0.5 rounded">
                    AI Suggested
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {(dept.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center text-sm text-gray-400">
          <span className="inline-block animate-spin mr-2">&#9696;</span>
          Running remaining pipeline steps...
        </div>
      ) : null}
    </div>
  );
}

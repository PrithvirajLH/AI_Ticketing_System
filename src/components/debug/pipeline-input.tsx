"use client";

interface PipelineInputFormProps {
  onSubmit: (text: string, userId: string) => void;
  isLoading: boolean;
}

export function PipelineInputForm({ onSubmit, isLoading }: PipelineInputFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const text = (form.elements.namedItem("text") as HTMLTextAreaElement).value;
        const userId = (form.elements.namedItem("userId") as HTMLInputElement).value;
        onSubmit(text, userId);
      }}
      className="space-y-3"
    >
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-300 mb-1">
          Employee Request
        </label>
        <textarea
          id="text"
          name="text"
          rows={3}
          required
          placeholder="e.g. I can't access SAP and I have a deadline tomorrow"
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          defaultValue="I can't access SAP and I have a deadline tomorrow for the quarterly report"
        />
      </div>
      <div>
        <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-1">
          User ID (optional)
        </label>
        <input
          id="userId"
          name="userId"
          type="text"
          placeholder="e.g. a89f9497-b330-47ad-9136-65a5e4e5abd8"
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
      >
        {isLoading ? "Running Pipeline..." : "Run Pipeline"}
      </button>
    </form>
  );
}

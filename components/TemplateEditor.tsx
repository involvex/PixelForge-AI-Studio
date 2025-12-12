import { FilePlus, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  builtInTemplates,
  deleteTemplate,
  getAllTemplates,
  type ProjectTemplate,
} from "../templates/templateManager.ts";

interface TemplateEditorProps {
  onSelect: (template: ProjectTemplate) => void;
  onCancel: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  onSelect,
  onCancel,
}) => {
  const [selectedId, setSelectedId] = useState<string>(builtInTemplates[0].id);
  const [, setUpdateTrigger] = useState(0); // Force re-render on delete

  const allTemplates = getAllTemplates();
  const customTemplates = allTemplates.filter(
    t => !builtInTemplates.some(b => b.id === t.id),
  );

  const selectedTemplate = allTemplates.find(t => t.id === selectedId);

  const handleSelect = () => {
    if (selectedTemplate) onSelect(selectedTemplate);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl w-[800px] h-[600px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-900">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FilePlus size={24} className="text-indigo-400" />
            New Project from Template
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* List */}
          <div className="w-1/3 border-r border-gray-700 bg-gray-850 overflow-y-auto p-2 space-y-1">
            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Built-in Templates
            </div>
            {builtInTemplates.map(t => (
              <button
                type="button"
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-all flex flex-col gap-1 ${
                  selectedId === t.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <div className="font-medium">{t.name}</div>
                <div
                  className={`text-xs ${selectedId === t.id ? "text-indigo-200" : "text-gray-500"}`}
                >
                  {t.width}x{t.height} • {t.colorSpace || "RGB"}
                </div>
              </button>
            ))}

            {/* Custom Templates Section */}
            {customTemplates.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mt-4">
                  Custom Templates
                </div>
                {customTemplates.map(t => (
                  <div key={t.id} className="flex w-full group/item">
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`flex-1 text-left px-3 py-3 rounded-l-lg text-sm transition-all flex flex-col gap-1 ${
                        selectedId === t.id
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <div className="font-medium">{t.name}</div>
                      <div
                        className={`text-xs ${selectedId === t.id ? "text-indigo-200" : "text-gray-500"}`}
                      >
                        {t.width}x{t.height} • {t.colorSpace || "RGB"}
                      </div>
                    </button>
                    <button
                      type="button"
                      title="Delete Template"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`Delete template "${t.name}"?`)) {
                          deleteTemplate(t.id);
                          if (selectedId === t.id)
                            setSelectedId(builtInTemplates[0].id);
                          setUpdateTrigger(prev => prev + 1);
                          // Force re-render (since allTemplates relies on module state, we might need to force update)
                          // But TemplateEditor calls getAllTemplates() in render body.
                          // React won't re-render unless state/props change.
                          // We need a local state trigger or just forceUpdate.
                          // A simple way is to toggle a dummy state or just set selectedId (which we did).
                          // But allTemplates var is calculated in render.
                        }
                      }}
                      className={`px-2 flex items-center justify-center rounded-r-lg border-l border-gray-700/50 hover:bg-red-900/50 text-gray-500 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-all ${selectedId === t.id ? "bg-indigo-600 border-indigo-500" : "bg-transparent"}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Details Panel */}
          <div className="flex-1 p-8 bg-gray-800 overflow-y-auto">
            {selectedTemplate ? (
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  {/* Preview Box */}
                  <div className="w-32 h-32 bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 shadow-inner">
                    <span className="text-2xl font-bold text-gray-400">
                      {selectedTemplate.width}
                    </span>
                    <span className="text-xs">width</span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-bold text-white">
                      {selectedTemplate.name}
                    </h3>
                    {selectedTemplate.comment && (
                      <p className="text-gray-400 text-sm">
                        {selectedTemplate.comment}
                      </p>
                    )}
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-700 rounded text-gray-300 border border-gray-600">
                        {selectedTemplate.width}x{selectedTemplate.height}px
                      </span>
                      <span className="px-2 py-1 bg-gray-700 rounded text-gray-300 border border-gray-600">
                        {selectedTemplate.colorSpace || "RGB"}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 rounded text-gray-300 border border-gray-600">
                        {selectedTemplate.bitDepth || 8}-bit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-gray-700">
                  <DetailItem
                    label="Dimensions"
                    value={`${selectedTemplate.width} x ${selectedTemplate.height} px`}
                  />
                  <DetailItem
                    label="Resolution"
                    value={`${selectedTemplate.resolutionX || 72} PPI`}
                  />
                  <DetailItem
                    label="Color Mode"
                    value={selectedTemplate.colorSpace || "RGB"}
                  />
                  <DetailItem
                    label="Bit Depth"
                    value={`${selectedTemplate.bitDepth || 8}-bit`}
                  />
                  <DetailItem
                    label="Background"
                    value={selectedTemplate.fillWith || "Transparent"}
                  />
                  <DetailItem
                    label="FPS"
                    value={
                      selectedTemplate.fps ? `${selectedTemplate.fps}` : "N/A"
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a template to view details
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-900 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSelect}
            className="px-6 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/30 font-semibold transition-all hover:scale-105 active:scale-95"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div>
    <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
      {label}
    </span>
    <span className="text-gray-200 font-mono text-sm">{value}</span>
  </div>
);

export default TemplateEditor;

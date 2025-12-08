import type React from "react";
import { useState } from "react";
import { X, Save } from "lucide-react";

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name, description);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in md:zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-gray-700 bg-gray-900 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Save size={18} className="text-indigo-400" />
            Save as Template
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label
              htmlFor="template-name"
              className="text-sm font-medium text-gray-300"
            >
              Template Name
            </label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Awesome Template"
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="space-y-3">
            <label
              htmlFor="template-description"
              className="text-sm font-medium text-gray-300"
            >
              Description (Optional)
            </label>
            <textarea
              id="template-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A brief description of this template..."
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-indigo-500 focus:outline-none h-24 resize-none"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-700 bg-gray-900 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTemplateModal;

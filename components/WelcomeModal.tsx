import { FilePlus, FolderOpen, X } from "lucide-react";
import type React from "react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  recentProjects: string[]; // Simplification for now
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onNewProject,
  onOpenProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[600px] overflow-hidden flex flex-col md:flex-row h-[400px] animate-in zoom-in-95 duration-200 z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center space-y-4 bg-gray-800/50">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              PixelForge
            </h1>
            <p className="text-gray-400 text-sm">AI-Powered Pixel Art Studio</p>
          </div>

          <button
            type="button"
            onClick={onNewProject}
            className="group flex items-center gap-4 p-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5"
          >
            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
              <FilePlus size={24} />
            </div>
            <div className="text-left">
              <div className="font-semibold">New Project</div>
              <div className="text-xs text-indigo-200">
                Start from scratch or template
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenProject}
            className="group flex items-center gap-4 p-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-all shadow-lg hover:shadow-gray-900/25 hover:-translate-y-0.5 border border-gray-600 hover:border-gray-500"
          >
            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
              <FolderOpen size={24} />
            </div>
            <div className="text-left">
              <div className="font-semibold">Open Project</div>
              <div className="text-xs text-gray-400">
                Load .json project file
              </div>
            </div>
          </button>
        </div>

        <div className="w-full md:w-1/2 bg-gray-900 p-8 flex flex-col">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
              Recent Projects
            </h3>
            <div className="text-center text-gray-600 py-10 italic text-sm">
              No recent projects found.
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-600">
              PixelForge AI Studio v0.1.0-alpha
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;

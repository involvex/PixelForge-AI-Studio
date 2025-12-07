import { Check, Globe, Pause, Play, Trash2, Upload, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { PluginInstance, pluginManager } from "../systems/PluginManager";
import { applyTheme, Theme, themes } from "../utils/themeUtils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  // Theme props
  currentThemeId: string;
  setCurrentThemeId: (id: string) => void;
  // General props (mocked for now)
  minimizeToTray: boolean;
  setMinimizeToTray: (val: boolean) => void;
  initialTab?: "general" | "themes" | "api" | "plugins" | "about" | "repo"; // Added initialTab
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  currentThemeId,
  setCurrentThemeId,
  minimizeToTray,
  setMinimizeToTray,
  initialTab = "general",
}) => {
  const [activeTab, setActiveTab] = useState<
    "general" | "themes" | "api" | "plugins" | "about" | "repo"
  >(initialTab);
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);

  // Update active tab when initialTab changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Update local state when prop changes
  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  // Load plugins on open
  useEffect(() => {
    if (isOpen) {
      setPlugins(pluginManager.getPlugins());
    }
  }, [isOpen]);

  const handleSaveApi = () => {
    setApiKey(localApiKey);
    alert("API Key Saved!");
  };

  const handleThemeSelect = (theme: Theme) => {
    applyTheme(theme);
    setCurrentThemeId(theme.id);
  };

  const handleInstallPlugin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const nameMatch = content.match(/\/\/ @name (.*)/);
      const name = nameMatch
        ? nameMatch[1].trim()
        : file.name.replace(/\.[^/.]+$/, "");

      const metadata = {
        id: Date.now().toString(),
        name: name,
        version: "1.0",
        description: "Installed plugin",
      };

      try {
        pluginManager.registerPlugin(metadata, content);
        setPlugins(pluginManager.getPlugins());
        alert(`Plugin ${name} installed!`);
      } catch (err) {
        alert("Failed to install plugin: " + err);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset
  };

  const togglePlugin = (plugin: PluginInstance) => {
    if (plugin.isActive) {
      pluginManager.disablePlugin(plugin.metadata.id);
    } else {
      pluginManager.enablePlugin(plugin.metadata.id);
    }
    setPlugins([...pluginManager.getPlugins()]); // Force update
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 w-[600px] h-[500px] rounded-lg shadow-2xl border border-gray-700 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-14 border-b border-gray-700 flex items-center justify-between px-6 bg-gray-900">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-40 bg-gray-850 border-r border-gray-700 flex flex-col p-2 gap-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`text-left px-3 py-2 rounded text-sm ${activeTab === "general" ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("themes")}
              className={`text-left px-3 py-2 rounded text-sm ${activeTab === "themes" ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
            >
              Themes
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`text-left px-3 py-2 rounded text-sm ${activeTab === "api" ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
            >
              API Configuration
            </button>
            <button
              onClick={() => setActiveTab("plugins")}
              className={`text-left px-3 py-2 rounded text-sm ${activeTab === "plugins" ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
            >
              Plugins
            </button>
            <div className="h-px bg-gray-700 my-1"></div>
            <button
              onClick={() => setActiveTab("repo")}
              className={`text-left px-3 py-2 rounded text-sm ${activeTab === "repo" ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
            >
              Repository
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`text-left px-3 py-2 rounded text-sm ${activeTab === "about" ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
            >
              About
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-gray-800">
            {activeTab === "general" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
                  App Behavior
                </h3>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center ${minimizeToTray ? "bg-indigo-600 border-indigo-600" : "border-gray-600 group-hover:border-gray-500"}`}
                  >
                    {minimizeToTray && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={minimizeToTray}
                    onChange={e => setMinimizeToTray(e.target.checked)}
                  />
                  <span className="text-gray-300 group-hover:text-white">
                    Minimize to Tray
                  </span>
                </label>
                <div className="text-xs text-gray-500 ml-8">
                  Keep the application running in the background when minimized.
                </div>
              </div>
            )}

            {activeTab === "themes" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
                  Editor Theme
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map(theme => (
                    <div
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme)}
                      className={`
                        p-3 rounded border cursor-pointer flex items-center justify-between
                        ${currentThemeId === theme.id ? "border-indigo-500 bg-indigo-900/20" : "border-gray-700 hover:border-gray-500 bg-gray-850"}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-600"
                          style={{
                            backgroundColor: theme.colors["--color-gray-950"],
                          }}
                        ></div>
                        <span className="text-sm font-medium text-gray-200">
                          {theme.name}
                        </span>
                      </div>
                      {currentThemeId === theme.id && (
                        <Check size={16} className="text-indigo-400" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Install Custom Theme
                  </h4>
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 cursor-pointer w-fit transition-colors">
                    <Upload size={16} />
                    <span>Import JSON Theme</span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={() =>
                        alert(
                          "Custom theme import logic to be implemented via file reader",
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
                  Gemini API
                </h3>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">API Key</label>
                  <input
                    type="password"
                    value={localApiKey}
                    onChange={e => setLocalApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white focus:border-indigo-500 focus:outline-none placeholder-gray-600 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Required for AI generation features. Your key is stored
                    locally.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveApi}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-sm transition-colors"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            )}

            {activeTab === "plugins" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
                  Plugin Manager
                </h3>

                <div className="flex justify-end mb-4">
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm text-white cursor-pointer transition-colors shadow-sm">
                    <Upload size={14} />
                    <span>Install Plugin (.js)</span>
                    <input
                      type="file"
                      accept=".js"
                      className="hidden"
                      onChange={handleInstallPlugin}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  {plugins.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-850/50 rounded border border-dashed border-gray-700">
                      <p>No plugins installed.</p>
                    </div>
                  ) : (
                    plugins.map(plugin => (
                      <div
                        key={plugin.metadata.id}
                        className="bg-gray-850 p-3 rounded border border-gray-700 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-medium text-sm text-gray-200">
                            {plugin.metadata.name}{" "}
                            <span className="text-xs text-gray-500">
                              v{plugin.metadata.version}
                            </span>
                          </h4>
                          <p className="text-xs text-gray-500">
                            {plugin.metadata.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => togglePlugin(plugin)}
                            className={`p-1.5 rounded transition-colors ${plugin.isActive ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}
                            title={plugin.isActive ? "Disable" : "Enable"}
                          >
                            {plugin.isActive ? (
                              <Pause size={14} />
                            ) : (
                              <Play size={14} />
                            )}
                          </button>
                          <button className="p-1.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "repo" && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
                  Repository & Docs
                </h3>

                <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 space-y-3">
                  <div className="flex items-center gap-3">
                    <Globe className="text-indigo-400" size={24} />
                    <div>
                      <h4 className="font-bold text-gray-200">
                        PixelForge AI Studio
                      </h4>
                      <p className="text-sm text-gray-400">
                        Official GitHub Repository
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Contribute code, report issues, or view the documentation.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <a
                      href="https://github.com/involvex/PixelForge-AI-Studio"
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-sm text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      View Code
                    </a>
                    <a
                      href="https://github.com/involvex/PixelForge-AI-Studio/issues"
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      Report Issue
                    </a>
                  </div>
                </div>

                <div className="bg-gray-850/50 p-4 rounded-lg border border-gray-700/50">
                  <h4 className="font-bold text-gray-300 mb-2">
                    Documentation
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    <li>Getting Started Guide</li>
                    <li>Plugin Development API</li>
                    <li>Keyboard Shortcuts</li>
                  </ul>
                  <button className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline">
                    View Full Documentation
                  </button>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-6 text-center">
                <div className="py-8 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-900/50">
                    <span className="font-pixel text-4xl text-white">P</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    PixelForge AI
                  </h2>
                  <p className="text-gray-400 text-sm">Studio Edition</p>
                </div>

                <div className="bg-gray-850 p-4 rounded-lg border border-gray-700 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Version</span>
                    <span className="text-gray-200 font-mono">0.0.1-alpha</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Build</span>
                    <span className="text-gray-200 font-mono">Dev</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Electron</span>
                    <span className="text-gray-200 font-mono">31.0.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Author</span>
                    <span className="text-gray-200">Involvex</span>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  &copy; 2025 Involvex. All rights reserved.
                  <br />
                  Made with ❤️ and 🤖.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

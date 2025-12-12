import {
  Dices,
  ImagePlus,
  ScanEye,
  Scissors,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  analyzeAsset,
  editAsset,
  generateAsset,
  searchInspiration,
} from "../services/geminiService.ts";
import { type AIChatMessage, AspectRatio, ImageSize } from "../types.ts";

interface AIPanelProps {
  onApplyImage: (base64: string) => void;
  currentCanvasImage: () => string; // Function to get current canvas as base64
}

const PIXEL_STYLES = [
  { id: "pixel art", label: "Default Pixel Art" },
  { id: "8-bit retro game", label: "8-Bit Retro" },
  { id: "16-bit snes style", label: "16-Bit SNES" },
  { id: "gameboy green screen", label: "Gameboy" },
  { id: "isometric pixel art", label: "Isometric" },
  { id: "flat pixel art", label: "Flat Design" },
  { id: "cyberpunk pixel art", label: "Cyberpunk" },
  { id: "dark fantasy pixel art", label: "Dark Fantasy" },
  { id: "cute chibi pixel art", label: "Cute Chibi" },
];

const AIPanel: React.FC<AIPanelProps> = ({
  onApplyImage,
  currentCanvasImage,
}) => {
  const [activeTab, setActiveTab] = useState<
    "generate" | "edit" | "search" | "analyze"
  >("generate");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // Generation Config
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    AspectRatio.SQUARE_1_1,
  );
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [selectedStyle, setSelectedStyle] = useState(PIXEL_STYLES[0].id);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState<string>("");

  // Editing Config
  const [editMode, setEditMode] = useState<
    "free" | "replace_obj" | "replace_bg" | "transform"
  >("free");
  const [editTarget, setEditTarget] = useState("");
  const [editReplacement, setEditReplacement] = useState("");

  // Chat/History State
  const [messages, setMessages] = useState<AIChatMessage[]>([]);

  // Handlers
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setMessages(prev => [
      ...prev,
      { role: "user", text: `Generate: ${prompt}` },
    ]);
    try {
      const seedNum = seed.trim() ? parseInt(seed, 10) : undefined;
      const image = await generateAsset(
        prompt,
        aspectRatio,
        imageSize,
        selectedStyle,
        negativePrompt,
        seedNum,
      );
      onApplyImage(image);
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: "Image generated and applied to canvas.",
          type: "success",
        },
      ]);
    } catch (e: unknown) {
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: `Error: ${(e as Error).message}`,
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    setLoading(true);

    let finalPrompt = prompt;
    let userDisplay = prompt;

    // Construct prompt based on mode
    if (editMode === "replace_obj") {
      if (!editTarget || !editReplacement) {
        setMessages(prev => [
          ...prev,
          {
            role: "model",
            text: "Please specify both the target object and the replacement.",
            type: "error",
          },
        ]);
        setLoading(false);
        return;
      }
      finalPrompt = `Replace the ${editTarget} with ${editReplacement}.`;
      userDisplay = `Replace ${editTarget} with ${editReplacement}`;
    } else if (editMode === "replace_bg") {
      if (!prompt.trim()) {
        setMessages(prev => [
          ...prev,
          {
            role: "model",
            text: "Please describe the new background.",
            type: "error",
          },
        ]);
        setLoading(false);
        return;
      }
      finalPrompt = `Replace the background with ${prompt}. Keep the foreground objects intact.`;
      userDisplay = `New Background: ${prompt}`;
    } else if (editMode === "transform") {
      if (!editTarget || !prompt.trim()) {
        setMessages(prev => [
          ...prev,
          {
            role: "model",
            text: "Please specify the object and the transformation description.",
            type: "error",
          },
        ]);
        setLoading(false);
        return;
      }
      finalPrompt = `Transform the ${editTarget}: ${prompt}.`;
      userDisplay = `Transform ${editTarget}: ${prompt}`;
    } else {
      if (!prompt.trim()) {
        setLoading(false);
        return;
      }
    }

    setMessages(prev => [
      ...prev,
      { role: "user", text: `Edit: ${userDisplay}` },
    ]);
    try {
      const currentImage = currentCanvasImage();
      const seedNum = seed.trim() ? parseInt(seed, 10) : undefined;
      const newImage = await editAsset(currentImage, finalPrompt, seedNum);
      onApplyImage(newImage);
      setMessages(prev => [
        ...prev,
        { role: "model", text: "Changes applied.", type: "success" },
      ]);
    } catch (e: unknown) {
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: `Error: ${(e as Error).message}`,
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBackground = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", text: `Remove Background` }]);
    try {
      const currentImage = currentCanvasImage();
      const newImage = await editAsset(
        currentImage,
        "Remove the background and make it transparent. Keep the main subject intact.",
      );
      onApplyImage(newImage);
      setMessages(prev => [
        ...prev,
        { role: "model", text: "Background removed.", type: "success" },
      ]);
    } catch (e: unknown) {
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: `Error: ${(e as Error).message}`,
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", text: `Search: ${prompt}` }]);
    try {
      const result = await searchInspiration(prompt);
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: result.text,
          groundingUrls: result.urls,
        },
      ]);
    } catch (e: unknown) {
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: `Error: ${(e as Error).message}`,
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setMessages(prev => [
      ...prev,
      { role: "user", text: `Analyze current artwork.` },
    ]);
    try {
      const currentImage = currentCanvasImage();
      const analysis = await analyzeAsset(currentImage, prompt); // Prompt is optional for analyze
      setMessages(prev => [...prev, { role: "model", text: analysis }]);
    } catch (e: unknown) {
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          text: `Error: ${(e as Error).message}`,
          type: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000).toString());
  };

  return (
    <div className="w-full bg-gray-900 border-l border-gray-750 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-750">
        <button
          type="button"
          onClick={() => setActiveTab("generate")}
          className={`flex-1 p-3 flex justify-center hover:bg-gray-800 ${activeTab === "generate" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400"}`}
          title="Generate"
        >
          <ImagePlus size={18} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={`flex-1 p-3 flex justify-center hover:bg-gray-800 ${activeTab === "edit" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400"}`}
          title="Magic Edit"
        >
          <Wand2 size={18} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`flex-1 p-3 flex justify-center hover:bg-gray-800 ${activeTab === "search" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400"}`}
          title="Search"
        >
          <Search size={18} />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("analyze")}
          className={`flex-1 p-3 flex justify-center hover:bg-gray-800 ${activeTab === "analyze" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400"}`}
          title="Analyze"
        >
          <ScanEye size={18} />
        </button>
      </div>

      {/* Content Area - Consolidated Scrolling */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Output Log */}
        <div className="space-y-3 mb-4 min-h-[100px]">
          {messages.length === 0 && (
            <p className="text-gray-500 text-sm text-center mt-10">
              Use Gemini to assist your workflow.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`text-sm rounded p-2 ${
                m.role === "user"
                  ? "bg-gray-800 ml-4"
                  : "bg-gray-800/50 mr-4 border border-gray-700"
              }`}
            >
              <p
                className={
                  m.type === "error"
                    ? "text-red-400"
                    : m.type === "success"
                      ? "text-green-400"
                      : "text-gray-200"
                }
              >
                {m.text}
              </p>
              {m.groundingUrls && m.groundingUrls.length > 0 && (
                <div className="mt-2 text-xs">
                  <p className="text-gray-400 mb-1">Sources:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {m.groundingUrls.map(url => (
                      <li key={url.uri}>
                        <a
                          href={url.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {url.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="text-indigo-400 text-sm animate-pulse">
              Gemini is thinking...
            </div>
          )}
        </div>

        {/* Controls inside scrollable area */}
        <div className="space-y-3 pt-4 border-t border-gray-750">
          {/* Generate Options */}
          {activeTab === "generate" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label htmlFor="ai-aspect-ratio" className="sr-only">
                  Aspect Ratio
                </label>
                <select
                  id="ai-aspect-ratio"
                  title="Aspect Ratio"
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value as AspectRatio)}
                  className="bg-gray-700 text-xs text-white p-2 rounded border border-gray-600 focus:border-indigo-500 outline-none"
                >
                  <option value={AspectRatio.SQUARE_1_1}>1:1</option>
                  <option value={AspectRatio.PORTRAIT_9_16}>9:16</option>
                  <option value={AspectRatio.LANDSCAPE_16_9}>16:9</option>
                </select>
                <label htmlFor="ai-image-size" className="sr-only">
                  Image Size
                </label>
                <select
                  id="ai-image-size"
                  title="Image Size"
                  value={imageSize}
                  onChange={e => setImageSize(e.target.value as ImageSize)}
                  className="bg-gray-700 text-xs text-white p-2 rounded border border-gray-600 focus:border-indigo-500 outline-none"
                >
                  <option value={ImageSize.SIZE_1K}>1K</option>
                  <option value={ImageSize.SIZE_2K}>2K</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="style-select"
                  className="text-xs text-gray-400 block mb-1"
                >
                  Style
                </label>
                <select
                  id="style-select"
                  title="Pixel Art Style"
                  value={selectedStyle}
                  onChange={e => setSelectedStyle(e.target.value)}
                  className="w-full bg-gray-700 text-xs text-white p-2 rounded border border-gray-600 focus:border-indigo-500 outline-none"
                >
                  {PIXEL_STYLES.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label
                    htmlFor="seed-input"
                    className="text-xs text-gray-400 block mb-1"
                  >
                    Seed (Optional)
                  </label>
                  <div className="flex gap-1">
                    <input
                      id="seed-input"
                      type="number"
                      value={seed}
                      onChange={e => setSeed(e.target.value)}
                      placeholder="Random"
                      className="w-full bg-gray-700 text-xs text-white p-2 rounded border border-gray-600 focus:border-indigo-500 outline-none"
                    />
                    <button
                      title="Randomize Seed"
                      type="button"
                      onClick={randomizeSeed}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 text-gray-400"
                    >
                      <Dices size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="negative-prompt-input"
                  className="text-xs text-gray-400 block mb-1"
                >
                  Negative Prompt
                </label>
                <input
                  id="negative-prompt-input"
                  type="text"
                  value={negativePrompt}
                  onChange={e => setNegativePrompt(e.target.value)}
                  placeholder="blurred, low quality, messy"
                  className="w-full bg-gray-700 text-xs text-white p-2 rounded border border-gray-600 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Edit Options */}
          {activeTab === "edit" && (
            <div className="space-y-3">
              <div className="flex bg-gray-700 rounded p-1">
                <button
                  type="button"
                  onClick={() => setEditMode("free")}
                  className={`flex-1 text-xs py-1.5 rounded ${editMode === "free" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-300"}`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode("replace_obj")}
                  className={`flex-1 text-xs py-1.5 rounded ${editMode === "replace_obj" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-300"}`}
                >
                  Object
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode("replace_bg")}
                  className={`flex-1 text-xs py-1.5 rounded ${editMode === "replace_bg" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-300"}`}
                >
                  Bg
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode("transform")}
                  className={`flex-1 text-xs py-1.5 rounded ${editMode === "transform" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-300"}`}
                >
                  Trans
                </button>
              </div>

              {editMode === "replace_obj" && (
                <div className="grid grid-cols-2 gap-2">
                  <label htmlFor="edit-target" className="sr-only">
                    Target Object
                  </label>
                  <input
                    id="edit-target"
                    type="text"
                    placeholder="Target (e.g. Cat)"
                    value={editTarget}
                    onChange={e => setEditTarget(e.target.value)}
                    className="bg-gray-700 text-xs text-white p-2 rounded border border-gray-600 outline-none"
                  />
                  <label htmlFor="edit-replacement" className="sr-only">
                    Replacement
                  </label>
                  <input
                    id="edit-replacement"
                    type="text"
                    placeholder="Replace with (e.g. Dog)"
                    value={editReplacement}
                    onChange={e => setEditReplacement(e.target.value)}
                    className="bg-gray-700 text-xs text-white p-2 rounded border border-gray-600 outline-none"
                  />
                </div>
              )}

              {editMode === "transform" && (
                <div>
                  <input
                    id="edit-transform-object"
                    type="text"
                    placeholder="Object to transform (e.g. The sword)"
                    value={editTarget}
                    onChange={e => setEditTarget(e.target.value)}
                    className="w-full bg-gray-700 text-xs text-white p-2 rounded border border-gray-600 outline-none mb-1"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleRemoveBackground}
                disabled={loading}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-xs flex items-center justify-center gap-2 border border-gray-600"
              >
                <Scissors size={14} /> Remove Background
              </button>
            </div>
          )}

          {/* Prompt Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="ai-prompt" className="sr-only">
              AI Prompt
            </label>
            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={
                activeTab === "generate"
                  ? "A cute 8-bit dragon..."
                  : activeTab === "edit"
                    ? editMode === "free"
                      ? "Change color to blue..."
                      : editMode === "replace_bg"
                        ? "A spooky forest..."
                        : editMode === "transform"
                          ? "Make it glow..."
                          : "Context for edit..."
                    : activeTab === "search"
                      ? "What do dungeon tiles look like?"
                      : "Optional context for analysis..."
              }
              className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-indigo-500 outline-none resize-none h-20 text-sm"
            />
            <button
              onClick={
                activeTab === "generate"
                  ? handleGenerate
                  : activeTab === "edit"
                    ? handleEdit
                    : activeTab === "search"
                      ? handleSearch
                      : handleAnalyze
              }
              disabled={loading}
              type="button"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={16} />
              {activeTab === "generate"
                ? "Generate Asset"
                : activeTab === "edit"
                  ? "Magic Edit"
                  : activeTab === "search"
                    ? "Search"
                    : "Analyze"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;

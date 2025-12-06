import React, { useState } from 'react';
import { Sparkles, MessageSquare, ImagePlus, Search, ScanEye, Wand2, Scissors } from 'lucide-react';
import { generateAsset, editAsset, searchInspiration, analyzeAsset } from '../services/geminiService';
import { AspectRatio, ImageSize, AIChatMessage } from '../types';

interface AIPanelProps {
  onApplyImage: (base64: string) => void;
  currentCanvasImage: () => string; // Function to get current canvas as base64
}

const AIPanel: React.FC<AIPanelProps> = ({ onApplyImage, currentCanvasImage }) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'search' | 'analyze'>('generate');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Generation Config
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE_1_1);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.SIZE_1K);

  // Chat/History State
  const [messages, setMessages] = useState<AIChatMessage[]>([]);

  // Handlers
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: `Generate: ${prompt}` }]);
    try {
      const image = await generateAsset(prompt, aspectRatio, imageSize);
      onApplyImage(image);
      setMessages(prev => [...prev, { role: 'model', text: 'Image generated and applied to canvas.', type: 'success' }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${e.message}`, type: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: `Edit: ${prompt}` }]);
    try {
      const currentImage = currentCanvasImage();
      const newImage = await editAsset(currentImage, prompt);
      onApplyImage(newImage);
      setMessages(prev => [...prev, { role: 'model', text: 'Changes applied.', type: 'success' }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${e.message}`, type: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBackground = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: `Remove Background` }]);
    try {
        const currentImage = currentCanvasImage();
        const newImage = await editAsset(currentImage, "Remove the background and make it transparent. Keep the main subject intact.");
        onApplyImage(newImage);
        setMessages(prev => [...prev, { role: 'model', text: 'Background removed.', type: 'success' }]);
    } catch (e: any) {
        setMessages(prev => [...prev, { role: 'model', text: `Error: ${e.message}`, type: 'error' }]);
    } finally {
        setLoading(false);
    }
  }

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: `Search: ${prompt}` }]);
    try {
      const result = await searchInspiration(prompt);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: result.text, 
        groundingUrls: result.urls 
      }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${e.message}`, type: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: `Analyze current artwork.` }]);
    try {
      const currentImage = currentCanvasImage();
      const analysis = await analyzeAsset(currentImage, prompt); // Prompt is optional for analyze
      setMessages(prev => [...prev, { role: 'model', text: analysis }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${e.message}`, type: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-750 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-750">
        <button onClick={() => setActiveTab('generate')} className={`flex-1 p-3 flex justify-center hover:bg-gray-800 ${activeTab === 'generate' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`} title="Generate"><ImagePlus size={18} /></button>
        <button onClick={() => setActiveTab('edit')} className={`flex-1 p-3 flex justify-center hover:bg-gray-800 ${activeTab === 'edit' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`} title="Magic Edit"><Wand2 size={18} /></button>
        <button onClick={() => setActiveTab('search')} className={`flex-1 p-3 flex justify-center hover:bg-gray-800 ${activeTab === 'search' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`} title="Search"><Search size={18} /></button>
        <button onClick={() => setActiveTab('analyze')} className={`flex-1 p-3 flex justify-center hover:bg-gray-800 ${activeTab === 'analyze' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400'}`} title="Analyze"><ScanEye size={18} /></button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Output Log */}
        <div className="space-y-3 mb-4 min-h-[100px]">
           {messages.length === 0 && <p className="text-gray-500 text-sm text-center mt-10">Use Gemini to assist your workflow.</p>}
           {messages.map((m, i) => (
             <div key={i} className={`text-sm rounded p-2 ${m.role === 'user' ? 'bg-gray-800 ml-4' : 'bg-gray-800/50 mr-4 border border-gray-700'}`}>
               <p className={m.type === 'error' ? 'text-red-400' : m.type === 'success' ? 'text-green-400' : 'text-gray-200'}>
                 {m.text}
               </p>
               {m.groundingUrls && m.groundingUrls.length > 0 && (
                 <div className="mt-2 text-xs">
                   <p className="text-gray-400 mb-1">Sources:</p>
                   <ul className="list-disc pl-4 space-y-1">
                     {m.groundingUrls.map((url, idx) => (
                       <li key={idx}>
                         <a href={url.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{url.title}</a>
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
             </div>
           ))}
           {loading && <div className="text-indigo-400 text-sm animate-pulse">Gemini is thinking...</div>}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-850 border-t border-gray-750">
        
        {activeTab === 'generate' && (
          <div className="space-y-3 mb-3">
             <div className="grid grid-cols-2 gap-2">
                <select 
                  value={aspectRatio} 
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="bg-gray-700 text-xs text-white p-2 rounded border border-gray-600 focus:border-indigo-500 outline-none"
                >
                  <option value={AspectRatio.SQUARE_1_1}>1:1 (Square)</option>
                  <option value={AspectRatio.PORTRAIT_9_16}>9:16 (Mobile)</option>
                  <option value={AspectRatio.LANDSCAPE_16_9}>16:9 (Desktop)</option>
                  <option value={AspectRatio.PORTRAIT_3_4}>3:4 (Portrait)</option>
                  <option value={AspectRatio.LANDSCAPE_4_3}>4:3 (Landscape)</option>
                </select>
                <select 
                  value={imageSize} 
                  onChange={(e) => setImageSize(e.target.value as ImageSize)}
                  className="bg-gray-700 text-xs text-white p-2 rounded border border-gray-600 focus:border-indigo-500 outline-none"
                >
                  <option value={ImageSize.SIZE_1K}>1K Standard</option>
                  <option value={ImageSize.SIZE_2K}>2K High Res</option>
                  <option value={ImageSize.SIZE_4K}>4K Ultra</option>
                </select>
             </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex flex-col gap-2">
           {activeTab === 'edit' && (
               <button 
                  onClick={handleRemoveBackground}
                  disabled={loading}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-xs flex items-center justify-center gap-2 border border-gray-600 mb-2"
               >
                 <Scissors size={14} /> Remove Background
               </button>
           )}

           <textarea 
             value={prompt}
             onChange={(e) => setPrompt(e.target.value)}
             placeholder={
                activeTab === 'generate' ? "A cute 8-bit dragon..." :
                activeTab === 'edit' ? "Change background to lava..." :
                activeTab === 'search' ? "What do dungeon tiles look like?" :
                "Optional context for analysis..."
             }
             className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-indigo-500 outline-none resize-none h-20 text-sm"
           />
           <button
             onClick={
               activeTab === 'generate' ? handleGenerate :
               activeTab === 'edit' ? handleEdit :
               activeTab === 'search' ? handleSearch :
               handleAnalyze
             }
             disabled={loading}
             className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
           >
             <Sparkles size={16} />
             {activeTab === 'generate' ? 'Generate Asset' : activeTab === 'edit' ? 'Magic Edit' : activeTab === 'search' ? 'Search' : 'Analyze'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
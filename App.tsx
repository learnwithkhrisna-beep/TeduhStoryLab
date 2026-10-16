
import React, { useState, useRef, useCallback } from 'react';
import { 
  Clapperboard, Wand2, RefreshCw, AlertCircle, Play, Pause, Download, 
  ImageIcon, Layers, Smartphone, Monitor, Mic, Trash2, ImagePlus, Check,
  FileText, Archive, FileAudio, Users, Focus, Globe, Pencil, Save, Video,
  Search, Info, Key, ExternalLink, Moon, LogOut
} from 'lucide-react';
import { Scene, VisualStyle, AspectRatio, VoiceName } from './types';
import * as geminiService from './services/geminiService';
import SceneCard from './components/SceneCard';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  const [story, setStory] = useState("");
  const [style, setStyle] = useState<VisualStyle>("claymation");
  const [ratio, setRatio] = useState<AspectRatio>("16:9");
  const [sceneCount, setSceneCount] = useState(3);
  const [voice, setVoice] = useState<VoiceName>("Fenrir");
  const [language, setLanguage] = useState("id");
  const [characterMode, setCharacterMode] = useState<'with_char' | 'no_char'>("no_char");
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [characterAnchor, setCharacterAnchor] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('teduh_auth_user');
  });

  const handleLogout = () => {
    localStorage.removeItem('teduh_auth_user');
    localStorage.removeItem('teduh_auth_timestamp');
    setCurrentUser(null);
  };

  const handleQuotaError = (err: any) => {
    const errorMsg = err?.message?.toLowerCase() || "";
    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit")) {
      setIsQuotaExceeded(true);
      setError("Kuota gratis habis. Coba lagi besok atau gunakan akun lain.");
    } else {
      setError(err.message || "Terjadi kesalahan yang tidak terduga.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setUploadedImage(reader.result as string);
      setIsAnalyzingImage(true);
      try {
        const description = await geminiService.analyzeCharacterImage(base64, file.type);
        setCharacterAnchor(description);
      } catch (err) {
        handleQuotaError(err);
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setCharacterAnchor("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateFullFilm = async () => {
    if (!story.trim()) return;
    setIsProcessing(true);
    setError(null);
    setIsQuotaExceeded(false);
    setScenes([]);
    setStatusMessage("Planning storyboard...");

    try {
      const storyboard = await geminiService.generateStoryboard(
        story, 
        sceneCount, 
        style, 
        language, 
        characterMode === 'with_char' ? characterAnchor : "",
        characterMode,
        ratio
      );

      const finalAnchor = characterMode === 'with_char' ? (storyboard.characterAnchor || characterAnchor) : "";
      if (characterMode === 'with_char') setCharacterAnchor(finalAnchor);

      const initialScenes = storyboard.scenes.map((s: any) => ({
        ...s,
        status: 'pending' as const
      }));
      setScenes(initialScenes);

      for (let i = 0; i < initialScenes.length; i++) {
        const scene = initialScenes[i];
        setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: 'generating' } : s));
        setStatusMessage(`Generating assets for Scene ${scene.id}...`);

        const [img1, img2, audio] = await Promise.all([
          geminiService.generateImage(scene.visualPrompt1, finalAnchor, style, ratio),
          geminiService.generateImage(scene.visualPrompt2, finalAnchor, style, ratio),
          geminiService.generateAudio(scene.script, voice)
        ]);

        setScenes(prev => prev.map(s => s.id === scene.id ? { 
          ...s, 
          status: 'complete',
          imageUrl1: img1,
          imageUrl2: img2,
          audioUrl: audio || undefined
        } : s));
      }

      setStatusMessage("Project Completed!");
    } catch (err: any) {
      handleQuotaError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const regenerateSceneImage = async (sceneId: number, prompt: string, index: number) => {
    const loadingKey = index === 1 ? 'isImage1Regenerating' : 'isImage2Regenerating';
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, [loadingKey]: true } : s));

    try {
      const finalAnchor = characterMode === 'with_char' ? characterAnchor : "";
      const url = await geminiService.generateImage(prompt, finalAnchor, style, ratio);
      setScenes(prev => prev.map(s => s.id === sceneId ? {
        ...s,
        [index === 1 ? 'imageUrl1' : 'imageUrl2']: url,
        [loadingKey]: false
      } : s));
    } catch (err) {
      handleQuotaError(err);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, [loadingKey]: false } : s));
    }
  };

  const regenerateSceneAudio = async (sceneId: number, script: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isAudioRegenerating: true } : s));
    try {
      const url = await geminiService.generateAudio(script, voice);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, audioUrl: url || undefined, isAudioRegenerating: false } : s));
    } catch (err) {
      handleQuotaError(err);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isAudioRegenerating: false } : s));
    }
  };

  const downloadAllPrompts = () => {
    let content = `TeduhCeritaAI Project: ${story}\n`;
    content += `Mode: ${characterMode === 'with_char' ? 'With Character' : 'Dynamic/Random'}\n`;
    content += `Style: ${style} | Ratio: ${ratio} | Voice: ${voice}\n`;
    if (characterMode === 'with_char') content += `Character Anchor: ${characterAnchor}\n`;
    content += `=================================================\n\n`;
    
    scenes.forEach(s => {
      content += `[SCENE ${s.id}]\n`;
      content += `Script: ${s.script}\n\n`;
      
      content += `SHOT A:\n`;
      content += `- Image Prompt: ${s.visualPrompt1}\n`;
      content += `- Video Motion Prompt: ${s.videoPrompt1}\n\n`;
      
      content += `SHOT B:\n`;
      content += `- Image Prompt: ${s.visualPrompt2}\n`;
      content += `- Video Motion Prompt: ${s.videoPrompt2}\n`;
      content += `-------------------------------------------------\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsZip = async (type: 'image' | 'audio') => {
    setIsZipping(true);
    try {
      // @ts-ignore
      const zip = new window.JSZip();
      const folder = zip.folder(type === 'image' ? 'Images' : 'Audio');
      
      for (const scene of scenes) {
        if (type === 'image') {
          if (scene.imageUrl1) {
            const data1 = scene.imageUrl1.split(',')[1];
            folder.file(`scene-${scene.id}-a.png`, data1, { base64: true });
          }
          if (scene.imageUrl2) {
            const data2 = scene.imageUrl2.split(',')[1];
            folder.file(`scene-${scene.id}-b.png`, data2, { base64: true });
          }
        } else if (type === 'audio' && scene.audioUrl) {
          const res = await fetch(scene.audioUrl);
          const blob = await res.blob();
          folder.file(`scene-${scene.id}.wav`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teduhcerita-${type}-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Zip creation failed");
    } finally {
      setIsZipping(false);
    }
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-teal-500/20 border border-teal-500/40 bg-slate-900 flex items-center justify-center shrink-0">
              <img 
                src="/logo.jpg" 
                alt="Logo TeduhCeritaAI" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <h1 className="font-bold text-xl text-white tracking-tight flex items-center gap-1.5">
                TeduhCerita<span className="text-teal-400">AI</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Generative Storyboard Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Gemini Multi-Modal Engine Active
             </div>

             <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  <span className="font-medium text-slate-200">{currentUser}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 bg-slate-800/60 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-red-500/30 transition-all font-medium"
                  title="Keluar dari sesi studio"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid lg:grid-cols-12 gap-8">
        {/* Sidebar Configuration */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quota Alert Banner */}
          {isQuotaExceeded && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-3 items-start">
                <Moon className="text-red-400 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide">Akses Terbatas</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Kuota gratis habis. Coba lagi besok atau gunakan akun lain.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Wand2 className="text-emerald-500" size={18} />
              Film Configuration
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Story Idea / Topic</label>
                <textarea 
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none placeholder-slate-600 transition-all text-sm leading-relaxed"
                  placeholder="e.g. A young student in Jakarta wearing a trendy hoodie, or a series of landscapes showing the beauty of a modern mosque at sunset..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Production Mode</label>
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button 
                    onClick={() => setCharacterMode('with_char')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold transition-all ${characterMode === 'with_char' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Users size={14} /> Karakter Utama
                  </button>
                  <button 
                    onClick={() => setCharacterMode('no_char')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold transition-all ${characterMode === 'no_char' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Layers size={14} /> Tanpa Karakter
                  </button>
                </div>
              </div>

              {characterMode === 'with_char' && (
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Focus size={14} /> Character Anchor
                    </label>
                    {uploadedImage && (
                      <button onClick={clearUploadedImage} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 uppercase font-bold">
                        <Trash2 size={10} /> Reset
                      </button>
                    )}
                  </div>

                  {!uploadedImage ? (
                    <div className="relative group">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl group-hover:border-emerald-500/50 group-hover:bg-slate-800 transition-all text-center">
                        {isAnalyzingImage ? (
                          <RefreshCw className="animate-spin text-emerald-500 mb-2" size={24} />
                        ) : (
                          <ImagePlus className="text-slate-500 group-hover:text-emerald-500 mb-2" size={24} />
                        )}
                        <span className="text-xs font-medium text-slate-400">
                          {isAnalyzingImage ? "AI Analyzing Character..." : "Upload Foto Karakter (Opsional)"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                      <img src={uploadedImage} alt="ref" className="w-12 h-12 rounded object-cover border border-slate-700" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1 flex items-center gap-1">
                          <Check size={10} /> Karakter Terkunci
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 italic leading-tight">
                          {characterAnchor}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visual Style</label>
                  <select 
                    value={style}
                    onChange={(e) => setStyle(e.target.value as VisualStyle)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="claymation">Claymation (Modern)</option>
                    <option value="realistic_clay">Fine Art Clay</option>
                    <option value="lego">Lego World</option>
                    <option value="cinematic">Cinematic 8K</option>
                    <option value="anime">Anime (Digital)</option>
                    <option value="watercolor">Watercolor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aspect Ratio</label>
                  <select 
                    value={ratio}
                    onChange={(e) => setRatio(e.target.value as AspectRatio)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="1:1">1:1 Square</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none"
                  >
                    <option value="id">Indonesian</option>
                    <option value="en">English</option>
                    <option value="ms">Malay</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Voice Tone</label>
                  <select 
                    value={voice}
                    onChange={(e) => setVoice(e.target.value as VoiceName)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm outline-none"
                  >
                    <option value="Fenrir">Ustadz (Deep)</option>
                    <option value="Kore">Sister (Soft)</option>
                    <option value="Puck">Young (Energetic)</option>
                    <option value="Aoede">Child (Cheerful)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Number of Scenes</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button 
                      key={n}
                      onClick={() => setSceneCount(n)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${sceneCount === n ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={generateFullFilm}
                disabled={isProcessing || !story.trim() || isAnalyzingImage}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all
                  ${isProcessing ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}
                `}
              >
                {isProcessing ? (
                  <><RefreshCw className="animate-spin" size={18} /> {statusMessage}</>
                ) : (
                  <><Wand2 size={18} /> Generate Film Assets</>
                )}
              </button>

              {error && !isQuotaExceeded && (
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-400 text-xs flex items-start gap-3">
                  <AlertCircle className="shrink-0 mt-0.5" size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-500 leading-relaxed flex gap-3">
             <Info className="shrink-0 text-slate-400" size={16} />
             <p>Mode <strong>Karakter Utama</strong> menjaga konsistensi tokoh. Mode <strong>Tanpa Karakter</strong> cocok untuk landscape, objek, atau variasi cinematic.</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          {scenes.length === 0 && !isProcessing ? (
            <div className="h-[600px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center p-12 bg-slate-900/20">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                <Video size={32} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-300">Start Your Production</h3>
              <p className="max-w-xs mx-auto mt-2 text-slate-500 text-sm">
                Define your story in the left panel and click Generate. AI will visualize, script, and narrate your entire short film.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">Project Timeline</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {isProcessing ? `Production in progress...` : `Assets fully generated for ${scenes.length} scenes.`}
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  <button 
                    onClick={downloadAllPrompts}
                    disabled={isProcessing}
                    className="flex-none flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    <FileText size={14} /> Prompts (TXT)
                  </button>
                  <button 
                    onClick={() => downloadAsZip('image')}
                    disabled={isProcessing || isZipping}
                    className="flex-none flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {isZipping ? <RefreshCw className="animate-spin" size={14} /> : <Archive size={14} />}
                    Images (ZIP)
                  </button>
                  <button 
                    onClick={() => downloadAsZip('audio')}
                    disabled={isProcessing || isZipping}
                    className="flex-none flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {isZipping ? <RefreshCw className="animate-spin" size={14} /> : <FileAudio size={14} />}
                    Audio (ZIP)
                  </button>
                </div>
              </div>

              <div className="space-y-12 pb-20">
                {scenes.map((scene, idx) => (
                  <SceneCard 
                    key={scene.id}
                    scene={scene}
                    index={idx + 1}
                    ratio={ratio}
                    onRegenerateImage={(imgIdx) => regenerateSceneImage(scene.id, imgIdx === 1 ? scene.visualPrompt1 : scene.visualPrompt2, imgIdx)}
                    onRegenerateAudio={() => regenerateSceneAudio(scene.id, scene.script)}
                    onUpdateScript={(text) => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, script: text } : s))}
                  />
                ))}
                
                {isProcessing && scenes.length < sceneCount && (
                  <div className="p-8 border-2 border-dashed border-slate-800 rounded-3xl animate-pulse flex flex-col items-center justify-center bg-slate-900/30">
                    <RefreshCw className="animate-spin text-slate-700 mb-4" size={32} />
                    <p className="text-slate-600 text-sm font-medium italic">Gemini is sketching your next scenes...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;


import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, RefreshCw, Download, Pencil, Save, Copy, Check, Video, Wand2, Info, Film
} from 'lucide-react';
import { Scene, AspectRatio } from '../types';

interface SceneCardProps {
  scene: Scene;
  index: number;
  ratio: AspectRatio;
  onRegenerateImage: (idx: number) => void;
  onRegenerateAudio: () => void;
  onUpdateScript: (text: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ 
  scene, index, ratio, onRegenerateImage, onRegenerateAudio, onUpdateScript 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localScript, setLocalScript] = useState(scene.script);
  const audioRef = useRef<HTMLAudioElement>(null);

  const ratioClasses: Record<AspectRatio, string> = {
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16] max-w-[280px]',
    '1:1': 'aspect-square max-w-[400px]'
  };

  useEffect(() => {
    if (!isEditing) setLocalScript(scene.script);
  }, [scene.script, isEditing]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const saveScript = () => {
    onUpdateScript(localScript);
    setIsEditing(false);
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderImage = (imgUrl: string | undefined, isRegen: boolean | undefined, idx: number, prompt: string, videoPrompt: string) => {
    return (
      <div className="flex-1 space-y-4">
        <div className={`relative group overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 ${ratioClasses[ratio]} shadow-lg`}>
          <div className="absolute top-3 left-3 z-20 flex gap-2">
            <span className="bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] text-white font-mono border border-white/10">
              SHOT {idx === 1 ? 'A' : 'B'}
            </span>
          </div>

          <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-2">
            <button 
              onClick={() => onRegenerateImage(idx)}
              disabled={isRegen}
              className="p-2 bg-black/80 text-white rounded-full hover:bg-emerald-600 transition-all border border-white/20"
            >
              <RefreshCw size={14} className={isRegen ? 'animate-spin' : ''} />
            </button>
            {imgUrl && (
              <a href={imgUrl} download={`scene-${scene.id}-${idx}.png`} className="p-2 bg-black/80 text-white rounded-full hover:bg-blue-600 transition-all border border-white/20">
                <Download size={14} />
              </a>
            )}
          </div>

          {isRegen || scene.status === 'generating' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest animate-pulse">Rendering...</span>
            </div>
          ) : imgUrl ? (
            <img src={imgUrl} alt={`Scene ${scene.id}`} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
              <RefreshCw size={24} className="mb-2 opacity-20" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Pending</span>
            </div>
          )}
        </div>

        {/* Prompts Section */}
        <div className="grid gap-3">
          {/* Image Prompt */}
          <div className="space-y-1.5">
             <div className="flex justify-between items-center">
               <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                 <Wand2 size={10} className="text-emerald-500" /> Image Prompt
               </label>
               <button onClick={() => copyPrompt(prompt)} className="text-[10px] text-slate-500 hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors">
                 <Copy size={10} /> Copy
               </button>
             </div>
             <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 line-clamp-2 hover:line-clamp-none transition-all font-mono leading-relaxed italic border-l-2 border-l-emerald-500/50">
               {prompt}
             </div>
          </div>

          {/* Video Prompt */}
          <div className="space-y-1.5">
             <div className="flex justify-between items-center">
               <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                 <Film size={10} className="text-blue-500" /> Video Motion Prompt
               </label>
               <button onClick={() => copyPrompt(videoPrompt)} className="text-[10px] text-slate-500 hover:text-blue-400 font-bold flex items-center gap-1 transition-colors">
                 <Copy size={10} /> Copy
               </button>
             </div>
             <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 line-clamp-2 hover:line-clamp-none transition-all font-mono leading-relaxed italic border-l-2 border-l-blue-500/50">
               {videoPrompt}
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition-all relative">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/10">
              Scene {index}
            </span>
            <div className="flex items-center gap-2 bg-slate-800/80 rounded-full p-1 pr-4 border border-slate-700">
              <button 
                onClick={toggleAudio}
                disabled={!scene.audioUrl}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${scene.audioUrl ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <button 
                onClick={onRegenerateAudio}
                disabled={scene.isAudioRegenerating}
                className="text-slate-400 hover:text-white transition-all"
                title="Regenerate Voice"
              >
                <RefreshCw size={14} className={scene.isAudioRegenerating ? 'animate-spin' : ''} />
              </button>
              {scene.audioUrl && (
                <a href={scene.audioUrl} download={`voice-${scene.id}.wav`} className="text-slate-400 hover:text-white transition-all ml-1">
                  <Download size={14} />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button onClick={saveScript} className="text-emerald-500 hover:text-emerald-400 text-xs font-bold flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <Save size={14} /> Save Script
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white text-xs font-bold flex items-center gap-1 transition-all">
                <Pencil size={14} /> Edit Script
              </button>
            )}
          </div>
        </div>

        {/* Script Block */}
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/50 relative">
          <div className="absolute -top-2 left-4 px-2 bg-slate-950 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Narrator Script</div>
          {isEditing ? (
            <textarea 
              value={localScript}
              onChange={(e) => setLocalScript(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-slate-200 text-base leading-relaxed italic resize-none p-0"
              rows={2}
              autoFocus
            />
          ) : (
            <p className="text-slate-300 text-base leading-relaxed italic">
              "{scene.script || "Script pending generation..."}"
            </p>
          )}
        </div>

        {/* Visuals Container */}
        <div className="flex flex-col lg:flex-row gap-8">
          {renderImage(scene.imageUrl1, scene.isImage1Regenerating, 1, scene.visualPrompt1, scene.videoPrompt1)}
          {renderImage(scene.imageUrl2, scene.isImage2Regenerating, 2, scene.visualPrompt2, scene.videoPrompt2)}
        </div>
      </div>

      <audio ref={audioRef} src={scene.audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
};

export default SceneCard;

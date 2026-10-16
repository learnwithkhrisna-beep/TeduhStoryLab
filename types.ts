
export interface Scene {
  id: number;
  script: string;
  visualPrompt1: string;
  videoPrompt1: string;
  visualPrompt2: string;
  videoPrompt2: string;
  imageUrl1?: string;
  imageUrl2?: string;
  audioUrl?: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  isImage1Regenerating?: boolean;
  isImage2Regenerating?: boolean;
  isAudioRegenerating?: boolean;
  isVisualPrompt1Regenerating?: boolean;
  isVisualPrompt2Regenerating?: boolean;
  isVideoPrompt1Regenerating?: boolean;
  isVideoPrompt2Regenerating?: boolean;
}

export interface StoryboardData {
  characterAnchor: string;
  scenes: Scene[];
}

export type VisualStyle = 'claymation' | 'realistic_clay' | 'lego' | 'cinematic' | 'anime' | 'islamic_art' | 'paper_cutout' | 'watercolor';
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type VoiceName = 'Fenrir' | 'Puck' | 'Kore' | 'Aoede' | 'Zephyr';

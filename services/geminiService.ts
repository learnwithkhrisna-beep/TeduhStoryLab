
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { pcmToWav } from "../utils/audioUtils";
import { VisualStyle, AspectRatio, VoiceName } from "../types";

// We initialize inside functions to ensure the most up-to-date API key is used
// as per the platform's requirements for dynamic key selection.

export const analyzeCharacterImage = async (base64Image: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: {
      parts: [
        { text: "Analyze this character image in extreme detail. Describe: Age, modern clothing style, specific facial features, hair, and accessories. Focus on making the description suitable for a high-quality consistent image generation prompt. Output a single dense paragraph." },
        { inlineData: { data: base64Image, mimeType } }
      ]
    }
  });
  return response.text || "";
};

export const generateStoryboard = async (
  story: string, 
  sceneCount: number, 
  style: VisualStyle, 
  language: string, 
  manualAnchor: string,
  mode: 'with_char' | 'no_char',
  aspectRatio: AspectRatio
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: `Act as a professional film director and visual designer. Break down this story into exactly ${sceneCount} distinct scenes.
    INPUTS: Story: "${story}", Style: "${style}", Language: "${language}", Aspect Ratio: "${aspectRatio}".
    
    PRODUCTION MODE: ${mode === 'with_char' ? 'Consistency (Single Character Focus)' : 'Dynamic (Focus on atmosphere and varied subjects)'}.
    
    ${mode === 'with_char' 
      ? `CRITICAL: You MUST establish a consistent 'characterAnchor'. ${manualAnchor ? `Use this: "${manualAnchor}"` : 'Design a modern, dynamic character description.'}` 
      : `CRITICAL: There is NO main character. Focus each scene description on unique environments, varied objects, or different people to keep the visuals random and interesting.`}
    
    For each scene, provide a script and two visual prompts.
    
    GUIDELINES FOR VISUAL PROMPTS:
    - Each visualPrompt MUST be a COMPLETE, STANDALONE, and EXTREMELY DETAILED image generation prompt.
    - It MUST incorporate the visual style ("${style}") and the character description (if in consistency mode: "${manualAnchor || 'the main character'}").
    - Describe specific lighting (e.g., "volumetric lighting", "soft studio glow"), camera settings (e.g., "depth of field", "wide-angle lens"), textures, and intricate environmental details.
    - At the end of EVERY visualPrompt, you MUST append the aspect ratio parameter: "--ar ${aspectRatio}".
    - Ensure the prompts are in English for maximum compatibility with professional image generators like Midjourney or Flux.
    
    Output ONLY a JSON object: { "characterAnchor": "string", "scenes": [{ "id": number, "script": "string", "visualPrompt1": "string", "videoPrompt1": "string", "visualPrompt2": "string", "videoPrompt2": "string" }] }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          characterAnchor: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                script: { type: Type.STRING },
                visualPrompt1: { type: Type.STRING },
                videoPrompt1: { type: Type.STRING },
                visualPrompt2: { type: Type.STRING },
                videoPrompt2: { type: Type.STRING }
              },
              required: ["id", "script", "visualPrompt1", "videoPrompt1", "visualPrompt2", "videoPrompt2"]
            }
          }
        },
        required: ["characterAnchor", "scenes"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateImage = async (
  prompt: string, 
  anchor: string, 
  style: VisualStyle, 
  aspectRatio: AspectRatio
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const stylePrefixes: Record<VisualStyle, string> = {
    claymation: "Professional 3D claymation, high-quality stop-motion animation, handcrafted plasticine textures, vibrant colors, clean studio lighting, 8k render",
    realistic_clay: "Hyper-realistic fine art clay sculpture, intricate handmade details, realistic skin textures, cinematic lighting, museum-quality diorama, 8k resolution",
    lego: "Detailed Lego world, high-quality plastic brick textures, vibrant colors, professional 3D Lego render, sharp edges, cinematic toy photography",
    cinematic: "Cinematic film still, ultra-photorealistic, 8k resolution, highly detailed textures, dramatic lighting, professional color grading, shot on 35mm lens",
    anime: "High-end modern anime style, vibrant digital illustration, expressive characters, detailed backgrounds, clean line art, cinematic anime lighting",
    islamic_art: "Modern Islamic digital art, elegant geometric patterns, gold and teal accents, minimalist contemporary aesthetic, clean vector lines",
    paper_cutout: "Intricate layered paper-cut art, 3D depth of field, sharp paper edges, vibrant colors, professional craft photography",
    watercolor: "Professional watercolor illustration, soft wet-on-wet blending, artistic brush strokes, high-quality paper texture, ethereal lighting"
  };

  const negativePrompt = "Avoid blurry, low quality, distorted, deformed, text, watermark, signature, messy, low resolution";
  // Clean any --ar flags from the prompt to prevent the backend from trying to parse it and throwing INVALID_ARGUMENT
  const cleanPrompt = prompt.replace(/--ar\s+\d+[\/:]\d+/gi, '').trim();
  const fullPrompt = `${stylePrefixes[style]}, ${anchor ? `${anchor}, ` : ''}${cleanPrompt}, ${negativePrompt}, masterpiece, highly detailed`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-image',
    contents: { parts: [{ text: fullPrompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const generateAudio = async (text: string, voiceName: VoiceName): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  if (!text) return null;
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-tts-preview',
    contents: [{ parts: [{ text: text.trim() }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio ? pcmToWav(base64Audio) : null;
};

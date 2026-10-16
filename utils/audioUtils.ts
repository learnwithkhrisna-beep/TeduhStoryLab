
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Converts raw PCM base64 data to a WAV Blob URL for playback.
 */
export const pcmToWav = (base64PCM: string, sampleRate: number = 24000): string | null => {
  try {
    const binaryString = atob(base64PCM);
    const len = binaryString.length;
    const adjustedLen = len % 2 === 0 ? len : len - 1;
    const buffer = new ArrayBuffer(adjustedLen);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < adjustedLen; i++) {
      view[i] = binaryString.charCodeAt(i);
    }
    const pcmData = new Int16Array(buffer);

    const wavBuffer = new ArrayBuffer(44 + pcmData.length * 2);
    const viewWav = new DataView(wavBuffer);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(viewWav, 0, 'RIFF');
    viewWav.setUint32(4, 36 + pcmData.length * 2, true);
    writeString(viewWav, 8, 'WAVE');
    writeString(viewWav, 12, 'fmt ');
    viewWav.setUint32(16, 16, true);
    viewWav.setUint16(20, 1, true);
    viewWav.setUint16(22, 1, true);
    viewWav.setUint32(24, sampleRate, true);
    viewWav.setUint32(28, sampleRate * 2, true);
    viewWav.setUint16(32, 2, true);
    viewWav.setUint16(34, 16, true);
    writeString(viewWav, 36, 'data');
    viewWav.setUint32(40, pcmData.length * 2, true);

    const pcmView = new Int16Array(wavBuffer, 44);
    pcmView.set(pcmData);

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error converting audio:", e);
    return null;
  }
};

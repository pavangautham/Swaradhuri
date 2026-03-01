const LAMEJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.min.js";
const MAX_SAMPLES = 1152;
const TARGET_KBPS = 128;

function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function loadLamejs(): Promise<typeof globalThis & { lamejs?: { Mp3Encoder: new (ch: number, sr: number, kbps: number) => { encodeBuffer: (l: Int16Array, r?: Int16Array) => Int8Array; flush: () => Int8Array } } }> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in browser"));
  const w = window as typeof globalThis & { lamejs?: { Mp3Encoder: new (ch: number, sr: number, kbps: number) => { encodeBuffer: (l: Int16Array, r?: Int16Array) => Int8Array; flush: () => Int8Array } } };
  if (w.lamejs?.Mp3Encoder) return Promise.resolve(w);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = LAMEJS_CDN;
    s.onload = () => resolve(w);
    s.onerror = () => reject(new Error("Failed to load MP3 encoder"));
    document.head.appendChild(s);
  });
}

/**
 * Compress an MP3 file to a smaller size by re-encoding at 128kbps.
 * Use for files over 10MB to stay within Next.js body limits.
 */
export async function compressMp3(file: File): Promise<File> {
  const win = await loadLamejs();
  const Mp3Encoder = win.lamejs!.Mp3Encoder;

  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  await audioContext.close();

  const { numberOfChannels, sampleRate } = audioBuffer;
  const encoder = new Mp3Encoder(numberOfChannels, sampleRate, TARGET_KBPS);
  const mp3Chunks: Int8Array[] = [];

  const left = floatTo16BitPCM(audioBuffer.getChannelData(0));
  const right = numberOfChannels > 1 ? floatTo16BitPCM(audioBuffer.getChannelData(1)) : left;

  for (let i = 0; i < left.length; i += MAX_SAMPLES) {
    const leftChunk = left.subarray(i, i + MAX_SAMPLES);
    const rightChunk = right.subarray(i, i + MAX_SAMPLES);
    const mp3Buf = encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3Buf.length > 0) mp3Chunks.push(mp3Buf);
  }

  const flush = encoder.flush();
  if (flush.length > 0) mp3Chunks.push(flush);

  const blob = new Blob(mp3Chunks as BlobPart[], { type: "audio/mpeg" });
  const name = file.name.endsWith(".mp3") ? file.name : `${file.name}.mp3`;
  return new File([blob], name, { type: "audio/mpeg" });
}

import { useState, useEffect } from 'react';
import { FRAMES, CHROMA_COLOR, CHROMA_THRESHOLD } from '../config';
import { loadImage, applyChromaKey } from '../utils/chromaKey';

/**
 * 모든 프레임 이미지를 로드하고 크로마키 처리된 canvas 배열을 반환합니다.
 * @returns {{ frameCanvases: HTMLCanvasElement[], loading: boolean, error: string|null }}
 */
export function useFrames() {
  const [frameCanvases, setFrameCanvases] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const imgs    = await Promise.all(FRAMES.map((f) => loadImage(f.src)));
        const canvases = imgs.map((img) => applyChromaKey(img, CHROMA_COLOR, CHROMA_THRESHOLD));
        if (!cancelled) {
          setFrameCanvases(canvases);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { frameCanvases, loading, error };
}

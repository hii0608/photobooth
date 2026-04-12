import { useState, useEffect } from 'react';
import { CHROMA_COLOR, CHROMA_THRESHOLD } from '../config';
import { loadImage, applyChromaKey } from '../utils/chromaKey';
import { getFramePath } from '../themes/themeConfig';

/**
 * 선택된 테마 + 레이아웃에 해당하는 프레임 canvas 배열을 반환합니다.
 * 기본 테마(default)이면 빈 배열을 즉시 반환합니다.
 *
 * @param {string} themeId      - 테마 ID ('default' 이면 프레임 없음)
 * @param {string} layoutFolder - 레이아웃 폴더명 (예: '1_4')
 * @param {number} total        - 촬영 슬롯 수
 * @returns {{ frameCanvases: HTMLCanvasElement[], loading: boolean, error: string|null }}
 */
export function useTheme(themeId, layoutFolder, total) {
  const [frameCanvases, setFrameCanvases] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    // 기본 테마이거나 필수 값이 없으면 프레임 없이 바로 완료
    if (!themeId || themeId === 'default' || !layoutFolder || !total) {
      setFrameCanvases([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const paths    = Array.from({ length: total }, (_, i) =>
          getFramePath(themeId, layoutFolder, i),
        );
        const imgs     = await Promise.all(paths.map((p) => loadImage(p)));
        const canvases = imgs.map((img) =>
          applyChromaKey(img, CHROMA_COLOR, CHROMA_THRESHOLD),
        );
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
  }, [themeId, layoutFolder, total]);

  return { frameCanvases, loading, error };
}

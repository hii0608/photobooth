import { useState, useEffect } from 'react';
import { loadImage } from '../utils/chromaKey';
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
    // 필수 값이 없으면 바로 완료
    if (!themeId || !layoutFolder || !total) {
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
        // 개별 이미지 로드 — 실패(404 등)하면 null로 처리
        const results = await Promise.all(
          paths.map((p) => loadImage(p).catch(() => null)),
        );
        const validImgs = results.filter(Boolean);
        // PNG의 알파 채널을 그대로 사용 (크로마키 불필요)
        const canvases = validImgs.map((img) => {
          const c = document.createElement('canvas');
          c.width  = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          return c;
        });
        if (!cancelled) {
          setFrameCanvases(canvases);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          // 로드 자체 실패 시 프레임 없이 진행
          setFrameCanvases([]);
          setError(err.message);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [themeId, layoutFolder, total]);

  return { frameCanvases, loading, error };
}

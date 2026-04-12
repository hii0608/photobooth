import { useRef, useCallback } from 'react';

/**
 * 카메라 스트림 관리 훅
 */
export function useCamera() {
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);

  const startCamera = useCallback(async () => {
    stopCamera();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await new Promise((res) => { videoRef.current.onloadedmetadata = res; });
      await videoRef.current.play();
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  return { videoRef, startCamera, stopCamera };
}

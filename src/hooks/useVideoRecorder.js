import { useRef, useCallback } from 'react';

/**
 * 카메라 스트림에서 영상 클립을 녹화합니다.
 *
 * startClip() → 녹화 시작
 * stopClip()  → 녹화 종료, Blob Promise 반환 (실패 시 null)
 */
export function useVideoRecorder(videoRef) {
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);

  const startClip = useCallback(() => {
    const stream = videoRef.current?.srcObject;
    if (!stream || typeof MediaRecorder === 'undefined') return false;

    chunksRef.current = [];

    const mimeType =
      ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']
        .find((t) => MediaRecorder.isTypeSupported(t)) ?? '';

    try {
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : {},
      );
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(100); // 100ms 단위로 chunk 수집
      recorderRef.current = recorder;
      return true;
    } catch {
      return false;
    }
  }, [videoRef]);

  const stopClip = useCallback(
    () =>
      new Promise((resolve) => {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state === 'inactive') {
          resolve(null);
          return;
        }
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          resolve(blob.size > 0 ? blob : null);
        };
        recorder.stop();
      }),
    [],
  );

  return { startClip, stopClip };
}

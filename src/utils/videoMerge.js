/**
 * 여러 영상 Blob을 하나의 WebM 파일로 합칩니다.
 * canvas.captureStream + MediaRecorder 방식으로 순차 재생하며 녹화합니다.
 *
 * @param {(Blob|null)[]} blobs   - 클립 배열 (null 슬롯은 건너뜀)
 * @param {number}        width   - 출력 영상 너비
 * @param {number}        height  - 출력 영상 높이
 * @param {(p:number)=>void} [onProgress] - 진행률 콜백 (0~1)
 * @returns {Promise<Blob|null>}
 */
export async function mergeVideoClips(blobs, width, height, onProgress) {
  const validBlobs = blobs.filter(Boolean);
  if (validBlobs.length === 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const mimeType =
    ['video/webm;codecs=vp9', 'video/webm']
      .find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';

  const stream   = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks   = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.start(100);

  for (let i = 0; i < validBlobs.length; i++) {
    const blob = validBlobs[i];
    const url  = URL.createObjectURL(blob);
    const vid  = document.createElement('video');
    vid.src        = url;
    vid.muted      = true;
    vid.playsInline = true;

    // 메타데이터 로드 대기
    await new Promise((r) => {
      vid.oncanplaythrough = r;
      vid.onerror = r;
      vid.load();
    });

    // 재생하면서 canvas에 그리기
    await new Promise((r) => {
      let rafId;
      const drawFrame = () => {
        if (!vid.ended && !vid.paused) {
          ctx.save();
          // 좌우 반전 적용
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(vid, 0, 0, width, height);
          ctx.restore();
          rafId = requestAnimationFrame(drawFrame);
        }
      };
      vid.onended = () => { cancelAnimationFrame(rafId); r(); };
      vid.onerror = () => { cancelAnimationFrame(rafId); r(); };
      vid.play().then(() => { rafId = requestAnimationFrame(drawFrame); }).catch(r);
    });

    URL.revokeObjectURL(url);
    onProgress?.((i + 1) / validBlobs.length);
  }

  return new Promise((resolve) => {
    recorder.onstop = () =>
      resolve(chunks.length > 0 ? new Blob(chunks, { type: 'video/webm' }) : null);
    recorder.stop();
  });
}

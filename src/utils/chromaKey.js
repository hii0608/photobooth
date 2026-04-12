/**
 * 이미지에서 크로마키 색상을 투명하게 처리한 canvas를 반환합니다.
 * @param {HTMLImageElement} img
 * @param {{ r: number, g: number, b: number }} color
 * @param {number} threshold
 * @returns {HTMLCanvasElement}
 */
export function applyChromaKey(img, color, threshold) {
  const canvas = document.createElement('canvas');
  canvas.width  = img.naturalWidth  || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const { r: tr, g: tg, b: tb } = color;
  const th2 = threshold * threshold;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i]     - tr;
    const dg = data[i + 1] - tg;
    const db = data[i + 2] - tb;
    if (dr * dr + dg * dg + db * db < th2) {
      data[i + 3] = 0; // alpha → transparent
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * src 문자열로 이미지를 로드하고 Promise로 반환합니다.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    img.src = src;
  });
}

/**
 * canvas 위에 거울 모드(좌우 반전)로 video를 object-fit:cover 방식으로 그립니다.
 */
export function drawMirroredVideo(ctx, video, destW, destH) {
  const vw = video.videoWidth  || destW;
  const vh = video.videoHeight || destH;
  const scale = Math.max(destW / vw, destH / vh);
  const sw = destW / scale;
  const sh = destH / scale;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;

  ctx.save();
  ctx.translate(destW, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, destW, destH);
  ctx.restore();
}

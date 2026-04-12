/**
 * 포토부스 테마 템플릿 PNG 생성기
 * 실행: node scripts/generate-templates.cjs
 *
 * 출력: public/themes/template/{layout_folder}/{slot}.png
 *
 * 구조:
 *   - 투명(alpha=0) 영역  = 사진이 보이는 곳 (꾸밈 없음)
 *   - 체커보드(불투명) 영역 = 테두리/꾸밈을 그려야 할 곳
 *   - 모서리 십자 마크     = 사진 영역 경계 위치 표시
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── 레이아웃 정의 (config.js 와 동기화) ─────────────────────────
const LAYOUTS = [
  { folder: '1_4',   total: 4, photoRatio: 4/3, label: '1×4'    },
  { folder: '2_3',   total: 6, photoRatio: 4/3, label: '2×3'    },
  { folder: '2_2_v', total: 4, photoRatio: 3/4, label: '2×2세로' },
  { folder: '1_3',   total: 3, photoRatio: 4/3, label: '1×3'    },
  { folder: '3_1',   total: 3, photoRatio: 3/4, label: '3×1'    },
  { folder: '2_2_h', total: 4, photoRatio: 4/3, label: '2×2가로' },
];

// ── PNG 인코더 RGBA (zlib + CRC32) ──────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF];
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const tb  = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crc]);
}

// RGBA (color type 6) PNG 인코더
function encodePngRGBA(width, height, getPixel) {
  const rowBytes = width * 4; // RGBA
  const raw      = Buffer.allocUnsafe(height * (rowBytes + 1));

  for (let y = 0; y < height; y++) {
    raw[y * (rowBytes + 1)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const o = y * (rowBytes + 1) + 1 + x * 4;
      raw[o] = r; raw[o+1] = g; raw[o+2] = b; raw[o+3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });

  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8]  = 8; // bit depth
  ihdrData[9]  = 6; // color type: RGBA
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdrData),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── 픽셀 함수 ────────────────────────────────────────────────────
function makePixelFn(W, H, border) {
  const mark = Math.round(border * 0.5);  // 모서리 마크 크기
  const markThick = Math.max(3, Math.round(border * 0.04)); // 마크 선 굵기

  return function getPixel(x, y) {
    const inPhoto = x >= border && x < W - border && y >= border && y < H - border;

    if (inPhoto) {
      // ── 사진 영역: 투명 (alpha=0) ────────────────────────────
      // 단, 모서리 마크(반투명 흰색)는 그리기
      const lx = x - border;
      const ly = y - border;
      const gW = W - border * 2;
      const gH = H - border * 2;

      const nearLeft   = lx < mark;
      const nearRight  = lx >= gW - mark;
      const nearTop    = ly < mark;
      const nearBottom = ly >= gH - mark;

      const crossH = ly >= mark / 2 - markThick && ly < mark / 2 + markThick;
      const crossV = lx >= mark / 2 - markThick && lx < mark / 2 + markThick;
      const crossH2 = ly >= gH - mark / 2 - markThick && ly < gH - mark / 2 + markThick;
      const crossV2 = lx >= gW - mark / 2 - markThick && lx < gW - mark / 2 + markThick;

      if ((nearLeft  && nearTop)    && (crossH  || crossV))  return [255, 255, 255, 180];
      if ((nearRight && nearTop)    && (crossH  || crossV2)) return [255, 255, 255, 180];
      if ((nearLeft  && nearBottom) && (crossH2 || crossV))  return [255, 255, 255, 180];
      if ((nearRight && nearBottom) && (crossH2 || crossV2)) return [255, 255, 255, 180];

      return [0, 0, 0, 0]; // 완전 투명
    }

    // ── 꾸밈 영역: 체커보드 (불투명) — 실제 제작 시 이 부분에 그림 ──
    const tile    = Math.max(16, Math.round(border * 0.35));
    const checker = (Math.floor(x / tile) + Math.floor(y / tile)) % 2;
    const shade   = checker === 0 ? 210 : 185;
    return [shade, shade, shade, 255];
  };
}

// ── 생성 실행 ────────────────────────────────────────────────────
const OUT_BASE = path.join(__dirname, '..', 'public', 'themes', 'template');

LAYOUTS.forEach(({ folder, total, photoRatio, label }) => {
  const W      = photoRatio >= 1 ? 1280 : 960;
  const H      = photoRatio >= 1 ? 960  : 1280;
  const border = Math.round(Math.min(W, H) * 0.06);

  const dir = path.join(OUT_BASE, folder);
  fs.mkdirSync(dir, { recursive: true });

  for (let slot = 1; slot <= total; slot++) {
    const png     = encodePngRGBA(W, H, makePixelFn(W, H, border));
    const outPath = path.join(dir, `${slot}.png`);
    fs.writeFileSync(outPath, png);
    console.log(`✓  ${label}  slot ${slot}  →  ${path.relative(process.cwd(), outPath)}`);
  }
});

console.log('\n완료! public/themes/template/ 에 저장되었습니다.');
console.log('투명 영역 = 사진 / 체커보드 = 꾸밈 영역');

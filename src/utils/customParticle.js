/**
 * 이미지 기반 커스텀 파티클 시스템
 *
 * 지원 애니메이션 타입:
 *  bubble  — 거품 올라오기 (위로 떠오름)
 *  cherry  — 꽃잎 날리기   (회전하며 낙하)
 *  wind    — 바람 불기      (대각선 수평 이동)
 *  fish    — 물고기 유영    (사인파 수평 이동)
 *  sway    — 흔들리며 낙하  (진자 운동)
 *  fall    — 낙하           (빠른 직선 낙하)
 *  float   — 둥실둥실       (느린 랜덤 부유)
 */

class CustomParticle {
  constructor(images, config, canvasWidth, canvasHeight) {
    this.images      = images; // HTMLImageElement[]
    this.config      = config;
    this.canvasWidth  = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.img = this._pickImage();
    this.time = Math.random() * Math.PI * 2;
    this.reset();
  }

  _pickImage() {
    if (!this.images.length) return null;
    return this.images[Math.floor(Math.random() * this.images.length)];
  }

  reset() {
    const { animType = 'float', speed = 1, sizeScale = 1 } = this.config;
    const base = Math.min(this.canvasWidth, this.canvasHeight) * 0.09 * sizeScale;
    this.size    = base * (0.6 + Math.random() * 0.8);
    this.opacity = Math.random() * 0.4 + 0.5;
    this.angle   = Math.random() * Math.PI * 2;
    this.time    = Math.random() * Math.PI * 2;

    switch (animType) {
      case 'bubble':
        this.x      = Math.random() * this.canvasWidth;
        this.y      = this.canvasHeight + this.size;
        this.speedX = (Math.random() - 0.5) * 0.8 * speed;
        this.speedY = -(Math.random() * 1.5 + 0.5) * speed;
        this.spin   = (Math.random() - 0.5) * 0.02;
        break;

      case 'cherry':
        this.x      = Math.random() * this.canvasWidth;
        this.y      = -this.size;
        this.speedX = (Math.random() - 0.5) * 1.2 * speed;
        this.speedY = (Math.random() * 1.5 + 0.5) * speed;
        this.spin   = (Math.random() - 0.5) * 0.07;
        break;

      case 'wind':
        this.x      = -this.size * 2;
        this.y      = Math.random() * this.canvasHeight;
        this.speedX = (Math.random() * 1.5 + 1.5) * speed;
        this.speedY = (Math.random() - 0.5) * 0.6 * speed;
        this.spin   = (Math.random() - 0.5) * 0.04;
        break;

      case 'fish': {
        const goRight = Math.random() > 0.5;
        this.x         = goRight ? -this.size * 2 : this.canvasWidth + this.size * 2;
        this.y         = Math.random() * this.canvasHeight;
        this.speedX    = (goRight ? 1 : -1) * (Math.random() * 1.2 + 0.6) * speed;
        this.speedY    = 0;
        this.spin      = 0;
        this.amplitude = Math.random() * 1.5 + 0.5;
        this.frequency = Math.random() * 0.04 + 0.02;
        break;
      }

      case 'sway':
        this.x             = Math.random() * this.canvasWidth;
        this.y             = -this.size;
        this.speedX        = 0;
        this.speedY        = (Math.random() * 0.6 + 0.3) * speed;
        this.spin          = 0;
        this.swayAmplitude = (Math.random() * 2.5 + 1) * speed;
        this.swayFreq      = Math.random() * 0.03 + 0.015;
        break;

      case 'fall':
        this.x      = Math.random() * this.canvasWidth;
        this.y      = -this.size;
        this.speedX = (Math.random() - 0.5) * 0.5 * speed;
        this.speedY = (Math.random() * 2.5 + 1.5) * speed;
        this.spin   = (Math.random() - 0.5) * 0.03;
        break;

      case 'float':
      default:
        this.x      = Math.random() * this.canvasWidth;
        this.y      = Math.random() * this.canvasHeight;
        this.speedX = (Math.random() - 0.5) * 0.6 * speed;
        this.speedY = (Math.random() - 0.5) * 0.6 * speed;
        this.spin   = (Math.random() - 0.5) * 0.015;
        break;
    }
  }

  update() {
    const { animType = 'float' } = this.config;
    this.time += 0.03;

    if (animType === 'fish') {
      this.x += this.speedX;
      this.y += Math.sin(this.time * (this.frequency * 60)) * this.amplitude;
    } else if (animType === 'sway') {
      this.x += Math.sin(this.time * (this.swayFreq * 60)) * this.swayAmplitude;
      this.y += this.speedY;
    } else {
      this.x += this.speedX;
      this.y += this.speedY;
    }
    this.angle += (this.spin ?? 0);

    const pad = this.size * 4;
    const oob =
      this.x > this.canvasWidth  + pad ||
      this.x < -pad ||
      this.y > this.canvasHeight + pad ||
      this.y < -pad;

    if (oob) {
      this.img = this._pickImage();
      this.reset();
    }
  }

  draw(ctx) {
    if (!this.img?.complete || !this.img.naturalWidth) {
      this._drawFallback(ctx);
      return;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    // 물고기: 방향에 따라 좌우 반전
    if (this.config.animType === 'fish' && this.speedX < 0) {
      ctx.scale(-1, 1);
    }
    ctx.globalAlpha = this.opacity;
    ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
    ctx.restore();
  }

  _drawFallback(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.opacity * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class CustomParticleEffect {
  constructor(config, images = []) {
    this.config    = config;
    this.images    = images;
    this.particles = [];
    this.width     = 0;
    this.height    = 0;
  }

  init(width, height) {
    this.width  = width;
    this.height = height;
    const count = Math.max(5, Math.min(50, this.config.count ?? 20));
    this.particles = Array.from(
      { length: count },
      () => new CustomParticle(this.images, this.config, width, height),
    );
  }

  /** 이미지 또는 설정 변경 시 재초기화 */
  reinit(config, images) {
    this.config = config;
    this.images = images;
    if (this.width && this.height) this.init(this.width, this.height);
  }

  update() { this.particles.forEach((p) => p.update()); }
  draw(ctx) { this.particles.forEach((p) => p.draw(ctx)); }
}

// ── 애니메이션 타입 메타데이터 (UI 표시용) ─────────────────────
export const ANIM_TYPES = [
  { id: 'bubble', label: '거품 올라오기',    desc: '아래에서 위로 둥실둥실' },
  { id: 'cherry', label: '꽃잎 날리기',      desc: '회전하며 위에서 아래로' },
  { id: 'wind',   label: '바람 불기',         desc: '한쪽 방향으로 가로 이동' },
  { id: 'fish',   label: '물고기 유영',       desc: '사인파로 좌우 이동' },
  { id: 'sway',   label: '흔들리며 낙하',    desc: '진자처럼 흔들리며 낙하' },
  { id: 'fall',   label: '낙하',              desc: '빠르게 아래로 떨어짐' },
  { id: 'float',  label: '둥실둥실',          desc: '느리게 랜덤 부유' },
];

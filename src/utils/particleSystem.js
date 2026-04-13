/**
 * 간단한 파티클 시스템
 * 금붕어, 벚꽃, 눈, 낙엽 등을 캔버스에 그리는 로직을 관리합니다.
 */

class Particle {
  constructor(canvasWidth, canvasHeight, type = 'bubble') {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.type = type; // 'goldfish', 'cherry', 'snow', 'leaf', 'bubble'
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.canvasWidth;
    this.y = Math.random() * this.canvasHeight;
    this.size = Math.random() * 15 + 5;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = Math.random() * 2 - 1;
    this.opacity = Math.random() * 0.5 + 0.3;
    this.angle = Math.random() * Math.PI * 2;
    this.spin = Math.random() * 0.05 - 0.025;
    
    // 타입별 특화 움직임
    if (this.type === 'snow') {
      this.speedY = Math.random() * 1 + 0.5;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.y = -this.size;
    } else if (this.type === 'cherry' || this.type === 'leaf') {
      this.speedY = Math.random() * 1.5 + 0.5;
      this.speedX = Math.random() * 1 - 0.5;
      this.y = -this.size;
    } else if (this.type === 'bubble') {
      this.speedY = -(Math.random() * 1 + 0.5);
      this.y = this.canvasHeight + this.size;
    } else if (this.type === 'goldfish') {
      this.speedX = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 1.5 + 0.5);
      this.speedY = Math.random() * 0.6 - 0.3;
      this.x = this.speedX > 0 ? -this.size * 2 : this.canvasWidth + this.size * 2;
      this.y = Math.random() * this.canvasHeight;
    }
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.angle += this.spin;

    // 화면 밖으로 나갔을 때 재설정
    if (this.y > this.canvasHeight + 20 || this.y < -20 || 
        this.x > this.canvasWidth + 20 || this.x < -20) {
      this.reset();
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = this.opacity;

    if (this.type === 'goldfish') {
      ctx.scale(this.speedX > 0 ? 1 : -1, 1);
      ctx.font = `${this.size * 2}px serif`;
      ctx.fillText('🐠', 0, 0);
    } else if (this.type === 'cherry') {
      ctx.fillStyle = '#ffb7c5';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'snow') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'leaf') {
      ctx.fillStyle = '#d35400';
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size / 2, 0);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size / 2, 0);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'bubble') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class ParticleEffect {
  constructor(count = 20, type = 'goldfish') {
    this.particles = [];
    this.count = count;
    this.type = type;
    this.width = 0;
    this.height = 0;
  }

  init(width, height) {
    this.width = width;
    this.height = height;
    this.particles = Array.from({ length: this.count }, () => new Particle(width, height, this.type));
  }

  setType(type) {
    this.type = type;
    this.particles.forEach(p => {
      p.type = type;
      p.reset();
    });
  }

  update() {
    this.particles.forEach(p => p.update());
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }
}

const AVATAR_SIZE = 256;

export function cropToCircle(imageData: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext('2d')!;

      ctx.beginPath();
      ctx.arc(AVATAR_SIZE / 2, AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageData;
  });
}

const OVERLAYS = ['cat', 'dog', 'bunny', 'bear', 'panda', 'frog'] as const;

export type OverlayType = typeof OVERLAYS[number];

export function getRandomOverlay(): OverlayType {
  return OVERLAYS[Math.floor(Math.random() * OVERLAYS.length)];
}

export function addCuteOverlay(circleData: string, overlay: OverlayType): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE + 32;
      const ctx = canvas.getContext('2d')!;

      ctx.drawImage(img, 0, 20);

      drawOverlay(ctx, overlay);

      resolve(canvas.toDataURL('image/png'));
    };
    img.src = circleData;
  });
}

function drawOverlay(ctx: CanvasRenderingContext2D, overlay: OverlayType): void {
  ctx.save();
  switch (overlay) {
    case 'cat':
      drawEars(ctx, '#ff9999', '#ffcccc', true);
      break;
    case 'dog':
      drawFloppyEars(ctx, '#c4873b');
      break;
    case 'bunny':
      drawBunnyEars(ctx, '#ffb6c1', '#fff0f5');
      break;
    case 'bear':
      drawRoundEars(ctx, '#8B4513', '#D2691E');
      break;
    case 'panda':
      drawRoundEars(ctx, '#333', '#555');
      break;
    case 'frog':
      drawFrogEyes(ctx);
      break;
  }
  ctx.restore();
}

function drawEars(ctx: CanvasRenderingContext2D, outer: string, inner: string, pointed: boolean): void {
  ctx.fillStyle = outer;
  if (pointed) {
    // Left ear
    ctx.beginPath();
    ctx.moveTo(20, 28);
    ctx.lineTo(10, 0);
    ctx.lineTo(45, 18);
    ctx.closePath();
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.moveTo(AVATAR_SIZE - 20, 28);
    ctx.lineTo(AVATAR_SIZE - 10, 0);
    ctx.lineTo(AVATAR_SIZE - 45, 18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = inner;
  if (pointed) {
    ctx.beginPath();
    ctx.moveTo(23, 26);
    ctx.lineTo(16, 6);
    ctx.lineTo(42, 19);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(AVATAR_SIZE - 23, 26);
    ctx.lineTo(AVATAR_SIZE - 16, 6);
    ctx.lineTo(AVATAR_SIZE - 42, 19);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFloppyEars(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;
  // Left floppy ear
  ctx.beginPath();
  ctx.ellipse(8, 50, 16, 30, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Right floppy ear
  ctx.beginPath();
  ctx.ellipse(AVATAR_SIZE - 8, 50, 16, 30, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBunnyEars(ctx: CanvasRenderingContext2D, outer: string, inner: string): void {
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.ellipse(35, 0, 12, 30, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(AVATAR_SIZE - 35, 0, 12, 30, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.ellipse(35, 0, 7, 24, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(AVATAR_SIZE - 35, 0, 7, 24, 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoundEars(ctx: CanvasRenderingContext2D, outer: string, inner: string): void {
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(22, 22, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(AVATAR_SIZE - 22, 22, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = inner;
  ctx.beginPath();
  ctx.arc(22, 22, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(AVATAR_SIZE - 22, 22, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrogEyes(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.arc(28, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(AVATAR_SIZE - 28, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(28, 14, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(AVATAR_SIZE - 28, 14, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(28, 14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(AVATAR_SIZE - 28, 14, 4, 0, Math.PI * 2);
  ctx.fill();
}

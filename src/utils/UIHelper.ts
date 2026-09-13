import Phaser from 'phaser';

export const FONT = 'Nunito';
export const FONT_BOLD = 'Nunito';

export const PAL = {
  bg1: 0x0f0e17,
  bg2: 0x1a1932,
  bg3: 0x232246,
  surface: 0x2b2a4a,
  surfaceLight: 0x3a3966,
  accent: 0xff8906,
  accentGlow: 0xffb347,
  success: 0x2cb67d,
  successLight: 0x3dd68c,
  danger: 0xe53170,
  dangerLight: 0xff5c8a,
  text: 0xfffffe,
  textHex: '#fffffe',
  textMuted: '#94a1b2',
  textMutedHex: '#94a1b2',
  gold: 0xf9c74f,
  goldHex: '#f9c74f',
  sky1: 0x5b86e5,
  sky2: 0x36d1dc,
  dirt1: 0x8B6914,
  dirt2: 0x6d5210,
  dirt3: 0x4a370a,
  grass: 0x43aa8b,
  grassLight: 0x5cc9a5,
};

export function drawSkyGradient(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const bg = scene.add.graphics();
  bg.fillGradientStyle(PAL.sky1, PAL.sky2, PAL.sky1, PAL.sky2, 1);
  bg.fillRect(0, 0, width, height);
}

export function drawDarkGradient(scene: Phaser.Scene): void {
  const { width, height } = scene.scale;
  const bg = scene.add.graphics();
  bg.fillGradientStyle(PAL.bg1, PAL.bg2, PAL.bg3, PAL.bg1, 1);
  bg.fillRect(0, 0, width, height);
}

export function drawGlassPanel(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number, alpha = 0.12,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, alpha);
  g.fillRoundedRect(x, y, w, h, 20);
  g.lineStyle(1, 0xffffff, alpha * 0.6);
  g.strokeRoundedRect(x, y, w, h, 20);
  return g;
}

export function createPremiumButton(
  scene: Phaser.Scene,
  x: number, y: number,
  w: number, h: number,
  label: string,
  color: number,
  onClick: () => void,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  // Shadow
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.25);
  shadow.fillRoundedRect(-w / 2 + 4, 6, w, h, h / 2);
  container.add(shadow);

  // Body
  const body = scene.add.graphics();
  body.fillStyle(color, 1);
  body.fillRoundedRect(-w / 2, 0, w, h, h / 2);
  container.add(body);

  // Top highlight
  const highlight = scene.add.graphics();
  highlight.fillStyle(0xffffff, 0.15);
  highlight.fillRoundedRect(-w / 2 + 4, 2, w - 8, h * 0.45, { tl: h / 2, tr: h / 2, bl: 6, br: 6 });
  container.add(highlight);

  const text = scene.add.text(0, h / 2, label, {
    fontSize: '32px',
    fontFamily: FONT,
    fontStyle: '800',
    color: '#ffffff',
  }).setOrigin(0.5);
  container.add(text);

  const hitZone = scene.add.zone(0, h / 2, w, h + 10)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      scene.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 100 });
      scene.sound.play('rollover', { volume: 0.15 });
    })
    .on('pointerout', () => {
      scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    })
    .on('pointerdown', () => {
      scene.sound.play('click', { volume: 0.4 });
      scene.tweens.add({
        targets: container,
        scaleX: 0.95, scaleY: 0.95,
        duration: 60, yoyo: true,
        onComplete: onClick,
      });
    });
  container.add(hitZone);

  return container;
}

export function showFloatingText(
  scene: Phaser.Scene, x: number, y: number, text: string, color: string, size = '38px',
): void {
  const t = scene.add.text(x, y, text, {
    fontSize: size, fontFamily: FONT, fontStyle: '900', color,
    stroke: '#000', strokeThickness: 4,
  }).setOrigin(0.5).setDepth(100);

  scene.tweens.add({
    targets: t, y: y - 70, alpha: 0, scaleX: 1.2, scaleY: 1.2,
    duration: 800, ease: 'Power2', onComplete: () => t.destroy(),
  });
}

export function addFloatingClouds(scene: Phaser.Scene): void {
  const { width } = scene.scale;
  const cloudKeys = ['cloud1', 'cloud2', 'cloud3', 'cloud4', 'cloud5'];
  for (let i = 0; i < 4; i++) {
    const cloud = scene.add.image(
      100 + i * 240 + Math.random() * 60,
      40 + Math.random() * 60,
      cloudKeys[i % cloudKeys.length],
    ).setDisplaySize(130 + Math.random() * 50, 50 + Math.random() * 20)
      .setAlpha(0.45)
      .setTint(0xffffff);
    scene.tweens.add({
      targets: cloud, x: cloud.x + 40,
      duration: 10000 + Math.random() * 8000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }
}

export const COLORS = PAL;
export function drawBackground(scene: Phaser.Scene, top: number, bottom: number): void {
  const { width, height } = scene.scale;
  const bg = scene.add.graphics();
  bg.fillGradientStyle(top, top, bottom, bottom, 1);
  bg.fillRect(0, 0, width, height);
}

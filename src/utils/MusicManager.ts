import Phaser from 'phaser';
import { FONT, PAL } from './UIHelper';

const MUTE_KEY = 'whack-music-muted';

let bgm: Phaser.Sound.BaseSound | null = null;
let isMuted = localStorage.getItem(MUTE_KEY) === 'true';

export function startBGM(scene: Phaser.Scene): void {
  if (bgm && (bgm as any).isPlaying) return;

  bgm = scene.sound.add('bgm', { loop: true, volume: 0.3 });

  if (!isMuted) {
    bgm.play();
  }
}

export function toggleMute(scene: Phaser.Scene): boolean {
  isMuted = !isMuted;
  localStorage.setItem(MUTE_KEY, String(isMuted));

  if (bgm) {
    if (isMuted) {
      bgm.pause();
    } else {
      if ((bgm as any).isPaused) {
        bgm.resume();
      } else {
        bgm.play();
      }
    }
  }

  return isMuted;
}

export function isBGMMuted(): boolean {
  return isMuted;
}

export function setBGMVolume(vol: number): void {
  if (bgm && 'setVolume' in bgm) {
    (bgm as Phaser.Sound.WebAudioSound).setVolume(vol);
  }
}

export function addMuteButton(scene: Phaser.Scene, posX?: number, posY?: number): void {
  const { width } = scene.scale;
  const x = posX ?? width - 50;
  const y = posY ?? 50;

  const iconKey = isMuted ? 'icon-music-off' : 'icon-music-on';
  const btn = scene.add.image(x, y, iconKey)
    .setDisplaySize(32, 32)
    .setAlpha(isMuted ? 0.3 : 0.5)
    .setDepth(100)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => btn.setAlpha(0.8))
    .on('pointerout', () => btn.setAlpha(isMuted ? 0.3 : 0.5))
    .on('pointerdown', () => {
      const nowMuted = toggleMute(scene);
      btn.setTexture(nowMuted ? 'icon-music-off' : 'icon-music-on');
      btn.setAlpha(nowMuted ? 0.3 : 0.5);
      scene.sound.play('click', { volume: 0.3 });
    });
}

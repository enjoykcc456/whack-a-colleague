import Phaser from 'phaser';
import { getProfiles, type GameMode } from '../utils/ProfileStore';
import { drawDarkGradient, drawGlassPanel, createPremiumButton, PAL, FONT } from '../utils/UIHelper';
import { startBGM, addMuteButton } from '../utils/MusicManager';

const TIME_OPTIONS = [30, 60, 90];
const MODE_OPTIONS: { key: GameMode; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'fact', label: 'Fact' },
  { key: 'mixed', label: 'Mixed' },
];

export class HomeScene extends Phaser.Scene {
  private profileCountText!: Phaser.GameObjects.Text;
  private playBtn!: Phaser.GameObjects.Container;
  private selectedTime = 60;
  private selectedMode: GameMode = 'name';
  private timeButtons: { btn: Phaser.GameObjects.Container; text: Phaser.GameObjects.Text; time: number }[] = [];
  private modeButtons: { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; mode: GameMode }[] = [];

  constructor() {
    super('HomeScene');
  }

  create(): void {
    const { width, height } = this.scale;

    drawDarkGradient(this);

    // Ambient floating dots (same as results)
    for (let i = 0; i < 50; i++) {
      const dot = this.add.circle(
        Math.random() * width, Math.random() * height,
        1 + Math.random() * 1.5, 0xffffff, 0.03 + Math.random() * 0.05,
      );
      this.tweens.add({
        targets: dot, alpha: 0.01,
        duration: 1500 + Math.random() * 2500,
        yoyo: true, repeat: -1,
      });
    }

    // Floating animal decorations
    const animalKeys = [
      'animal-rabbit', 'animal-panda', 'animal-penguin',
      'animal-monkey', 'animal-pig', 'animal-elephant',
      'animal-giraffe', 'animal-parrot',
    ];
    animalKeys.forEach((key, i) => {
      const startX = 60 + Math.random() * (width - 120);
      const startY = 150 + Math.random() * (height - 400);
      const size = 55 + Math.random() * 30;
      const animal = this.add.image(startX, startY, key)
        .setDisplaySize(size, size * 0.85)
        .setAlpha(0.12 + Math.random() * 0.06);

      this.tweens.add({
        targets: animal,
        x: animal.x + 20 + Math.random() * 30,
        y: animal.y - 15 + Math.random() * 30,
        angle: -3 + Math.random() * 6,
        duration: 4000 + Math.random() * 3000,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 400,
      });
    });

    // Subtle top accent glow
    const glow = this.add.graphics();
    glow.fillStyle(PAL.accent, 0.04);
    glow.fillCircle(width / 2, 0, 300);

    // Main content card
    drawGlassPanel(this, 60, 180, width - 120, 380, 0.06);

    // Small accent line at top of card
    const topAccent = this.add.graphics();
    topAccent.fillStyle(PAL.accent, 0.8);
    topAccent.fillRoundedRect(width / 2 - 40, 180, 80, 4, 2);

    // Icon
    const iconGlow = this.add.graphics();
    iconGlow.fillStyle(PAL.accent, 0.06);
    iconGlow.fillCircle(width / 2, 250, 45);
    this.add.image(width / 2, 250, 'icon-target').setDisplaySize(46, 46).setTint(PAL.accent).setAlpha(0.7);

    // Title
    this.add.text(width / 2 + 2, 333, 'WHACK-A-\nCOLLEAGUE', {
      fontSize: '68px', fontFamily: FONT, fontStyle: '900',
      color: '#000000', align: 'center', lineSpacing: -10,
    }).setOrigin(0.5).setAlpha(0.2);

    this.add.text(width / 2, 330, 'WHACK-A-\nCOLLEAGUE', {
      fontSize: '68px', fontFamily: FONT, fontStyle: '900',
      color: PAL.textHex, align: 'center', lineSpacing: -10,
    }).setOrigin(0.5);

    // Accent bar
    const accentBar = this.add.graphics();
    accentBar.fillStyle(PAL.accent, 1);
    accentBar.fillRoundedRect(width / 2 - 50, 418, 100, 4, 2);

    // Subtitle
    this.add.text(width / 2, 448, 'Can you name your teammates?', {
      fontSize: '22px', fontFamily: FONT, fontStyle: '700',
      color: PAL.textMutedHex,
    }).setOrigin(0.5);

    // Profile count
    this.profileCountText = this.add.text(width / 2, 495, '', {
      fontSize: '20px', fontFamily: FONT, fontStyle: '700',
      color: PAL.textMutedHex,
    }).setOrigin(0.5);

    // Time selector pills — tight row
    this.timeButtons = [];
    const btnW = 90, gap = 14;
    const totalW = btnW * TIME_OPTIONS.length + gap * (TIME_OPTIONS.length - 1);
    const startX = width / 2 - totalW / 2 + btnW / 2;

    TIME_OPTIONS.forEach((t, i) => {
      const bx = startX + i * (btnW + gap);
      const container = this.add.container(bx, 580);

      const bg = this.add.graphics();
      container.add(bg);

      const label = this.add.text(0, 18, `${t}s`, {
        fontSize: '24px', fontFamily: FONT, fontStyle: '800', color: '#ffffff',
      }).setOrigin(0.5);
      container.add(label);

      const hz = this.add.zone(0, 18, btnW, 40)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.sound.play('click', { volume: 0.3 });
          this.selectedTime = t;
          this.updateTimeButtons();
        });
      container.add(hz);

      this.timeButtons.push({ btn: container, text: label, time: t });
    });
    this.updateTimeButtons();

    // Mode selector pills
    this.modeButtons = [];
    const mBtnW = 90, mGap = 14;
    const mTotalW = mBtnW * MODE_OPTIONS.length + mGap * (MODE_OPTIONS.length - 1);
    const mStartX = width / 2 - mTotalW / 2 + mBtnW / 2;

    MODE_OPTIONS.forEach((m, i) => {
      const mx = mStartX + i * (mBtnW + mGap);

      const bg = this.add.graphics();
      const text = this.add.text(mx, 660, m.label, {
        fontSize: '22px', fontFamily: FONT, fontStyle: '800', color: '#ffffff',
      }).setOrigin(0.5);

      this.add.zone(mx, 660, mBtnW, 36)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.sound.play('click', { volume: 0.3 });
          this.selectedMode = m.key;
          this.updateModeButtons();
        });

      this.modeButtons.push({ bg, text, mode: m.key });
    });
    this.updateModeButtons();

    // Buttons
    createPremiumButton(this, width / 2, 710, 380, 70, 'SETUP PROFILES', PAL.success, () => {
      this.scene.start('ProfileScene');
    });

    this.playBtn = createPremiumButton(this, width / 2, 810, 380, 70, 'PLAY', PAL.accent, () => {
      const profiles = getProfiles();
      if (profiles.length >= 3) {
        if (this.selectedMode !== 'name' && !profiles.some(p => p.funFact)) {
          this.profileCountText.setText('Add fun facts to profiles for this mode!');
          this.profileCountText.setColor('#e53170');
          return;
        }
        this.scene.start('GameScene', { roundTime: this.selectedTime, gameMode: this.selectedMode });
      }
    });

    // Leaderboard button
    createPremiumButton(this, width / 2, 910, 380, 70, 'LEADERBOARD', PAL.surfaceLight, () => {
      this.scene.start('LeaderboardScene');
    });

    // Footer
    this.add.text(width / 2, height - 40, 'An ice-breaking game for teams', {
      fontSize: '16px', fontFamily: FONT, fontStyle: '700',
      color: '#ffffff18',
    }).setOrigin(0.5);

    // Music
    startBGM(this);
    addMuteButton(this);

    this.updateProfileCount();

    // First-time welcome hint
    if (!localStorage.getItem('whack-welcome-seen')) {
      const hint = this.add.container(width / 2, height - 140).setDepth(100);

      const hintBg = this.add.graphics();
      hintBg.fillStyle(PAL.accent, 0.9);
      hintBg.fillRoundedRect(-280, -30, 560, 60, 16);
      hintBg.fillStyle(0xffffff, 0.1);
      hintBg.fillRoundedRect(-276, -28, 552, 26, { tl: 14, tr: 14, bl: 0, br: 0 });
      hint.add(hintBg);

      hint.add(this.add.text(0, 0, 'Add profiles first, pick a time, then play!', {
        fontSize: '20px', fontFamily: FONT, fontStyle: '700', color: '#ffffff',
      }).setOrigin(0.5));

      // Arrow pointing up
      const arrow = this.add.graphics();
      arrow.fillStyle(PAL.accent, 0.9);
      arrow.fillTriangle(0, -38, -12, -30, 12, -30);
      hint.add(arrow);

      // Auto dismiss after 6 seconds with fade
      this.time.delayedCall(6000, () => {
        this.tweens.add({
          targets: hint, alpha: 0, y: hint.y + 20,
          duration: 500, onComplete: () => hint.destroy(),
        });
      });

      // Tap to dismiss
      const dismissZone = this.add.zone(0, 0, 560, 60).setInteractive();
      dismissZone.on('pointerdown', () => {
        hint.destroy();
      });
      hint.add(dismissZone);

      localStorage.setItem('whack-welcome-seen', 'true');
    }
  }

  private updateProfileCount(): void {
    const count = getProfiles().length;
    if (count < 3) {
      this.playBtn.setAlpha(0.3);
      this.profileCountText.setText(`${count} profile${count !== 1 ? 's' : ''} loaded — need at least 3`);
      this.profileCountText.setColor('#e5317088');
    } else {
      this.playBtn.setAlpha(1);
      this.profileCountText.setText(`${count} profile${count !== 1 ? 's' : ''} ready`);
      this.profileCountText.setColor('#2cb67d');
    }
  }

  private updateTimeButtons(): void {
    this.timeButtons.forEach(({ btn, text, time }) => {
      const bg = btn.getAt(0) as Phaser.GameObjects.Graphics;
      bg.clear();
      if (time === this.selectedTime) {
        bg.fillStyle(PAL.accent, 1);
        bg.fillRoundedRect(-45, 0, 90, 36, 18);
        text.setColor('#ffffff');
      } else {
        bg.fillStyle(0xffffff, 0.06);
        bg.fillRoundedRect(-45, 0, 90, 36, 18);
        bg.lineStyle(1, 0xffffff, 0.1);
        bg.strokeRoundedRect(-45, 0, 90, 36, 18);
        text.setColor(PAL.textMutedHex);
      }
    });
  }

  private updateModeButtons(): void {
    const mBtnW = 90, mGap = 14;
    const mTotalW = mBtnW * MODE_OPTIONS.length + mGap * (MODE_OPTIONS.length - 1);
    const mStartX = this.scale.width / 2 - mTotalW / 2 + mBtnW / 2;

    this.modeButtons.forEach(({ bg, text, mode }, i) => {
      const mx = mStartX + i * (mBtnW + mGap);
      bg.clear();
      if (mode === this.selectedMode) {
        bg.fillStyle(PAL.success, 1);
        bg.fillRoundedRect(mx - 45, 642, 90, 36, 18);
        text.setColor('#ffffff');
      } else {
        bg.fillStyle(0xffffff, 0.06);
        bg.fillRoundedRect(mx - 45, 642, 90, 36, 18);
        bg.lineStyle(1, 0xffffff, 0.1);
        bg.strokeRoundedRect(mx - 45, 642, 90, 36, 18);
        text.setColor(PAL.textMutedHex);
      }
    });
  }
}

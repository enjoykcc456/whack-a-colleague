import Phaser from 'phaser';
import { getProfiles, type Profile, type GameMode } from '../utils/ProfileStore';
import { drawDarkGradient, drawGlassPanel, showFloatingText, PAL, FONT } from '../utils/UIHelper';
import { addMuteButton, setBGMVolume } from '../utils/MusicManager';

const GRID_COLS = 3;
const GRID_ROWS = 3;
const DEFAULT_ROUND_TIME = 60;

interface MoleSlot {
  x: number;
  y: number;
  face: Phaser.GameObjects.Image | null;
  faceMask: Phaser.GameObjects.Graphics | null;
  profile: Profile | null;
  isUp: boolean;
  timer: Phaser.Time.TimerEvent | null;
}

export class GameScene extends Phaser.Scene {
  private profiles: Profile[] = [];
  private slots: MoleSlot[] = [];
  private targetProfile: Profile | null = null;
  private targetText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private timerBarFill!: Phaser.GameObjects.Graphics;
  private score = 0;
  private correctHits = 0;
  private totalTaps = 0;
  private roundTime = DEFAULT_ROUND_TIME;
  private timeLeft = DEFAULT_ROUND_TIME;
  private gameTimer!: Phaser.Time.TimerEvent;
  private reactionTimes: number[] = [];
  private lastTargetTime = 0;
  private gameOver = false;
  private comboCount = 0;
  private isPaused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private gameMode: GameMode = 'name';
  private useFactThisRound = false;

  constructor() {
    super('GameScene');
  }

  init(data: { roundTime?: number; gameMode?: GameMode }): void {
    this.roundTime = data.roundTime || DEFAULT_ROUND_TIME;
    this.gameMode = data.gameMode || 'name';
  }

  create(): void {
    this.profiles = getProfiles();
    this.score = 0;
    this.correctHits = 0;
    this.totalTaps = 0;
    this.timeLeft = this.roundTime;
    this.reactionTimes = [];
    this.gameOver = false;
    this.comboCount = 0;
    this.isPaused = false;
    this.time.paused = false;
    this.slots = [];

    const { width, height } = this.scale;

    // Dark atmospheric background
    drawDarkGradient(this);

    // Subtle ambient dots
    for (let i = 0; i < 30; i++) {
      const dot = this.add.circle(
        Math.random() * width, Math.random() * 200,
        1 + Math.random() * 1, 0xffffff, 0.03 + Math.random() * 0.04,
      );
      this.tweens.add({
        targets: dot, alpha: 0.01,
        duration: 2000 + Math.random() * 2000,
        yoyo: true, repeat: -1,
      });
    }

    // Lower BGM during gameplay
    setBGMVolume(0.12);
    addMuteButton(this, width / 2, 42);

    // === PLAY FIELD ===
    // Outer frame glow
    const fieldGlow = this.add.graphics();
    fieldGlow.fillStyle(PAL.accent, 0.03);
    fieldGlow.fillRoundedRect(15, 210, width - 30, height - 340, 30);

    // Field background — dark earth tones
    const field = this.add.graphics();
    field.fillStyle(0x2a1f0e, 1);
    field.fillRoundedRect(25, 215, width - 50, height - 350, 26);

    // Subtle earth texture pattern
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 8; col++) {
        const tx = 50 + col * 115 + (row % 2) * 55;
        const ty = 240 + row * 70;
        if (ty < height - 160) {
          const alpha = 0.02 + Math.random() * 0.03;
          field.fillStyle(0x3d2a12, alpha);
          field.fillEllipse(tx, ty, 80 + Math.random() * 30, 25 + Math.random() * 10);
        }
      }
    }

    // Bottom grass strip
    const grass = this.add.graphics();
    grass.fillStyle(PAL.grass, 0.15);
    grass.fillRoundedRect(25, height - 155, width - 50, 20, { tl: 0, tr: 0, bl: 24, br: 24 });

    // === HUD ===
    drawGlassPanel(this, 20, 12, width - 40, 80, 0.1);

    // Score
    this.add.image(56, 42, 'icon-star').setDisplaySize(30, 30).setDepth(10).setTint(PAL.gold);
    this.scoreText = this.add.text(82, 28, '0', {
      fontSize: '36px', fontFamily: FONT, fontStyle: '900', color: PAL.goldHex,
    }).setDepth(10);

    // Timer
    this.timerText = this.add.text(width - 48, 28, `${this.roundTime}`, {
      fontSize: '36px', fontFamily: FONT, fontStyle: '900', color: PAL.textHex,
    }).setOrigin(1, 0).setDepth(10);

    // Timer bar
    const barBg = this.add.graphics().setDepth(10);
    barBg.fillStyle(0x000000, 0.3);
    barBg.fillRoundedRect(40, 76, width - 80, 8, 4);
    this.timerBarFill = this.add.graphics().setDepth(10);
    this.drawTimerBar();

    // Target banner
    const banner = this.add.graphics();
    banner.fillStyle(PAL.accent, 0.9);
    banner.fillRoundedRect(60, 108, width - 120, 82, 18);
    // Banner top highlight
    banner.fillStyle(0xffffff, 0.12);
    banner.fillRoundedRect(64, 110, width - 128, 36, { tl: 16, tr: 16, bl: 0, br: 0 });

    this.add.text(width / 2, 128, 'FIND', {
      fontSize: '16px', fontFamily: FONT, fontStyle: '800',
      color: '#ffffff50', letterSpacing: 4,
    }).setOrigin(0.5).setDepth(10);

    this.targetText = this.add.text(width / 2, 160, '', {
      fontSize: '38px', fontFamily: FONT, fontStyle: '900', color: '#ffffff',
    }).setOrigin(0.5).setDepth(10);

    // Pause button (left of music button)
    const pauseBtn = this.add.text(width / 2 - 50, 30, '⏸', {
      fontSize: '28px',
    }).setDepth(100).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause());

    // Keyboard pause
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());

    // Build pause overlay (hidden)
    this.createPauseOverlay();

    this.loadAvatarTextures().then(() => {
      this.createGrid();
      this.pickNewTarget();

      const seen = localStorage.getItem('whack-tutorial-seen');
      if (!seen) {
        this.showTutorial(() => this.startTimers());
      } else {
        this.startTimers();
      }
    });
  }

  private showTutorial(onDone: () => void): void {
    const { width, height } = this.scale;
    const overlay = this.add.container(0, 0).setDepth(200);

    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.75);
    dim.fillRect(0, 0, width, height);
    overlay.add(dim);

    const blocker = this.add.zone(width / 2, height / 2, width, height).setInteractive();
    overlay.add(blocker);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 0.08);
    panel.fillRoundedRect(width / 2 - 260, height / 2 - 260, 520, 520, 28);
    panel.lineStyle(1, 0xffffff, 0.1);
    panel.strokeRoundedRect(width / 2 - 260, height / 2 - 260, 520, 520, 28);
    overlay.add(panel);

    // Title
    overlay.add(this.add.text(width / 2, height / 2 - 210, 'HOW TO PLAY', {
      fontSize: '36px', fontFamily: FONT, fontStyle: '900', color: PAL.goldHex,
    }).setOrigin(0.5));

    // Accent line
    const line = this.add.graphics();
    line.fillStyle(PAL.accent, 1);
    line.fillRoundedRect(width / 2 - 40, height / 2 - 175, 80, 4, 2);
    overlay.add(line);

    // Instructions
    const steps = [
      { icon: 'icon-target', text: 'A name appears at the top.\nFind the matching face!' },
      { icon: 'icon-checkmark', text: 'Tap the correct face to\nscore points. Be fast for bonus!' },
      { icon: 'icon-star', text: 'Wrong tap = lose points.\nGet the highest score you can!' },
    ];

    steps.forEach((step, i) => {
      const sy = height / 2 - 130 + i * 110;

      overlay.add(this.add.image(width / 2 - 190, sy + 20, step.icon)
        .setDisplaySize(36, 36).setTint(PAL.accent).setAlpha(0.7));

      overlay.add(this.add.text(width / 2 - 140, sy, step.text, {
        fontSize: '22px', fontFamily: FONT, fontStyle: '700',
        color: PAL.textHex, lineSpacing: 4,
      }));
    });

    // Got it button
    const btnContainer = this.add.container(width / 2, height / 2 + 210);
    const bw = 240, bh = 60;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillRoundedRect(-bw / 2 + 3, 4, bw, bh, bh / 2);
    btnContainer.add(shadow);

    const body = this.add.graphics();
    body.fillStyle(PAL.accent, 1);
    body.fillRoundedRect(-bw / 2, 0, bw, bh, bh / 2);
    btnContainer.add(body);

    const hl = this.add.graphics();
    hl.fillStyle(0xffffff, 0.15);
    hl.fillRoundedRect(-bw / 2 + 3, 2, bw - 6, bh * 0.45, { tl: bh / 2, tr: bh / 2, bl: 4, br: 4 });
    btnContainer.add(hl);

    btnContainer.add(this.add.text(0, bh / 2, 'GOT IT', {
      fontSize: '28px', fontFamily: FONT, fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5));

    const hz = this.add.zone(0, bh / 2, bw, bh)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.sound.play('click', { volume: 0.4 });
        localStorage.setItem('whack-tutorial-seen', 'true');
        overlay.destroy();
        onDone();
      });
    btnContainer.add(hz);

    overlay.add(btnContainer);
  }

  private createPauseOverlay(): void {
    const { width, height } = this.scale;
    this.pauseOverlay = this.add.container(0, 0).setDepth(200).setVisible(false);

    // Dim background
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.7);
    dim.fillRect(0, 0, width, height);
    this.pauseOverlay.add(dim);

    // Block clicks through overlay
    const blocker = this.add.zone(width / 2, height / 2, width, height)
      .setInteractive();
    this.pauseOverlay.add(blocker);

    // Glass panel
    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 0.08);
    panel.fillRoundedRect(width / 2 - 200, height / 2 - 180, 400, 360, 24);
    panel.lineStyle(1, 0xffffff, 0.1);
    panel.strokeRoundedRect(width / 2 - 200, height / 2 - 180, 400, 360, 24);
    this.pauseOverlay.add(panel);

    // Paused text
    const title = this.add.text(width / 2, height / 2 - 120, 'PAUSED', {
      fontSize: '48px', fontFamily: FONT, fontStyle: '900', color: PAL.textHex,
    }).setOrigin(0.5);
    this.pauseOverlay.add(title);

    // Accent line
    const line = this.add.graphics();
    line.fillStyle(PAL.accent, 1);
    line.fillRoundedRect(width / 2 - 40, height / 2 - 75, 80, 4, 2);
    this.pauseOverlay.add(line);

    // Resume button
    const resumeBtn = this.createPauseButton(width / 2, height / 2 - 20, 'RESUME', PAL.success, () => {
      this.togglePause();
    });
    this.pauseOverlay.add(resumeBtn);

    // Quit button
    const quitBtn = this.createPauseButton(width / 2, height / 2 + 80, 'QUIT', PAL.danger, () => {
      this.isPaused = false;
      this.gameOver = true;
      this.gameTimer?.destroy();
      setBGMVolume(0.3);
      this.scene.start('HomeScene');
    });
    this.pauseOverlay.add(quitBtn);
  }

  private createPauseButton(
    x: number, y: number, label: string, color: number, onClick: () => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const w = 280, h = 64;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillRoundedRect(-w / 2 + 3, 4, w, h, h / 2);
    container.add(shadow);

    const body = this.add.graphics();
    body.fillStyle(color, 1);
    body.fillRoundedRect(-w / 2, 0, w, h, h / 2);
    container.add(body);

    const hl = this.add.graphics();
    hl.fillStyle(0xffffff, 0.15);
    hl.fillRoundedRect(-w / 2 + 3, 2, w - 6, h * 0.45, { tl: h / 2, tr: h / 2, bl: 4, br: 4 });
    container.add(hl);

    const text = this.add.text(0, h / 2, label, {
      fontSize: '30px', fontFamily: FONT, fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5);
    container.add(text);

    const hz = this.add.zone(0, h / 2, w, h)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => container.setScale(1.04))
      .on('pointerout', () => container.setScale(1))
      .on('pointerdown', () => {
        this.sound.play('click', { volume: 0.4 });
        onClick();
      });
    container.add(hz);

    return container;
  }

  private togglePause(): void {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
    this.pauseOverlay.setVisible(this.isPaused);

    if (this.isPaused) {
      this.gameTimer.paused = true;
      this.time.paused = true;
      this.sound.play('click', { volume: 0.3 });
    } else {
      this.gameTimer.paused = false;
      this.time.paused = false;
    }
  }

  private drawTimerBar(): void {
    const { width } = this.scale;
    this.timerBarFill.clear();
    const pct = this.timeLeft / this.roundTime;
    const barWidth = (width - 80) * pct;
    const color = pct > 0.5 ? PAL.success : pct > 0.2 ? PAL.accent : PAL.danger;
    this.timerBarFill.fillStyle(color, 1);
    this.timerBarFill.fillRoundedRect(40, 76, barWidth, 8, 4);
  }

  private async loadAvatarTextures(): Promise<void> {
    await Promise.all(this.profiles.map((profile) =>
      new Promise<void>((resolve) => {
        const key = `game-avatar-${profile.id}`;
        if (this.textures.exists(key)) this.textures.remove(key);
        const img = new Image();
        img.onload = () => {
          if (!this.textures.exists(key)) this.textures.addImage(key, img);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = profile.avatarData || profile.photoData;
      }),
    ));
  }

  private createGrid(): void {
    const { width, height } = this.scale;
    const fieldTop = 240;
    const fieldBottom = height - 170;
    const fieldH = fieldBottom - fieldTop;

    const startX = 155;
    const spacingX = (width - 310) / (GRID_COLS - 1);
    const spacingY = fieldH / (GRID_ROWS + 0.3);
    const startY = fieldTop + spacingY * 0.8;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;

        const hole = this.add.graphics();

        // Outer glow ring
        hole.fillStyle(0x5a4220, 0.4);
        hole.fillEllipse(x, y + 6, 155, 58);

        // Dirt rim
        hole.fillStyle(0x4a3518, 1);
        hole.fillEllipse(x, y + 4, 140, 50);

        // Rim highlight (top edge catch light)
        hole.fillStyle(0x6b5030, 0.6);
        hole.fillEllipse(x, y - 2, 135, 20);

        // Hole darkness
        hole.fillStyle(0x0d0800, 0.95);
        hole.fillEllipse(x, y + 2, 120, 40);

        // Inner shadow gradient
        hole.fillStyle(0x000000, 0.3);
        hole.fillEllipse(x, y + 6, 100, 30);

        this.slots.push({
          x, y, face: null, faceMask: null,
          profile: null, isUp: false, timer: null,
        });
      }
    }
  }

  private startTimers(): void {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`${this.timeLeft}`);
        this.drawTimerBar();
        if (this.timeLeft <= 10) {
          this.timerText.setColor('#ff5c8a');
          this.tweens.add({ targets: this.timerText, scaleX: 1.15, scaleY: 1.15, duration: 80, yoyo: true });
        }
        if (this.timeLeft <= 0) this.endGame();
      },
      loop: true,
    });
    this.scheduleNextPop();
  }

  private scheduleNextPop(): void {
    const elapsed = this.roundTime - this.timeLeft;
    const delay = Math.max(350, 1100 - elapsed * 12) + Math.random() * 500;
    this.time.delayedCall(delay, () => {
      if (!this.gameOver) { this.popRandomMole(); this.scheduleNextPop(); }
    });
  }

  private popRandomMole(): void {
    const free = this.slots.filter(s => !s.isUp);
    if (!free.length) return;
    const slot = free[Math.floor(Math.random() * free.length)];
    const profile = this.profiles[Math.floor(Math.random() * this.profiles.length)];
    this.showMole(slot, profile);
  }

  private showMole(slot: MoleSlot, profile: Profile): void {
    slot.isUp = true;
    slot.profile = profile;

    const key = `game-avatar-${profile.id}`;
    if (this.textures.exists(key)) {
      // Bigger avatar — 120px for better recognition
      slot.face = this.add.image(slot.x, slot.y + 30, key)
        .setDisplaySize(120, 120).setDepth(5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.onMoleTap(slot));

      // Subtle glow behind face
      const glow = this.add.graphics().setDepth(4);
      glow.fillStyle(PAL.accent, 0.08);
      glow.fillCircle(slot.x, slot.y - 45, 65);
      slot.faceMask = glow;

      slot.face.setAlpha(0);
      this.tweens.add({
        targets: slot.face, y: slot.y - 45, alpha: 1,
        duration: 170, ease: 'Back.easeOut',
      });
    } else {
      // Fallback circle
      const hue = Math.abs(profile.name.charCodeAt(0) * 47) % 360;
      const color = Phaser.Display.Color.HSLToColor(hue / 360, 0.55, 0.5).color;

      const g = this.add.graphics().setDepth(5);
      g.fillStyle(color, 1);
      g.fillCircle(slot.x, slot.y - 45, 52);
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(slot.x - 14, slot.y - 58, 12);

      const initial = this.add.text(slot.x, slot.y - 45, profile.name[0].toUpperCase(), {
        fontSize: '42px', fontFamily: FONT, fontStyle: '900', color: '#fff',
      }).setOrigin(0.5).setDepth(6);

      const hz = this.add.zone(slot.x, slot.y - 45, 120, 120)
        .setDepth(7).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.onMoleTap(slot));

      slot.face = hz as unknown as Phaser.GameObjects.Image;
      slot.faceMask = g;
      (slot as any)._initial = initial;
      (slot as any)._hitZone = hz;
    }

    this.sound.play('pop-up', { volume: 0.12 });

    const elapsed = this.roundTime - this.timeLeft;
    slot.timer = this.time.delayedCall(
      Math.max(700, 2400 - elapsed * 25),
      () => this.hideMole(slot),
    );
  }

  private hideMole(slot: MoleSlot): void {
    if (!slot.isUp) return;
    slot.isUp = false;
    slot.profile = null;
    slot.face?.destroy(); slot.face = null;
    slot.faceMask?.destroy(); slot.faceMask = null;
    (slot as any)._initial?.destroy(); (slot as any)._initial = null;
    (slot as any)._hitZone?.destroy(); (slot as any)._hitZone = null;
    slot.timer?.destroy(); slot.timer = null;
  }

  private onMoleTap(slot: MoleSlot): void {
    if (this.gameOver || this.isPaused || !slot.isUp || !slot.profile) return;
    this.totalTaps++;
    const correct = slot.profile.id === this.targetProfile?.id;

    if (correct) {
      this.correctHits++;
      this.comboCount++;
      const rt = Date.now() - this.lastTargetTime;
      this.reactionTimes.push(rt);

      let pts = 100, label = '+100';
      if (rt < 1200) { pts += 50; label = '+150'; }
      if (this.comboCount >= 3) { pts += this.comboCount * 20; label += ` x${this.comboCount}`; }
      this.score += pts;

      const sfx = ['whack-hit', 'whack-hit2', 'whack-hit3'];
      this.sound.play(sfx[Math.floor(Math.random() * sfx.length)], { volume: 0.4 });

      showFloatingText(this, slot.x, slot.y - 100, label, '#2cb67d');

      // Success emote
      const emote = this.add.image(slot.x + 40, slot.y - 80, 'emote-stars')
        .setDisplaySize(30, 30).setDepth(20).setAlpha(0.7);
      this.tweens.add({ targets: emote, y: emote.y - 45, alpha: 0, duration: 500, onComplete: () => emote.destroy() });

      this.spawnParticles(slot.x, slot.y - 45, PAL.success);
      this.hideMole(slot);
      this.pickNewTarget();
    } else {
      this.comboCount = 0;
      this.score = Math.max(0, this.score - 25);
      this.sound.play('wrong-hit', { volume: 0.3 });
      showFloatingText(this, slot.x, slot.y - 100, '-25', '#e53170');

      if (slot.face) {
        this.tweens.add({
          targets: [slot.face, slot.faceMask, (slot as any)._initial].filter(Boolean),
          x: (t: any) => t.x - 5, duration: 35, yoyo: true, repeat: 4,
        });
      }
      this.spawnParticles(slot.x, slot.y - 45, PAL.danger);
    }
    this.scoreText.setText(`${this.score}`);
  }

  private spawnParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 8; i++) {
      const p = this.add.circle(x, y, 2 + Math.random() * 3, color, 0.7).setDepth(20);
      const angle = (Math.PI * 2 / 8) * i;
      const dist = 35 + Math.random() * 20;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 300 + Math.random() * 150, ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  private pickNewTarget(): void {
    const avail = this.profiles.filter(p => p.id !== this.targetProfile?.id);
    this.targetProfile = avail[Math.floor(Math.random() * avail.length)] || this.profiles[0];

    // Decide name vs fact for this target
    if (this.gameMode === 'name') {
      this.useFactThisRound = false;
    } else if (this.gameMode === 'fact') {
      this.useFactThisRound = !!this.targetProfile.funFact;
    } else {
      this.useFactThisRound = !!this.targetProfile.funFact && Math.random() > 0.5;
    }

    const displayText = this.useFactThisRound
      ? this.targetProfile.funFact
      : this.targetProfile.name;
    this.targetText.setText(displayText);

    // Adjust font size for longer fact text
    this.targetText.setFontSize(displayText.length > 20 ? 30 : 38);

    this.lastTargetTime = Date.now();
    this.tweens.add({ targets: this.targetText, scaleX: 1.06, scaleY: 1.06, duration: 100, yoyo: true });
  }

  private endGame(): void {
    this.gameOver = true;
    this.gameTimer?.destroy();
    setBGMVolume(0.3);
    this.slots.forEach(s => this.hideMole(s));
    this.scene.start('ResultScene', {
      score: this.score,
      accuracy: this.totalTaps > 0 ? Math.round((this.correctHits / this.totalTaps) * 100) : 0,
      correctHits: this.correctHits,
      totalTaps: this.totalTaps,
      fastestReaction: this.reactionTimes.length > 0 ? Math.min(...this.reactionTimes) : 0,
      roundTime: this.roundTime,
      gameMode: this.gameMode,
    });
  }
}

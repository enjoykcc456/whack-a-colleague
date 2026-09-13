import Phaser from 'phaser';
import { type GameMode } from '../utils/ProfileStore';
import { drawDarkGradient, drawGlassPanel, createPremiumButton, PAL, FONT } from '../utils/UIHelper';
import { addMuteButton } from '../utils/MusicManager';

interface GameResults {
  score: number;
  accuracy: number;
  correctHits: number;
  totalTaps: number;
  fastestReaction: number;
  roundTime: number;
  gameMode: GameMode;
}

const LEADERBOARD_KEY = 'whack-leaderboard';
interface LeaderboardEntry { name: string; score: number; date: string; duration: number; }

export class ResultScene extends Phaser.Scene {
  private results!: GameResults;

  constructor() {
    super('ResultScene');
  }

  init(data: GameResults): void {
    this.results = data;
  }

  create(): void {
    const { width, height } = this.scale;

    drawDarkGradient(this);

    // Ambient dots
    for (let i = 0; i < 50; i++) {
      const dot = this.add.circle(
        Math.random() * width, Math.random() * height,
        1 + Math.random() * 1.5, 0xffffff, 0.04 + Math.random() * 0.06,
      );
      this.tweens.add({
        targets: dot, alpha: 0.01, duration: 1500 + Math.random() * 2000,
        yoyo: true, repeat: -1,
      });
    }

    addMuteButton(this);

    // Trophy icon with subtle glow
    const glow = this.add.graphics();
    glow.fillStyle(PAL.gold, 0.08);
    glow.fillCircle(width / 2, 110, 70);
    this.add.image(width / 2, 110, 'icon-trophy').setDisplaySize(80, 80).setTint(PAL.gold);

    // Animated score
    const scoreDisplay = this.add.text(width / 2, 240, '0', {
      fontSize: '90px', fontFamily: FONT, fontStyle: '900', color: PAL.textHex,
    }).setOrigin(0.5);

    this.add.text(width / 2, 300, 'POINTS', {
      fontSize: '20px', fontFamily: FONT, fontStyle: '800',
      color: PAL.textMutedHex, letterSpacing: 6,
    }).setOrigin(0.5);

    this.tweens.addCounter({
      from: 0, to: this.results.score, duration: 1000, ease: 'Power2',
      onUpdate: (tw) => scoreDisplay.setText(Math.floor(tw.getValue() ?? 0).toString()),
    });

    // Rating
    const rating = this.getRating();
    this.add.text(width / 2, 350, rating.text, {
      fontSize: '28px', fontFamily: FONT, fontStyle: '900', color: rating.color,
    }).setOrigin(0.5);

    // Accent bar
    const bar = this.add.graphics();
    bar.fillStyle(PAL.accent, 1);
    bar.fillRoundedRect(width / 2 - 60, 390, 120, 4, 2);

    // Stats cards
    const cardY = 420;
    const cardW = 230;
    const gap = 20;
    const totalW = cardW * 3 + gap * 2;
    const sx = (width - totalW) / 2;

    const stats = [
      { label: 'ACCURACY', value: `${this.results.accuracy}%`, icon: 'icon-target', color: '#2cb67d' },
      { label: 'CORRECT', value: `${this.results.correctHits}/${this.results.totalTaps}`, icon: 'icon-checkmark', color: PAL.goldHex },
      { label: 'FASTEST', value: this.results.fastestReaction > 0 ? `${this.results.fastestReaction}ms` : '—', icon: 'icon-star', color: '#ff8906' },
    ];

    stats.forEach((stat, i) => {
      const cx = sx + i * (cardW + gap) + cardW / 2;

      drawGlassPanel(this, cx - cardW / 2, cardY, cardW, 120, 0.06);

      this.add.image(cx, cardY + 26, stat.icon).setDisplaySize(22, 22).setAlpha(0.4);
      this.add.text(cx, cardY + 62, stat.value, {
        fontSize: '30px', fontFamily: FONT, fontStyle: '900', color: stat.color,
      }).setOrigin(0.5);
      this.add.text(cx, cardY + 98, stat.label, {
        fontSize: '14px', fontFamily: FONT, fontStyle: '800',
        color: '#94a1b260', letterSpacing: 2,
      }).setOrigin(0.5);
    });

    // Leaderboard
    this.saveScore();
    this.showLeaderboard(590);

    // Buttons
    createPremiumButton(this, width / 2, height - 240, 380, 70, 'PLAY AGAIN', PAL.accent, () => {
      this.scene.start('GameScene', { roundTime: this.results.roundTime, gameMode: this.results.gameMode });
    });
    createPremiumButton(this, width / 2, height - 140, 380, 70, 'HOME', PAL.surfaceLight, () => {
      this.scene.start('HomeScene');
    });

    // Celebration particles for high scores
    if (this.results.score >= 500) {
      this.sound.play('switch', { volume: 0.3 });
      this.time.addEvent({
        delay: 150, repeat: 20,
        callback: () => {
          const px = Math.random() * width;
          const colors = [PAL.gold, PAL.accent, PAL.success, PAL.danger, 0x6c5ce7];
          for (let j = 0; j < 3; j++) {
            const c = colors[Math.floor(Math.random() * colors.length)];
            const dot = this.add.circle(
              px + (Math.random() - 0.5) * 60, height,
              3 + Math.random() * 2, c, 0.7,
            );
            this.tweens.add({
              targets: dot,
              y: Math.random() * height * 0.3,
              x: dot.x + (Math.random() - 0.5) * 100,
              alpha: 0, duration: 1200 + Math.random() * 600,
              ease: 'Power2', onComplete: () => dot.destroy(),
            });
          }
        },
      });
    }
  }

  private getRating(): { text: string; color: string } {
    const s = this.results.score;
    if (s >= 1500) return { text: 'LEGENDARY', color: PAL.goldHex };
    if (s >= 1000) return { text: 'AMAZING', color: '#ff8906' };
    if (s >= 500) return { text: 'GREAT JOB', color: '#2cb67d' };
    if (s >= 200) return { text: 'GOOD START', color: '#5b86e5' };
    return { text: 'KEEP GOING', color: PAL.textMutedHex };
  }

  private saveScore(): void {
    const entries = this.getLeaderboard();
    entries.push({
      name: 'Player',
      score: this.results.score,
      date: new Date().toLocaleDateString(),
      duration: this.results.roundTime,
    });
    entries.sort((a, b) => b.score - a.score);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 30)));
  }

  private getLeaderboard(): LeaderboardEntry[] {
    try { return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]'); }
    catch { return []; }
  }

  private showLeaderboard(startY: number): void {
    const { width } = this.scale;
    const allEntries = this.getLeaderboard();
    const duration = this.results.roundTime;

    // Filter by current duration
    const entries = allEntries.filter(e => (e.duration || 60) === duration);

    // Duration tabs
    const durations = [30, 60, 90];
    const tabW = 70, tabGap = 10;
    const tabTotalW = tabW * durations.length + tabGap * (durations.length - 1);
    const tabStartX = width / 2 - tabTotalW / 2 + tabW / 2;

    drawGlassPanel(this, 60, startY - 5, width - 120, 44, 0.04);

    this.add.image(width / 2 - 110, startY + 17, 'icon-trophy').setDisplaySize(18, 18).setTint(PAL.gold).setAlpha(0.6);
    this.add.text(width / 2 - 60, startY + 17, 'HIGH SCORES', {
      fontSize: '16px', fontFamily: FONT, fontStyle: '800',
      color: PAL.goldHex, letterSpacing: 2,
    }).setOrigin(0, 0.5);

    durations.forEach((d, i) => {
      const tx = tabStartX + i * (tabW + tabGap) + 200;
      const isActive = d === duration;

      const tabBg = this.add.graphics();
      if (isActive) {
        tabBg.fillStyle(PAL.accent, 0.8);
      } else {
        tabBg.fillStyle(0xffffff, 0.05);
      }
      tabBg.fillRoundedRect(tx - tabW / 2, startY + 2, tabW, 28, 14);

      this.add.text(tx, startY + 16, `${d}s`, {
        fontSize: '15px', fontFamily: FONT, fontStyle: '800',
        color: isActive ? '#ffffff' : PAL.textMutedHex,
      }).setOrigin(0.5);
    });

    const medals = ['1st', '2nd', '3rd', '4th', '5th'];
    const medalColors = ['#f9c74f', '#c0c0c0', '#cd7f32', PAL.textMutedHex, PAL.textMutedHex];

    if (entries.length === 0) {
      this.add.text(width / 2, startY + 70, 'No scores for this duration yet', {
        fontSize: '18px', fontFamily: FONT, fontStyle: '700', color: '#94a1b240',
      }).setOrigin(0.5);
      return;
    }

    entries.slice(0, 5).forEach((entry, i) => {
      const y = startY + 55 + i * 44;
      const isCurrent = entry.score === this.results.score && entry.date === new Date().toLocaleDateString();

      if (isCurrent && i === entries.findIndex(e => e.score === this.results.score)) {
        const hl = this.add.graphics();
        hl.fillStyle(PAL.accent, 0.06);
        hl.fillRoundedRect(70, y - 6, width - 140, 36, 8);
      }

      this.add.text(90, y, medals[i], {
        fontSize: '18px', fontFamily: FONT, fontStyle: '800', color: medalColors[i],
      });

      this.add.text(150, y, `${entry.score}`, {
        fontSize: '22px', fontFamily: FONT, fontStyle: isCurrent ? '900' : '700',
        color: isCurrent ? PAL.textHex : PAL.textMutedHex,
      });

      this.add.text(width - 90, y + 2, entry.date, {
        fontSize: '16px', fontFamily: FONT, color: '#94a1b240',
      }).setOrigin(1, 0);
    });
  }
}

import Phaser from 'phaser';
import { drawDarkGradient, drawGlassPanel, createPremiumButton, PAL, FONT } from '../utils/UIHelper';
import { addMuteButton } from '../utils/MusicManager';

const LEADERBOARD_KEY = 'whack-leaderboard';
const DURATIONS = [30, 60, 90];

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  duration: number;
}

export class LeaderboardScene extends Phaser.Scene {
  private selectedDuration = 60;
  private listContainer!: Phaser.GameObjects.Container;
  private tabButtons: { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; duration: number }[] = [];

  constructor() {
    super('LeaderboardScene');
  }

  create(): void {
    const { width, height } = this.scale;

    drawDarkGradient(this);

    // Ambient dots
    for (let i = 0; i < 40; i++) {
      const dot = this.add.circle(
        Math.random() * width, Math.random() * height,
        1 + Math.random() * 1, 0xffffff, 0.03 + Math.random() * 0.04,
      );
      this.tweens.add({
        targets: dot, alpha: 0.01,
        duration: 1500 + Math.random() * 2000,
        yoyo: true, repeat: -1,
      });
    }

    addMuteButton(this);

    // Header
    const header = this.add.graphics();
    header.fillStyle(0xffffff, 0.05);
    header.fillRect(0, 0, width, 90);
    header.lineStyle(1, 0xffffff, 0.06);
    header.lineBetween(0, 90, width, 90);

    this.add.text(width / 2, 45, 'LEADERBOARD', {
      fontSize: '34px', fontFamily: FONT, fontStyle: '900',
      color: PAL.textHex,
    }).setOrigin(0.5);

    // Duration tabs
    this.tabButtons = [];
    const tabW = 120, tabGap = 16;
    const totalTabW = tabW * DURATIONS.length + tabGap * (DURATIONS.length - 1);
    const tabStartX = width / 2 - totalTabW / 2 + tabW / 2;

    DURATIONS.forEach((d, i) => {
      const tx = tabStartX + i * (tabW + tabGap);

      const bg = this.add.graphics();
      const text = this.add.text(tx, 138, `${d}s`, {
        fontSize: '24px', fontFamily: FONT, fontStyle: '800', color: '#ffffff',
      }).setOrigin(0.5);

      this.add.zone(tx, 138, tabW, 44)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.sound.play('click', { volume: 0.3 });
          this.selectedDuration = d;
          this.updateTabs();
          this.refreshList();
        });

      this.tabButtons.push({ bg, text, duration: d });
    });
    this.updateTabs();

    // Score list
    this.listContainer = this.add.container(0, 180);
    this.refreshList();

    // Back button
    createPremiumButton(this, width / 2, height - 140, 380, 70, 'BACK', PAL.surfaceLight, () => {
      this.scene.start('HomeScene');
    });
  }

  private updateTabs(): void {
    const tabW = 120;
    const tabGap = 16;
    const totalTabW = tabW * DURATIONS.length + tabGap * (DURATIONS.length - 1);
    const tabStartX = this.scale.width / 2 - totalTabW / 2 + tabW / 2;

    this.tabButtons.forEach(({ bg, text, duration }, i) => {
      const tx = tabStartX + i * (tabW + tabGap);
      bg.clear();
      if (duration === this.selectedDuration) {
        bg.fillStyle(PAL.accent, 1);
        bg.fillRoundedRect(tx - tabW / 2, 118, tabW, 40, 20);
        text.setColor('#ffffff');
      } else {
        bg.fillStyle(0xffffff, 0.06);
        bg.fillRoundedRect(tx - tabW / 2, 118, tabW, 40, 20);
        bg.lineStyle(1, 0xffffff, 0.08);
        bg.strokeRoundedRect(tx - tabW / 2, 118, tabW, 40, 20);
        text.setColor(PAL.textMutedHex);
      }
    });
  }

  private refreshList(): void {
    this.listContainer.removeAll(true);
    const { width } = this.scale;

    const allEntries = this.getLeaderboard();
    const entries = allEntries
      .filter(e => (e.duration || 60) === this.selectedDuration)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (entries.length === 0) {
      this.listContainer.add(this.add.text(width / 2, 80, 'No scores yet for this duration', {
        fontSize: '22px', fontFamily: FONT, fontStyle: '700', color: '#94a1b240',
      }).setOrigin(0.5));
      return;
    }

    const medals = ['1st', '2nd', '3rd'];
    const medalColors = ['#f9c74f', '#c0c0c0', '#cd7f32'];

    entries.forEach((entry, i) => {
      const y = 10 + i * 70;

      // Row card
      const row = this.add.graphics();
      if (i < 3) {
        row.fillStyle(Phaser.Display.Color.HexStringToColor(medalColors[i]).color, 0.04);
      } else {
        row.fillStyle(0xffffff, 0.03);
      }
      row.fillRoundedRect(60, y, width - 120, 58, 14);
      this.listContainer.add(row);

      // Rank
      const rankText = i < 3 ? medals[i] : `${i + 1}th`;
      this.listContainer.add(this.add.text(95, y + 18, rankText, {
        fontSize: '22px', fontFamily: FONT, fontStyle: '800',
        color: i < 3 ? medalColors[i] : PAL.textMutedHex,
      }));

      // Score
      this.listContainer.add(this.add.text(190, y + 16, `${entry.score}`, {
        fontSize: '26px', fontFamily: FONT, fontStyle: '900',
        color: i === 0 ? PAL.goldHex : PAL.textHex,
      }));

      // Date
      this.listContainer.add(this.add.text(width - 80, y + 22, entry.date, {
        fontSize: '16px', fontFamily: FONT, fontStyle: '700',
        color: '#94a1b240',
      }).setOrigin(1, 0));
    });
  }

  private getLeaderboard(): LeaderboardEntry[] {
    try { return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]'); }
    catch { return []; }
  }
}

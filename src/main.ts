import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { HomeScene } from './scenes/HomeScene';
import { ProfileScene } from './scenes/ProfileScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 1440,
  parent: 'game-container',
  backgroundColor: '#0f0e17',
  antialias: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    max: { width: 960, height: 1440 },
  },
  scene: [PreloadScene, HomeScene, ProfileScene, GameScene, ResultScene, LeaderboardScene],
};

new Phaser.Game(config);

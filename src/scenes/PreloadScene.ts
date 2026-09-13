import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    const { width, height } = this.scale;

    // Loading bar
    const barBg = this.add.graphics();
    barBg.fillStyle(0x333333, 1);
    barBg.fillRoundedRect(width * 0.2, height / 2 - 15, width * 0.6, 30, 10);

    const bar = this.add.graphics();
    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0x4ecca3, 1);
      bar.fillRoundedRect(width * 0.2 + 4, height / 2 - 11, (width * 0.6 - 8) * value, 22, 8);
    });

    this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#ffffff',
    }).setOrigin(0.5);

    // === UI BUTTONS ===
    const uiBase = 'assets/images/ui-pack/PNG';
    this.load.image('btn-green', `${uiBase}/Green/Double/button_rectangle_depth_gloss.png`);
    this.load.image('btn-red', `${uiBase}/Red/Double/button_rectangle_depth_gloss.png`);
    this.load.image('btn-blue', `${uiBase}/Blue/Double/button_rectangle_depth_gloss.png`);
    this.load.image('btn-grey', `${uiBase}/Grey/Double/button_rectangle_depth_gloss.png`);
    this.load.image('btn-green-flat', `${uiBase}/Green/Double/button_rectangle_depth_flat.png`);
    this.load.image('btn-red-flat', `${uiBase}/Red/Double/button_rectangle_depth_flat.png`);

    // === ANIMALS ===
    const animalBase = 'assets/images/animal-pack/PNG/Round';
    this.load.image('animal-elephant', `${animalBase}/elephant.png`);
    this.load.image('animal-giraffe', `${animalBase}/giraffe.png`);
    this.load.image('animal-hippo', `${animalBase}/hippo.png`);
    this.load.image('animal-monkey', `${animalBase}/monkey.png`);
    this.load.image('animal-panda', `${animalBase}/panda.png`);
    this.load.image('animal-parrot', `${animalBase}/parrot.png`);
    this.load.image('animal-penguin', `${animalBase}/penguin.png`);
    this.load.image('animal-pig', `${animalBase}/pig.png`);
    this.load.image('animal-rabbit', `${animalBase}/rabbit.png`);
    this.load.image('animal-snake', `${animalBase}/snake.png`);

    // === BACKGROUND ===
    const bgBase = 'assets/images/background-elements/PNG';
    this.load.image('cloud1', `${bgBase}/cloud1.png`);
    this.load.image('cloud2', `${bgBase}/cloud2.png`);
    this.load.image('cloud3', `${bgBase}/cloud3.png`);
    this.load.image('cloud4', `${bgBase}/cloud4.png`);
    this.load.image('cloud5', `${bgBase}/cloud5.png`);
    this.load.image('grass1', `${bgBase}/grass1.png`);
    this.load.image('grass2', `${bgBase}/grass2.png`);
    this.load.image('sun', `${bgBase}/sun.png`);
    this.load.image('fence', `${bgBase}/fence.png`);

    // === EMOTES (Vector Style 1 — clean look) ===
    const emoteBase = 'assets/images/emotes-pack/PNG/Vector/Style 1';
    this.load.image('emote-happy', `${emoteBase}/emote_faceHappy.png`);
    this.load.image('emote-angry', `${emoteBase}/emote_faceAngry.png`);
    this.load.image('emote-heart', `${emoteBase}/emote_heart.png`);
    this.load.image('emote-stars', `${emoteBase}/emote_stars.png`);
    this.load.image('emote-exclamation', `${emoteBase}/emote_exclamation.png`);
    this.load.image('emote-question', `${emoteBase}/emote_question.png`);
    this.load.image('emote-laugh', `${emoteBase}/emote_laugh.png`);

    // === GAME ICONS (White 2x) ===
    const iconBase = 'assets/images/game-icons/PNG/White/2x';
    this.load.image('icon-star', `${iconBase}/star.png`);
    this.load.image('icon-trophy', `${iconBase}/trophy.png`);
    this.load.image('icon-target', `${iconBase}/target.png`);
    this.load.image('icon-home', `${iconBase}/home.png`);
    this.load.image('icon-checkmark', `${iconBase}/checkmark.png`);
    this.load.image('icon-music-on', `${iconBase}/musicOn.png`);
    this.load.image('icon-music-off', `${iconBase}/musicOff.png`);

    // === AUDIO ===
    const impactBase = 'assets/audio/impact-sounds/Audio';
    this.load.audio('whack-hit', [
      `${impactBase}/impactSoft_heavy_000.ogg`,
    ]);
    this.load.audio('whack-hit2', [
      `${impactBase}/impactSoft_heavy_001.ogg`,
    ]);
    this.load.audio('whack-hit3', [
      `${impactBase}/impactSoft_heavy_002.ogg`,
    ]);
    this.load.audio('wrong-hit', [
      `${impactBase}/impactGeneric_light_000.ogg`,
    ]);
    this.load.audio('pop-up', [
      `${impactBase}/impactPlank_medium_000.ogg`,
    ]);

    const uiAudioBase = 'assets/audio/ui-audio/Audio';
    this.load.audio('click', [`${uiAudioBase}/click1.ogg`]);
    this.load.audio('click2', [`${uiAudioBase}/click3.ogg`]);
    this.load.audio('rollover', [`${uiAudioBase}/rollover1.ogg`]);
    this.load.audio('switch', [`${uiAudioBase}/switch1.ogg`]);

    // === BGM ===
    this.load.audio('bgm', ['assets/audio/bgm.mp3']);
  }

  create(): void {
    this.scene.start('HomeScene');
  }
}

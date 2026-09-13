import Phaser from 'phaser';
import { getProfiles, saveProfiles, generateId, type Profile } from '../utils/ProfileStore';
import { cropToCircle, addCuteOverlay, getRandomOverlay } from '../utils/ImageUtils';
import { drawDarkGradient, drawGlassPanel, createPremiumButton, PAL, FONT } from '../utils/UIHelper';
import { addMuteButton } from '../utils/MusicManager';

export class ProfileScene extends Phaser.Scene {
  private profileList!: Phaser.GameObjects.Container;
  private formContainer!: HTMLDivElement;
  private cameraModal: HTMLDivElement | null = null;
  private cameraStream: MediaStream | null = null;
  private fileInput!: HTMLInputElement;
  private nameInput!: HTMLInputElement;
  private factInput!: HTMLInputElement;
  private uploadLabel!: HTMLLabelElement;
  private uploadSpan!: HTMLSpanElement;
  private scrollY = 0;
  private maxScroll = 0;

  constructor() {
    super('ProfileScene');
  }

  create(): void {
    const { width, height } = this.scale;

    drawDarkGradient(this);

    // Subtle pattern dots
    for (let i = 0; i < 40; i++) {
      this.add.circle(
        Math.random() * width, Math.random() * height,
        1, 0xffffff, 0.03,
      );
    }

    // Floating animal decorations
    const animalKeys = [
      'animal-rabbit', 'animal-panda', 'animal-penguin',
      'animal-monkey', 'animal-pig', 'animal-elephant',
      'animal-giraffe', 'animal-parrot',
    ];
    animalKeys.forEach((key, i) => {
      const startX = 60 + Math.random() * (width - 120);
      const startY = 200 + Math.random() * (height - 500);
      const size = 55 + Math.random() * 30;
      const animal = this.add.image(startX, startY, key)
        .setDisplaySize(size, size * 0.85)
        .setAlpha(0.12 + Math.random() * 0.06);

      // Gentle floating drift
      this.tweens.add({
        targets: animal,
        x: animal.x + 20 + Math.random() * 30,
        y: animal.y - 15 + Math.random() * 30,
        angle: -3 + Math.random() * 6,
        duration: 4000 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 400,
      });
    });

    addMuteButton(this);

    // Header bar
    const header = this.add.graphics();
    header.fillStyle(0xffffff, 0.05);
    header.fillRect(0, 0, width, 90);
    header.lineStyle(1, 0xffffff, 0.06);
    header.lineBetween(0, 90, width, 90);

    this.add.text(width / 2, 45, 'SETUP PROFILES', {
      fontSize: '34px', fontFamily: FONT, fontStyle: '900',
      color: PAL.textHex,
    }).setOrigin(0.5);

    this.createHTMLForm();

    this.profileList = this.add.container(0, 450);
    this.refreshProfileList();

    createPremiumButton(this, width / 2, height - 140, 380, 70, 'BACK', PAL.surfaceLight, () => {
      this.cleanupHTML();
      this.scene.start('HomeScene');
    });

    this.events.on('shutdown', () => this.cleanupHTML());

    this.input.on('wheel', (_p: any, _g: any, _dx: number, dy: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.5, 0, this.maxScroll);
      this.profileList.y = 450 - this.scrollY;
    });
  }

  private repositionForm(): void {
    if (!this.formContainer) return;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const scaleY = rect.height / this.scale.height;
    const scaleX = rect.width / this.scale.width;
    const s = Math.min(scaleX, scaleY);

    this.formContainer.style.top = `${rect.top + 120 * scaleY}px`;
    this.formContainer.style.left = `${rect.left + rect.width / 2}px`;

    const inputW = Math.min(260, rect.width * 0.55);
    this.formContainer.querySelectorAll<HTMLElement>('input, label, button').forEach(el => {
      el.style.width = `${inputW}px`;
      el.style.fontSize = `${Math.max(12, 16 * s)}px`;
      el.style.padding = `${Math.max(8, 14 * s)}px ${Math.max(12, 20 * s)}px`;
    });
  }

  private createHTMLForm(): void {
    this.formContainer = document.createElement('div');
    this.formContainer.style.cssText = `
      position: absolute;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      z-index: 10;
    `;

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Colleague name';
    this.nameInput.maxLength = 20;
    this.nameInput.style.cssText = `
      padding: 14px 20px;
      font-size: 16px;
      font-family: 'Nunito', sans-serif;
      font-weight: 700;
      border-radius: 16px;
      border: 2px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.06);
      color: #fffffe;
      width: 260px;
      text-align: center;
      outline: none;
      transition: all 0.2s;
      letter-spacing: 0.5px;
    `;
    this.nameInput.addEventListener('focus', () => {
      this.nameInput.style.borderColor = '#ff8906';
      this.nameInput.style.background = 'rgba(255,137,6,0.08)';
    });
    this.nameInput.addEventListener('blur', () => {
      this.nameInput.style.borderColor = 'rgba(255,255,255,0.1)';
      this.nameInput.style.background = 'rgba(255,255,255,0.06)';
    });

    this.factInput = document.createElement('input');
    this.factInput.type = 'text';
    this.factInput.placeholder = 'Fun fact (e.g. "Loves hiking")';
    this.factInput.maxLength = 40;
    this.factInput.style.cssText = `
      padding: 14px 20px;
      font-size: 16px;
      font-family: 'Nunito', sans-serif;
      font-weight: 700;
      border-radius: 16px;
      border: 2px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.06);
      color: #fffffe;
      width: 260px;
      text-align: center;
      outline: none;
      transition: all 0.2s;
      letter-spacing: 0.5px;
    `;
    this.factInput.addEventListener('focus', () => {
      this.factInput.style.borderColor = '#ff8906';
      this.factInput.style.background = 'rgba(255,137,6,0.08)';
    });
    this.factInput.addEventListener('blur', () => {
      this.factInput.style.borderColor = 'rgba(255,255,255,0.1)';
      this.factInput.style.background = 'rgba(255,255,255,0.06)';
    });

    // Photo buttons row
    const photoRow = document.createElement('div');
    photoRow.style.cssText = `
      display: flex;
      gap: 10px;
      width: 260px;
    `;

    const photoBtnStyle = `
      flex: 1;
      padding: 12px 8px;
      font-size: 14px;
      font-family: 'Nunito', sans-serif;
      font-weight: 700;
      border-radius: 14px;
      border: 2px dashed rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      color: rgba(255,255,255,0.5);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      box-sizing: border-box;
    `;

    // Upload photo button
    this.uploadLabel = document.createElement('label');
    const uploadLabel = this.uploadLabel;
    uploadLabel.style.cssText = photoBtnStyle;
    this.uploadSpan = document.createElement('span');
    this.uploadSpan.textContent = '📁 Upload';
    uploadLabel.appendChild(this.uploadSpan);
    uploadLabel.addEventListener('mouseenter', () => {
      uploadLabel.style.borderColor = 'rgba(255,137,6,0.4)';
      uploadLabel.style.color = '#ff8906';
    });
    uploadLabel.addEventListener('mouseleave', () => {
      if (!this.fileInput.files?.length) {
        uploadLabel.style.borderColor = 'rgba(255,255,255,0.12)';
        uploadLabel.style.color = 'rgba(255,255,255,0.5)';
      }
    });

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.style.display = 'none';

    const onFileSelected = (source: 'upload' | 'camera') => {
      if (this.fileInput.files?.length) {
        const name = source === 'camera' ? 'Photo taken' : this.fileInput.files[0].name.slice(0, 15);
        this.uploadSpan.textContent = `✓ ${name}`;
        uploadLabel.style.borderColor = '#2cb67d';
        uploadLabel.style.color = '#2cb67d';
        uploadLabel.style.borderStyle = 'solid';
      }
    };

    this.fileInput.addEventListener('change', () => onFileSelected('upload'));
    uploadLabel.appendChild(this.fileInput);

    // Camera button — opens webcam modal
    const cameraBtn = document.createElement('button');
    cameraBtn.style.cssText = photoBtnStyle + 'border: 2px dashed rgba(255,255,255,0.12);';
    cameraBtn.textContent = '📷 Camera';
    cameraBtn.addEventListener('mouseenter', () => {
      cameraBtn.style.borderColor = 'rgba(255,137,6,0.4)';
      cameraBtn.style.color = '#ff8906';
    });
    cameraBtn.addEventListener('mouseleave', () => {
      if (!this.fileInput.files?.length) {
        cameraBtn.style.borderColor = 'rgba(255,255,255,0.12)';
        cameraBtn.style.color = 'rgba(255,255,255,0.5)';
      }
    });
    cameraBtn.addEventListener('click', () => {
      this.openCameraModal(uploadLabel, cameraBtn, onFileSelected);
    });

    photoRow.appendChild(uploadLabel);
    photoRow.appendChild(cameraBtn);

    const addBtn = document.createElement('button');
    addBtn.textContent = 'ADD PROFILE';
    addBtn.style.cssText = `
      padding: 14px 24px;
      font-size: 16px;
      font-family: 'Nunito', sans-serif;
      font-weight: 800;
      letter-spacing: 1px;
      border-radius: 16px;
      border: none;
      background: #2cb67d;
      color: #fff;
      cursor: pointer;
      width: 260px;
      transition: all 0.15s;
      box-shadow: 0 4px 16px rgba(44,182,125,0.25);
    `;
    addBtn.addEventListener('mouseenter', () => { addBtn.style.transform = 'scale(1.03)'; });
    addBtn.addEventListener('mouseleave', () => { addBtn.style.transform = 'scale(1)'; });
    addBtn.addEventListener('mousedown', () => { addBtn.style.transform = 'scale(0.97)'; });
    addBtn.addEventListener('mouseup', () => { addBtn.style.transform = 'scale(1)'; });
    addBtn.addEventListener('click', () => {
      this.handleAddProfile();
      this.uploadSpan.textContent = '📁 Upload';
      uploadLabel.style.borderColor = 'rgba(255,255,255,0.12)';
      uploadLabel.style.color = 'rgba(255,255,255,0.5)';
      uploadLabel.style.borderStyle = 'dashed';
      cameraBtn.textContent = '📷 Camera';
      cameraBtn.style.borderColor = 'rgba(255,255,255,0.12)';
      cameraBtn.style.color = 'rgba(255,255,255,0.5)';
      cameraBtn.style.borderStyle = 'dashed';
    });

    this.formContainer.appendChild(this.nameInput);
    this.formContainer.appendChild(this.factInput);
    this.formContainer.appendChild(photoRow);
    this.formContainer.appendChild(addBtn);
    document.body.appendChild(this.formContainer);

    this.repositionForm();
    this._resizeHandler = () => this.repositionForm();
    window.addEventListener('resize', this._resizeHandler);
    this.scale.on('resize', this._resizeHandler);
  }

  private _resizeHandler: (() => void) | null = null;

  private async handleAddProfile(): Promise<void> {
    const name = this.nameInput.value.trim();
    if (!name) return;
    const file = this.fileInput.files?.[0];
    if (!file) return;

    const existing = getProfiles();
    if (existing.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      this.nameInput.style.borderColor = '#e53170';
      this.nameInput.placeholder = 'Name already exists!';
      this.nameInput.value = '';
      setTimeout(() => {
        this.nameInput.style.borderColor = 'rgba(255,255,255,0.1)';
        this.nameInput.placeholder = 'Colleague name';
      }, 2000);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const photoData = e.target?.result as string;
      const circleData = await cropToCircle(photoData);
      const overlay = getRandomOverlay();
      const avatarData = await addCuteOverlay(circleData, overlay);
      const funFact = this.factInput.value.trim();
      const profile: Profile = { id: generateId(), name, funFact, photoData: circleData, avatarData };
      const profiles = getProfiles();
      profiles.push(profile);
      saveProfiles(profiles);
      this.nameInput.value = '';
      this.factInput.value = '';
      this.resetFileInput();
      this.refreshProfileList();
    };
    reader.readAsDataURL(file);
  }

  private refreshProfileList(): void {
    this.profileList.removeAll(true);
    const profiles = getProfiles();
    const { width } = this.scale;

    if (profiles.length === 0) {
      this.profileList.add(this.add.text(width / 2, 30, 'No profiles yet\nAdd at least 3 to play', {
        fontSize: '24px', color: '#94a1b250', fontFamily: FONT, fontStyle: '700', align: 'center',
      }).setOrigin(0.5));
      return;
    }

    const countColor = profiles.length >= 3 ? '#2cb67d' : '#e53170';
    this.profileList.add(this.add.text(width / 2, 0, `${profiles.length} colleague${profiles.length !== 1 ? 's' : ''}`, {
      fontSize: '22px', color: countColor, fontFamily: FONT, fontStyle: '700',
    }).setOrigin(0.5));

    profiles.forEach((profile, i) => {
      const y = 40 + i * 95;

      // Row card
      const row = this.add.graphics();
      row.fillStyle(0xffffff, 0.04);
      row.fillRoundedRect(60, y, width - 120, 80, 16);
      this.profileList.add(row);

      if (profile.avatarData) {
        const key = `avatar-${profile.id}`;
        if (this.textures.exists(key)) this.textures.remove(key);
        const img = new Image();
        img.onload = () => {
          if (this.textures.exists(key)) this.textures.remove(key);
          this.textures.addImage(key, img);
          this.profileList.add(this.add.image(130, y + 40, key).setDisplaySize(54, 54));
        };
        img.src = profile.avatarData;
      }

      this.profileList.add(this.add.text(175, y + 15, profile.name, {
        fontSize: '26px', color: PAL.textHex, fontFamily: FONT, fontStyle: '700',
      }));

      if (profile.funFact) {
        this.profileList.add(this.add.text(175, y + 46, profile.funFact, {
          fontSize: '16px', color: PAL.textMutedHex, fontFamily: FONT, fontStyle: '700',
        }));
      }

      const del = this.add.text(width - 140, y + 28, 'Remove', {
        fontSize: '18px', color: '#e5317080', fontFamily: FONT, fontStyle: '700',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
        .on('pointerover', () => del.setColor('#e53170'))
        .on('pointerout', () => del.setColor('#e5317080'))
        .on('pointerdown', () => {
          saveProfiles(getProfiles().filter(p => p.id !== profile.id));
          this.refreshProfileList();
        });
      this.profileList.add(del);
    });

    this.maxScroll = Math.max(0, profiles.length * 95 - 400);
  }

  private resetFileInput(): void {
    const oldInput = this.fileInput;
    const newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.accept = 'image/*';
    newInput.style.display = 'none';
    newInput.addEventListener('change', () => {
      if (newInput.files?.length) {
        this.uploadSpan.textContent = `✓ ${newInput.files[0].name.slice(0, 15)}`;
        this.uploadLabel.style.borderColor = '#2cb67d';
        this.uploadLabel.style.color = '#2cb67d';
        this.uploadLabel.style.borderStyle = 'solid';
      }
    });
    this.fileInput = newInput;
    oldInput.replaceWith(newInput);
  }

  private openCameraModal(
    uploadLabel: HTMLElement,
    cameraBtn: HTMLElement,
    onFileSelected: (source: 'upload' | 'camera') => void,
  ): void {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.85);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px;
    `;
    this.cameraModal = modal;

    const video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.style.cssText = `
      width: 300px; height: 300px;
      object-fit: cover;
      border-radius: 50%;
      border: 3px solid #ff8906;
    `;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 12px;';

    const snapBtn = document.createElement('button');
    snapBtn.textContent = '📸 Snap';
    snapBtn.style.cssText = `
      padding: 12px 32px; font-size: 18px;
      font-family: 'Nunito', sans-serif; font-weight: 800;
      border-radius: 30px; border: none;
      background: #ff8906; color: #fff; cursor: pointer;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      padding: 12px 32px; font-size: 18px;
      font-family: 'Nunito', sans-serif; font-weight: 800;
      border-radius: 30px; border: 2px solid rgba(255,255,255,0.2);
      background: transparent; color: #fff; cursor: pointer;
    `;

    const closeModal = () => {
      this.cameraStream?.getTracks().forEach(t => t.stop());
      this.cameraStream = null;
      modal.remove();
      this.cameraModal = null;
    };

    cancelBtn.addEventListener('click', closeModal);

    snapBtn.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext('2d')!;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const size = Math.min(vw, vh);
      const sx = (vw - size) / 2;
      const sy = (vh - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 640, 640);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], 'camera-photo.png', { type: 'image/png' });
        const dt = new DataTransfer();
        dt.items.add(file);
        this.fileInput.files = dt.files;
        onFileSelected('camera');
        this.uploadSpan.textContent = '✓ Photo';
        uploadLabel.style.borderColor = '#2cb67d';
        uploadLabel.style.color = '#2cb67d';
        uploadLabel.style.borderStyle = 'solid';
        cameraBtn.textContent = '✓ Ready';
        cameraBtn.style.borderColor = '#2cb67d';
        cameraBtn.style.color = '#2cb67d';
        cameraBtn.style.borderStyle = 'solid';
        closeModal();
      }, 'image/png');
    });

    btnRow.appendChild(snapBtn);
    btnRow.appendChild(cancelBtn);
    modal.appendChild(video);
    modal.appendChild(btnRow);
    document.body.appendChild(modal);

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        this.cameraStream = stream;
        video.srcObject = stream;
      })
      .catch(() => {
        closeModal();
        alert('Camera not available. Please use Upload instead.');
      });
  }

  private cleanupHTML(): void {
    this.formContainer?.remove();
    this.cameraStream?.getTracks().forEach(t => t.stop());
    this.cameraModal?.remove();
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this.scale.off('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
  }
}

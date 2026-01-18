export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.isMuted = false;
    this.initialized = false;
    this.soundType = 'mechanical'; // mechanical | soft
  }

  /**
   * 初始化 AudioContext (必須由使用者互動觸發)
   */
  init() {
    if (this.initialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.error('Web Audio API 不受此瀏覽器支援', e);
    }
  }

  /**
   * 切換靜音狀態
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * 設定音效類型
   * @param {string} type - 'mechanical' | 'card' | 'electronic'
   */
  setSoundType(type) {
    if (['mechanical', 'card', 'electronic'].includes(type)) {
      this.soundType = type;
    }
  }

  /**
   * 播放滴答聲 (轉動時)
   * @param {number} speedRatio - 當前速度比例 (0~1)，用於調整音調
   */
  playTick(speedRatio = 0.5) {
    if (this.isMuted || !this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    switch (this.soundType) {
      case 'card':
        this._playCardTick(speedRatio);
        break;
      case 'electronic':
        this._playElectronicTick(speedRatio);
        break;
      case 'mechanical':
      default:
        this._playMechanicalTick(speedRatio);
        break;
    }
  }

  _playMechanicalTick(speedRatio) {
    const t = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // 建立信號鏈：振盪器 -> 濾波器 -> 增益 -> 輸出
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 使用方波產生更「實」的點擊感 (Wooden/Plastic click)
    osc.type = 'square';

    // 濾波器模擬材質感：低通濾波，快速掃頻
    filter.type = 'lowpass';
    filter.Q.value = 1; // 適度共振

    // 濾波器頻率包絡：從高頻快速降至低頻 (模擬撞擊瞬間的頻譜)
    filter.frequency.setValueAtTime(1200 + (speedRatio * 800), t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.05);

    // 振盪器頻率：固定在較低頻率，模擬物理碰撞的主體聲音
    osc.frequency.setValueAtTime(300, t);
    // 稍微降低音調以模擬減速時的沉重感 (可選)
    // osc.frequency.linearRampToValueAtTime(100, t + 0.05);

    // 音量包絡：極短促
    // 隨速度調整音量
    const volume = 0.1 + (speedRatio * 0.1);
    gainNode.gain.setValueAtTime(volume, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  _playCardTick(speedRatio) {
    const t = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 鋸齒波模擬卡片/紙張的摩擦聲
    osc.type = 'sawtooth';

    // 高通濾波讓聲音更薄更脆
    filter.type = 'highpass';
    filter.frequency.value = 800;

    // 音調較高
    const freq = 600 + (speedRatio * 400);
    osc.frequency.setValueAtTime(freq, t);
    // 快速下滑模擬撥動
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);

    const volume = 0.08 + (speedRatio * 0.05);
    gainNode.gain.setValueAtTime(volume, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.03); // 非常短促

    osc.start(t);
    osc.stop(t + 0.05);
  }

  _playElectronicTick(speedRatio) {
    const t = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 正弦波產生純淨的電子音
    osc.type = 'sine';

    // 較高的電子音調
    const freq = 1200 + (speedRatio * 800);
    osc.frequency.setValueAtTime(freq, t);

    const volume = 0.05 + (speedRatio * 0.05);
    gainNode.gain.setValueAtTime(volume, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  /**
   * 播放歡呼/勝利音效
   */
  playCheer() {
    if (this.isMuted || !this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 播放一個簡單的 "Ta-Da" 和弦 (C Major: C, E, G, C)
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const startTime = this.audioContext.currentTime;

    notes.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      osc.type = 'triangle'; // 三角波聽起來比較像遊戲音效
      osc.frequency.value = freq;

      // 稍微錯開每個音的開始時間，製造琶音效果
      const noteStart = startTime + (index * 0.05);

      gainNode.gain.setValueAtTime(0, noteStart);
      gainNode.gain.linearRampToValueAtTime(0.2, noteStart + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + 1.5); // 餘音

      osc.start(noteStart);
      osc.stop(noteStart + 1.5);
    });

    // 模擬一點 "煙火" 或 "噪音" 歡呼聲 (使用 Noise Buffer)
    this._playNoise();
  }

  _playNoise() {
    const bufferSize = this.audioContext.sampleRate * 1.5; // 1.5秒
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.audioContext.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);

    noiseGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.0);

    noise.start();
  }
}

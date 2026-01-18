export class SoundManager {
  constructor() {
    this.audioContext = null;
    this.isMuted = false;
    this.initialized = false;
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
   * 播放滴答聲 (轉動時)
   * @param {number} speedRatio - 當前速度比例 (0~1)，用於調整音調
   */
  playTick(speedRatio = 0.5) {
    if (this.isMuted || !this.audioContext) return;

    // 確保 AudioContext 在運行中
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // 建立信號鏈：振盪器 -> 濾波器 -> 增益 -> 輸出
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // 設定濾波器模擬機械共振
    filter.type = 'bandpass';
    filter.frequency.value = 1000 + (speedRatio * 500); // 隨速度改變共振頻率
    filter.Q.value = 2; // 調整共振品質因子

    // 使用三角波產生較為清脆的聲音
    osc.type = 'triangle';

    // 頻率包絡：快速下降模擬撞擊聲
    // 基礎頻率隨速度變化
    const startFreq = 800 + (speedRatio * 800);
    osc.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.08);

    // 音量包絡：短促有力
    const volume = 0.15 + (speedRatio * 0.15); // 速度越快聲音越大
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
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

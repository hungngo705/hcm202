// Sound effects utility using Web Audio API
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.initialized = true;
  }

  // Play a simple tone
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.initialized) this.init();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Button click sound
  playClick() {
    this.playTone(800, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(1000, 0.05, 'sine', 0.15), 50);
  }

  // Cell select sound
  playCellSelect() {
    this.playTone(440, 0.15, 'triangle', 0.25);
    setTimeout(() => this.playTone(660, 0.1, 'triangle', 0.2), 80);
  }

  // Correct answer sound - triumphant ascending melody
  playCorrect() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.25), i * 100);
    });
  }

  // Wrong answer sound - descending sad melody
  playWrong() {
    this.playTone(400, 0.3, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(300, 0.3, 'sawtooth', 0.2), 200);
    setTimeout(() => this.playTone(200, 0.4, 'sawtooth', 0.15), 400);
  }

  // Victory fanfare - Soviet-style triumphant melody
  playVictory() {
    // "The Internationale" inspired melody
    const melody = [
      { freq: 392, dur: 0.3 },  // G4
      { freq: 440, dur: 0.3 },  // A4
      { freq: 523, dur: 0.4 },  // C5
      { freq: 587, dur: 0.3 },  // D5
      { freq: 659, dur: 0.5 },  // E5
      { freq: 784, dur: 0.3 },  // G5
      { freq: 1047, dur: 0.8 }, // C6
    ];
    
    let time = 0;
    melody.forEach(({ freq, dur }) => {
      setTimeout(() => this.playTone(freq, dur, 'triangle', 0.3), time);
      time += dur * 800;
    });

    // Add some harmony
    setTimeout(() => {
      this.playTone(523, 0.6, 'sine', 0.2);
      this.playTone(659, 0.6, 'sine', 0.2);
      this.playTone(784, 0.6, 'sine', 0.2);
    }, time);
  }

  // Game start sound
  playStart() {
    const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 80);
    });
  }

  // Turn change sound
  playTurnChange() {
    this.playTone(600, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(750, 0.15, 'sine', 0.2), 100);
  }

  // Draw game sound
  playDraw() {
    this.playTone(400, 0.3, 'triangle', 0.2);
    setTimeout(() => this.playTone(450, 0.3, 'triangle', 0.2), 250);
    setTimeout(() => this.playTone(400, 0.4, 'triangle', 0.15), 500);
  }
}

export const soundManager = new SoundManager();

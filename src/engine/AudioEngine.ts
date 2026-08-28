/**
 * Procedural Web Audio Synthesizer
 * Zero external audio assets required. Generates realistic wooden jigsaw clicks,
 * magnetic snaps, and celebratory victory fanfares in real-time.
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private sfxVolume: number = 0.85
  private musicVolume: number = 0.4
  private isMusicPlaying: boolean = false
  private ambientInterval: number | null = null

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public setVolumes(sfx: number, music: number) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx / 100))
    this.musicVolume = Math.max(0, Math.min(1, music / 100))
  }

  /**
   * Crisp tactile snap sound when pieces connect
   */
  public playSnap() {
    if (this.sfxVolume <= 0) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime

    // 1. Tonal snap click (fast frequency sweep)
    const osc = this.ctx.createOscillator()
    const oscGain = this.ctx.createGain()
    
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(520, now)
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.05)

    oscGain.gain.setValueAtTime(0.4 * this.sfxVolume, now)
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    osc.connect(oscGain)
    oscGain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.07)

    // 2. High-frequency friction snap (wooden tab impact)
    const bufferSize = this.ctx.sampleRate * 0.04
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2))
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2400, now)
    filter.Q.setValueAtTime(3.0, now)

    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(0.35 * this.sfxVolume, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(this.ctx.destination)
    noise.start(now)
  }

  /**
   * Light wooden pickup sound
   */
  public playPickup() {
    if (this.sfxVolume <= 0) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(280, now)
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.035)

    gain.gain.setValueAtTime(0.18 * this.sfxVolume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.045)
  }

  /**
   * Damped wooden drop sound
   */
  public playDrop() {
    if (this.sfxVolume <= 0) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.04)

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.055)
  }

  /**
   * Rotation swoosh click
   */
  public playRotate() {
    if (this.sfxVolume <= 0) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.05)

    gain.gain.setValueAtTime(0.22 * this.sfxVolume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.07)
  }

  /**
   * Tray open/close slide sound
   */
  public playTrayToggle() {
    if (this.sfxVolume <= 0) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.08)

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.1)
  }

  /**
   * Soothing two-tone harmonic hint chime (C5 -> G5)
   */
  public playHint() {
    if (this.sfxVolume <= 0) return
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [523.25, 783.99] // C5, G5

    notes.forEach((freq, idx) => {
      if (!this.ctx) return
      const t = now + idx * 0.12
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)

      gain.gain.setValueAtTime(0.24 * this.sfxVolume, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(t)
      osc.stop(t + 0.95)
    })
  }

  /**
   * Grand victory arpeggio chime on puzzle completion
   */
  public playVictory() {
    if (this.sfxVolume <= 0) return
    this.initContext()
    if (!this.ctx) return

    // C Major 9 chord: C4, E4, G4, B4, D5, G5
    const notes = [261.63, 329.63, 392.0, 493.88, 587.33, 783.99]
    const startTime = this.ctx.currentTime

    notes.forEach((freq, index) => {
      if (!this.ctx) return
      const noteTime = startTime + index * 0.12

      // Fundamental oscillator
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, noteTime)

      // Bell-like decay envelope
      gain.gain.setValueAtTime(0.28 * this.sfxVolume, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.6)

      // Harmonic overtone
      const overtone = this.ctx.createOscillator()
      const overtoneGain = this.ctx.createGain()
      overtone.type = 'triangle'
      overtone.frequency.setValueAtTime(freq * 2, noteTime)
      overtoneGain.gain.setValueAtTime(0.1 * this.sfxVolume, noteTime)
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8)

      osc.connect(gain)
      overtone.connect(overtoneGain)
      gain.connect(this.ctx.destination)
      overtoneGain.connect(this.ctx.destination)

      osc.start(noteTime)
      overtone.start(noteTime)
      osc.stop(noteTime + 1.8)
      overtone.stop(noteTime + 0.9)
    })
  }

  /**
   * Starts peaceful procedural ambient wind chime tones
   */
  public startAmbientMusic() {
    if (this.isMusicPlaying) return
    this.isMusicPlaying = true
    this.initContext()

    const pentatonicScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]

    this.ambientInterval = window.setInterval(() => {
      if (!this.ctx || this.musicVolume <= 0 || !this.isMusicPlaying) return
      if (Math.random() > 0.4) return

      const freq = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)]
      const now = this.ctx.currentTime

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.04 * this.musicVolume, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 3.2)
    }, 1800)
  }

  public stopAmbientMusic() {
    this.isMusicPlaying = false
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval)
      this.ambientInterval = null
    }
  }
}

export const audioEngine = new AudioEngine()

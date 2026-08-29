import { SoundscapeVolumes } from '../types/puzzle'

/**
 * Procedural Multi-Channel Web Audio Synthesizer
 * Zero external audio assets required.
 * Generates realistic wooden clicks, tactile snaps, celebratory fanfares,
 * and 4 procedural ambient soundscapes: Focus Chimes, Rain, Fireplace, Wind.
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private sfxVolume: number = 0.85
  private musicVolume: number = 0.4
  private isSoundscapePlaying: boolean = false

  // Soundscape channel volumes (0.0 to 1.0)
  private channelVolumes = {
    chimes: 0.4,
    rain: 0.0,
    fire: 0.0,
    wind: 0.0,
  }

  // Audio nodes for continuous soundscapes
  private rainSource: AudioBufferSourceNode | null = null
  private rainGain: GainNode | null = null
  private rainFilter: BiquadFilterNode | null = null

  private windSource: AudioBufferSourceNode | null = null
  private windGain: GainNode | null = null
  private windFilter: BiquadFilterNode | null = null
  private windLfo: OscillatorNode | null = null

  private fireSource: AudioBufferSourceNode | null = null
  private fireGain: GainNode | null = null
  private fireCrackleInterval: number | null = null

  private chimesInterval: number | null = null

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
    this.updateSoundscapeGains()
  }

  public setSoundscapeVolumes(volumes: SoundscapeVolumes) {
    this.channelVolumes = {
      chimes: Math.max(0, Math.min(1, (volumes.chimes ?? 40) / 100)),
      rain: Math.max(0, Math.min(1, (volumes.rain ?? 0) / 100)),
      fire: Math.max(0, Math.min(1, (volumes.fire ?? 0) / 100)),
      wind: Math.max(0, Math.min(1, (volumes.wind ?? 0) / 100)),
    }
    this.updateSoundscapeGains()
  }

  private updateSoundscapeGains() {
    if (!this.ctx || !this.isSoundscapePlaying) return
    const now = this.ctx.currentTime

    const masterGain = this.musicVolume

    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(this.channelVolumes.rain * masterGain * 0.45, now, 0.1)
    }
    if (this.windGain) {
      this.windGain.gain.setTargetAtTime(this.channelVolumes.wind * masterGain * 0.35, now, 0.1)
    }
    if (this.fireGain) {
      this.fireGain.gain.setTargetAtTime(this.channelVolumes.fire * masterGain * 0.35, now, 0.1)
    }
  }

  /**
   * Generates a seamless buffer of pink noise for rain and wind
   */
  private createPinkNoiseBuffer(durationSeconds: number = 4): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext missing')
    const sampleRate = this.ctx.sampleRate
    const bufferSize = sampleRate * durationSeconds
    const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08
        b6 = white * 0.115926
      }
    }
    return buffer
  }

  /**
   * Starts all active procedural soundscape channels
   */
  public startAmbientMusic() {
    if (this.isSoundscapePlaying) return
    this.isSoundscapePlaying = true
    this.initContext()
    if (!this.ctx) return

    const now = this.ctx.currentTime

    // 1. Setup Rain Synth (Pink noise through lowpass filter)
    try {
      const rainBuffer = this.createPinkNoiseBuffer(5)
      this.rainSource = this.ctx.createBufferSource()
      this.rainSource.buffer = rainBuffer
      this.rainSource.loop = true

      this.rainFilter = this.ctx.createBiquadFilter()
      this.rainFilter.type = 'lowpass'
      this.rainFilter.frequency.setValueAtTime(1400, now)

      this.rainGain = this.ctx.createGain()
      this.rainGain.gain.setValueAtTime(this.channelVolumes.rain * this.musicVolume * 0.45, now)

      this.rainSource.connect(this.rainFilter)
      this.rainFilter.connect(this.rainGain)
      this.rainGain.connect(this.ctx.destination)
      this.rainSource.start(now)
    } catch {
      // ignore
    }

    // 2. Setup Wind Synth (Pink noise through LFO-swept bandpass)
    try {
      const windBuffer = this.createPinkNoiseBuffer(6)
      this.windSource = this.ctx.createBufferSource()
      this.windSource.buffer = windBuffer
      this.windSource.loop = true

      this.windFilter = this.ctx.createBiquadFilter()
      this.windFilter.type = 'bandpass'
      this.windFilter.frequency.setValueAtTime(380, now)
      this.windFilter.Q.setValueAtTime(2.2, now)

      // LFO for slow wind gusts
      this.windLfo = this.ctx.createOscillator()
      this.windLfo.frequency.setValueAtTime(0.12, now) // 8 second gentle gust cycle
      const lfoGain = this.ctx.createGain()
      lfoGain.gain.setValueAtTime(160, now)
      this.windLfo.connect(lfoGain)
      lfoGain.connect(this.windFilter.frequency)

      this.windGain = this.ctx.createGain()
      this.windGain.gain.setValueAtTime(this.channelVolumes.wind * this.musicVolume * 0.35, now)

      this.windSource.connect(this.windFilter)
      this.windFilter.connect(this.windGain)
      this.windGain.connect(this.ctx.destination)

      this.windSource.start(now)
      this.windLfo.start(now)
    } catch {
      // ignore
    }

    // 3. Setup Fireplace Synth (warm low rumble + randomized crackle pops)
    try {
      const fireBuffer = this.createPinkNoiseBuffer(4)
      this.fireSource = this.ctx.createBufferSource()
      this.fireSource.buffer = fireBuffer
      this.fireSource.loop = true

      const fireFilter = this.ctx.createBiquadFilter()
      fireFilter.type = 'lowpass'
      fireFilter.frequency.setValueAtTime(450, now)

      this.fireGain = this.ctx.createGain()
      this.fireGain.gain.setValueAtTime(this.channelVolumes.fire * this.musicVolume * 0.35, now)

      this.fireSource.connect(fireFilter)
      fireFilter.connect(this.fireGain)
      this.fireGain.connect(this.ctx.destination)
      this.fireSource.start(now)

      // Random fireplace crackle pops
      this.fireCrackleInterval = window.setInterval(() => {
        if (!this.ctx || !this.isSoundscapePlaying || this.channelVolumes.fire <= 0 || this.musicVolume <= 0) return
        if (Math.random() > 0.6) return

        const t = this.ctx.currentTime
        const popOsc = this.ctx.createOscillator()
        const popGain = this.ctx.createGain()

        popOsc.type = 'triangle'
        popOsc.frequency.setValueAtTime(1200 + Math.random() * 2000, t)
        popOsc.frequency.exponentialRampToValueAtTime(100, t + 0.015)

        popGain.gain.setValueAtTime(0.08 * this.channelVolumes.fire * this.musicVolume, t)
        popGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018)

        popOsc.connect(popGain)
        popGain.connect(this.ctx.destination)
        popOsc.start(t)
        popOsc.stop(t + 0.02)
      }, 250)
    } catch {
      // ignore
    }

    // 4. Setup Chimes (Pentatonic harmony progressions)
    const pentatonicScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]
    this.chimesInterval = window.setInterval(() => {
      if (!this.ctx || !this.isSoundscapePlaying || this.channelVolumes.chimes <= 0 || this.musicVolume <= 0) return
      if (Math.random() > 0.45) return

      const freq = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)]
      const t = this.ctx.currentTime

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)

      const volume = 0.08 * this.channelVolumes.chimes * this.musicVolume
      gain.gain.setValueAtTime(volume, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(t)
      osc.stop(t + 3.3)
    }, 2000)
  }

  /**
   * Stops all ambient soundscapes cleanly
   */
  public stopAmbientMusic() {
    this.isSoundscapePlaying = false

    if (this.chimesInterval) {
      clearInterval(this.chimesInterval)
      this.chimesInterval = null
    }
    if (this.fireCrackleInterval) {
      clearInterval(this.fireCrackleInterval)
      this.fireCrackleInterval = null
    }

    try {
      if (this.rainSource) {
        this.rainSource.stop()
        this.rainSource.disconnect()
        this.rainSource = null
      }
      if (this.windSource) {
        this.windSource.stop()
        this.windSource.disconnect()
        this.windSource = null
      }
      if (this.windLfo) {
        this.windLfo.stop()
        this.windLfo.disconnect()
        this.windLfo = null
      }
      if (this.fireSource) {
        this.fireSource.stop()
        this.fireSource.disconnect()
        this.fireSource = null
      }
    } catch {
      // ignore
    }
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

    const notes = [261.63, 329.63, 392.0, 493.88, 587.33, 783.99]
    const startTime = this.ctx.currentTime

    notes.forEach((freq, index) => {
      if (!this.ctx) return
      const noteTime = startTime + index * 0.12

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, noteTime)

      gain.gain.setValueAtTime(0.28 * this.sfxVolume, noteTime)
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.6)

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
}

export const audioEngine = new AudioEngine()

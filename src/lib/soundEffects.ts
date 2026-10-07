/**
 * Dịch vụ âm thanh tương tác đám cưới (Interactive Wedding Sound Effects)
 * Sử dụng Web Audio API thuần khiết 100% (Zero-latency, 100% Offline, không phụ thuộc file mạng ngoài)
 */

class WeddingSoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Khởi tạo AudioContext khi cần thiết (lazy init sau user gesture)
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * 1. Âm thanh chạm / Click nhẹ nhàng tinh tế (Soft Glass/Wood Click)
   */
  public playSoftClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // Ignore audio error
    }
  }

  /**
   * 2. Âm thanh Mở phong bì thư (Wax seal pop + Paper rustle)
   * Tiếng con dấu sáp tách ra và thiệp trượt trong giấy lụa
   */
  public playEnvelopeOpen() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Phần 1: Tiếng "pop" con dấu sáp tách ra
      const oscSeal = ctx.createOscillator();
      const gainSeal = ctx.createGain();

      oscSeal.type = "triangle";
      oscSeal.frequency.setValueAtTime(180, now);
      oscSeal.frequency.exponentialRampToValueAtTime(50, now + 0.09);

      gainSeal.gain.setValueAtTime(0.35, now);
      gainSeal.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      oscSeal.connect(gainSeal);
      gainSeal.connect(ctx.destination);

      oscSeal.start(now);
      oscSeal.stop(now + 0.1);

      // Phần 2: Tiếng giấy lụa trượt (Soft paper rustle glide)
      const bufferSize = ctx.sampleRate * 0.35;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1200, now + 0.05);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.35);
      filter.Q.value = 1.2;

      const gainNoise = ctx.createGain();
      gainNoise.gain.setValueAtTime(0.08, now + 0.05);
      gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(filter);
      filter.connect(gainNoise);
      gainNoise.connect(ctx.destination);

      noise.start(now + 0.05);
      noise.stop(now + 0.38);

      // Phần 3: Chuông ngân nhẹ báo hiệu thiệp lộ diện
      this.playChime(now + 0.25);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * 3. Âm thanh Chuông hỷ lung linh (Wedding Chime Arpeggio)
   * Hợp âm Ngũ Cung du dương đón chào khách quý
   */
  public playChime(startTime?: number) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const start = startTime !== undefined ? startTime : ctx.currentTime;
      // Nốt nhạc Ngũ Cung lãng mạn (C6, D6, E6, G6, C7)
      const notes = [1046.5, 1174.66, 1318.51, 1567.98, 2093.0];

      notes.forEach((freq, idx) => {
        const noteTime = start + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.15, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.65);
      });
    } catch (e) {
      // Ignore
    }
  }

  /**
   * 4. Âm thanh Chúc phúc / Pháo hoa mừng cưới (Celebration Chord)
   * Khi gửi RSVP, gửi lời chúc hoặc quét mã mừng cưới
   */
  public playCelebration() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Hợp âm Trưởng 7 thăng hoa (Major 7th Chord: F5, A5, C6, E6, G6)
      const chord = [698.46, 880.0, 1046.5, 1318.51, 1567.98];

      chord.forEach((freq, idx) => {
        const noteTime = now + idx * 0.04;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.18, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.85);
      });
    } catch (e) {
      // Ignore
    }
  }

  /**
   * 5. Âm thanh Thả tim / Yêu thích (Sweet Heart Pop)
   */
  public playHeartPop() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * 6. Âm thanh Lướt chuyển cảnh / Chuyển section (Smooth Silk Swoosh)
   */
  public playSwoosh() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      // Ignore
    }
  }
}

// Singleton instance
export const weddingSounds = new WeddingSoundService();

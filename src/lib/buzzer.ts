/**
 * The counter's new-order buzzer, made with the Web Audio API (no sound file to load).
 * Browsers only allow sound after someone has tapped or typed on the page, so `unlockBuzzer`
 * runs on the first tap; until then `buzzerReady()` is false and the page asks for a tap.
 */

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

export function buzzerReady(): boolean {
  return audio()?.state === "running";
}

export async function unlockBuzzer(): Promise<boolean> {
  const ctx = audio();
  if (!ctx) return false;
  if (ctx.state !== "running") await ctx.resume().catch(() => {});
  return ctx.state === "running";
}

/** Three short, loud buzzes (about 1.5 seconds). */
export function playBuzzer(): void {
  const ctx = audio();
  if (!ctx || ctx.state !== "running") return;
  const start = ctx.currentTime + 0.02;
  const out = ctx.createGain();
  out.gain.value = 0.35;
  out.connect(ctx.destination);

  for (let i = 0; i < 3; i++) {
    const at = start + i * 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(1, at + 0.01);
    gain.gain.setValueAtTime(1, at + 0.34);
    gain.gain.linearRampToValueAtTime(0, at + 0.36);
    gain.connect(out);
    // Two detuned sawtooth tones give the rasp of a real buzzer.
    for (const frequency of [196, 203]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = frequency;
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + 0.38);
    }
  }
}

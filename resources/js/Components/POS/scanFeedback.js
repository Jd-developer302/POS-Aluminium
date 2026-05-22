/**
 * Short UI beep for successful / failed barcode lookup (Web Audio API).
 */
export function playScanBeep(success = true) {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
            return;
        }
        const ctx = new Ctx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = success ? 880 : 180;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(
            success ? 0.07 : 0.05,
            ctx.currentTime + 0.012,
        );
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + (success ? 0.07 : 0.18));
        setTimeout(() => {
            void ctx.close();
        }, 250);
    } catch {
        /* ignore */
    }
}

class SoundManager {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;

    init() {
        if (typeof window !== 'undefined') {
            // AudioContext will be created on first user interaction
        }
    }

    private getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        return this.audioContext;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    playBell() {
        if (!this.enabled) return;
        if (typeof window === 'undefined') return;

        try {
            const ctx = this.getAudioContext();

            // Create a pleasant bell-like sound
            const now = ctx.currentTime;

            // Fundamental tone
            const osc1 = ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(830, now); // High bell tone

            // Harmonic overtone
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1660, now); // Octave above

            // Third harmonic
            const osc3 = ctx.createOscillator();
            osc3.type = 'sine';
            osc3.frequency.setValueAtTime(2490, now);

            // Gain for fundamental
            const gain1 = ctx.createGain();
            gain1.gain.setValueAtTime(0.25, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            // Gain for overtone
            const gain2 = ctx.createGain();
            gain2.gain.setValueAtTime(0.1, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

            // Gain for third harmonic
            const gain3 = ctx.createGain();
            gain3.gain.setValueAtTime(0.05, now);
            gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            // Connect
            osc1.connect(gain1);
            gain1.connect(ctx.destination);

            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc3.connect(gain3);
            gain3.connect(ctx.destination);

            // Play
            osc1.start(now);
            osc1.stop(now + 1.2);

            osc2.start(now);
            osc2.stop(now + 0.8);

            osc3.start(now);
            osc3.stop(now + 0.5);
        } catch {
            // Ignore audio errors
        }
    }
}

export const soundManager = new SoundManager();

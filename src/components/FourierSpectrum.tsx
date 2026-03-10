import { motion } from 'framer-motion';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';

export function FourierSpectrum() {
  const spectrum = useClickStore((s) => s.telemetry.fft_spectrum);
  const dominantFreq = useClickStore((s) => s.telemetry.fft_dominant_freq);

  // Normalize spectrum to 0-1
  const max = Math.max(...spectrum, 0.01);
  const normalized = spectrum.map((v) => v / max);

  // Generate 32 bars if no data
  const bars = normalized.length > 0
    ? normalized.slice(0, 32)
    : Array(32).fill(0).map(() => Math.random() * 0.1);

  return (
    <Card label="[FFT SPECTRUM]" delay={0.3} span="fft">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Spectrum bars */}
        <div style={{ display: 'flex', gap: 2, height: 60, alignItems: 'flex-end' }}>
          {bars.map((v, i) => {
            const isPeak = i === bars.indexOf(Math.max(...bars));
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(v * 100, 2)}%` }}
                transition={{
                  delay: i * 0.015,
                  duration: 0.5,
                  ease: [0.23, 1, 0.32, 1],
                }}
                style={{
                  flex: 1,
                  background: isPeak
                    ? 'var(--green)'
                    : `rgba(74, 222, 128, ${0.15 + v * 0.6})`,
                  borderRadius: '2px 2px 0 0',
                  minHeight: 1,
                }}
              />
            );
          })}
        </div>

        {/* Frequency axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="mono text-tertiary" style={{ fontSize: 8 }}>0 Hz</span>
          <span className="mono text-tertiary" style={{ fontSize: 8 }}>Nyquist</span>
        </div>

        {/* Dominant frequency */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="mono text-secondary" style={{ fontSize: 9 }}>DOMINANT</span>
          <span className="mono text-green" style={{ fontSize: 12, fontWeight: 600 }}>
            {dominantFreq.toFixed(1)} Hz
          </span>
        </div>

        <div className="mono text-tertiary" style={{ fontSize: 8 }}>
          RADIX-2 COOLEY-TUKEY / N={spectrum.length || 0}
        </div>
      </div>
    </Card>
  );
}

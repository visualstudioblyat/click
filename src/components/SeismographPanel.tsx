import { useRef, useEffect } from 'react';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';

export function SeismographPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervals = useClickStore((s) => s.telemetry.recent_intervals);
  const targetCps = useClickStore((s) => s.config.target_cps);
  const seismograph = useClickStore((s) => s.telemetry.seismograph);

  // Richter-like magnitude from deviation
  const magnitude = Math.min(Math.log10(Math.max(seismograph, 0.001) * 1000 + 1), 9);

  const severity =
    magnitude < 2 ? { label: 'MICRO', color: 'var(--green)' } :
    magnitude < 4 ? { label: 'MINOR', color: 'var(--green)' } :
    magnitude < 6 ? { label: 'MODERATE', color: 'var(--amber)' } :
    magnitude < 7 ? { label: 'STRONG', color: 'var(--red)' } :
    { label: 'CATASTROPHIC', color: 'var(--red)' };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += h / 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Expected interval
    const expected = 1000 / targetCps;
    const data = intervals.slice(-80);
    if (data.length < 2) return;

    // Draw seismograph line
    ctx.beginPath();
    ctx.strokeStyle = severity.color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    data.forEach((interval, i) => {
      const x = (i / (data.length - 1)) * w;
      const deviation = (interval - expected) / expected;
      const y = h / 2 - deviation * (h / 2) * 2;
      const clampedY = Math.max(2, Math.min(h - 2, y));
      if (i === 0) ctx.moveTo(x, clampedY);
      else ctx.lineTo(x, clampedY);
    });
    ctx.stroke();

    // Center line (expected)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [intervals, targetCps, severity.color]);

  return (
    <Card label="[SEISMOGRAPH]" delay={0.35} span="seismo">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <canvas
          ref={canvasRef}
          width={200}
          height={60}
          style={{ width: '100%', height: 60, borderRadius: 4 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>MAGNITUDE</div>
            <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: severity.color }}>
              {magnitude.toFixed(1)}
            </span>
          </div>
          <div
            className="badge"
            style={{
              background: severity.color === 'var(--green)' ? 'var(--green-dim)' :
                          severity.color === 'var(--amber)' ? 'var(--amber-dim)' : 'var(--red-dim)',
              color: severity.color,
              fontSize: 9,
            }}
          >
            {severity.label}
          </div>
        </div>

        <div className="mono text-tertiary" style={{ fontSize: 8 }}>
          CLICK-RICHTER SCALE / P-WAVE ANALYSIS
        </div>
      </div>
    </Card>
  );
}

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from './Card';
import { Mascot } from './Mascot';
import { useClickStore } from '../store/clickStore';

export function CpsChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cpsHistory = useClickStore((s) => s.cpsHistory);
  const status = useClickStore((s) => s.status);
  const targetCps = useClickStore((s) => s.config.target_cps);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth * devicePixelRatio;
      canvas.height = container.clientHeight * devicePixelRatio;
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = container.clientHeight + 'px';
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const dpr = devicePixelRatio;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = dpr;
    for (let i = 1; i < 5; i++) {
      const y = (h / 5) * i;
      ctx.beginPath();
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (cpsHistory.length < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = `${11 * dpr}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('WAITING FOR DATA...', w / 2, h / 2);
      return;
    }

    const data = cpsHistory.slice(-300);
    const max = Math.max(...data, targetCps) * 1.15;
    const min = Math.max(0, Math.min(...data) * 0.85);
    const range = max - min || 1;

    const padX = 0;
    const padY = 16 * dpr;
    const plotW = w - padX;
    const plotH = h - padY * 2;

    const toX = (i: number) => padX + (i / (data.length - 1)) * plotW;
    const toY = (v: number) => padY + plotH - ((v - min) / range) * plotH;

    // Target CPS line
    const targetY = toY(targetCps);
    ctx.strokeStyle = 'rgba(249,115,22,0.3)';
    ctx.lineWidth = dpr;
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(w, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Target label
    ctx.fillStyle = 'rgba(249,115,22,0.5)';
    ctx.font = `${9 * dpr}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`TARGET ${targetCps}`, w - 4 * dpr, targetY - 4 * dpr);

    // Fill gradient under line
    const gradient = ctx.createLinearGradient(0, toY(max), 0, toY(min));
    gradient.addColorStop(0, 'rgba(74,222,128,0.15)');
    gradient.addColorStop(1, 'rgba(74,222,128,0.0)');

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(toX(i), toY(data[i]));
    }
    ctx.lineTo(toX(data.length - 1), h);
    ctx.lineTo(toX(0), h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // CPS line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(toX(i), toY(data[i]));
    }
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1.5 * dpr;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Current value dot
    const lastX = toX(data.length - 1);
    const lastY = toY(data[data.length - 1]);
    if (status === 'running') {
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = '#4ade80';
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(74,222,128,0.2)';
      ctx.fill();
    }

    // Y-axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = `${9 * dpr}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'left';
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const v = min + (range / steps) * i;
      const y = toY(v);
      ctx.fillText(v.toFixed(1), 4 * dpr, y - 2 * dpr);
    }

    // Current CPS label
    if (data.length > 0) {
      const current = data[data.length - 1];
      ctx.fillStyle = '#4ade80';
      ctx.font = `bold ${11 * dpr}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(current.toFixed(1) + ' CPS', w - 4 * dpr, padY - 2 * dpr);
    }
  }, [cpsHistory, targetCps, status]);

  const showMascot = cpsHistory.length < 2;

  return (
    <Card label="[CLICK TIMELINE]" delay={0.1} span="chart">
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
        <AnimatePresence>
          {showMascot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <Mascot size={100} animate />
              <span className="mono text-tertiary" style={{ fontSize: 10 }}>
                PRESS F6 TO START
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

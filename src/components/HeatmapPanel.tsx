import { useRef, useEffect } from 'react';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';

export function HeatmapPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const positions = useClickStore(
    useShallow((s) => s.telemetry.click_positions),
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // grid lines
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (positions.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO DATA', w / 2, h / 2);
      return;
    }

    // find bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const [px, py] of positions) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 12;
    const drawW = w - pad * 2;
    const drawH = h - pad * 2;

    // density map for opacity
    const grid = new Map<string, number>();
    const cellSize = 6;
    for (const [px, py] of positions) {
      const cx = Math.floor(((px - minX) / rangeX) * (drawW / cellSize));
      const cy = Math.floor(((py - minY) / rangeY) * (drawH / cellSize));
      const key = `${cx},${cy}`;
      grid.set(key, (grid.get(key) || 0) + 1);
    }
    const maxDensity = Math.max(...grid.values(), 1);

    // draw dots
    for (const [px, py] of positions) {
      const sx = pad + ((px - minX) / rangeX) * drawW;
      const sy = pad + ((py - minY) / rangeY) * drawH;

      const cx = Math.floor(((px - minX) / rangeX) * (drawW / cellSize));
      const cy = Math.floor(((py - minY) / rangeY) * (drawH / cellSize));
      const density = grid.get(`${cx},${cy}`) || 1;
      const opacity = 0.2 + 0.8 * (density / maxDensity);

      // glow
      const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
      gradient.addColorStop(0, `rgba(74, 222, 128, ${opacity * 0.4})`);
      gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(sx - 8, sy - 8, 16, 16);

      // dot
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(74, 222, 128, ${opacity})`;
      ctx.fill();
    }
  }, [positions]);

  return (
    <Card label="[HEATMAP]" delay={0.2} span="heatmap">
      <canvas
        ref={canvasRef}
        width={280}
        height={180}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 140,
          borderRadius: 4,
          border: '1px dashed var(--border-dashed)',
        }}
      />
    </Card>
  );
}

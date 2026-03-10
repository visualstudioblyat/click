import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';
import { useShallow } from 'zustand/react/shallow';

const IS_TAURI = '__TAURI_INTERNALS__' in window;

export function HeatmapPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { positions, updateTelemetry } = useClickStore(
    useShallow((s) => ({
      positions: s.telemetry.click_positions,
      updateTelemetry: s.updateTelemetry,
    })),
  );

  const clearHeatmap = () => {
    updateTelemetry({ click_positions: [] });
    if (IS_TAURI) invoke('clear_heatmap').catch(() => {});
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(74, 222, 128, 0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (positions.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO DATA', w / 2, h / 2);
      return;
    }

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

    const grid = new Map<string, number>();
    const cellSize = 6;
    for (const [px, py] of positions) {
      const cx = Math.floor(((px - minX) / rangeX) * (drawW / cellSize));
      const cy = Math.floor(((py - minY) / rangeY) * (drawH / cellSize));
      const key = `${cx},${cy}`;
      grid.set(key, (grid.get(key) || 0) + 1);
    }
    const maxDensity = Math.max(...grid.values(), 1);

    for (const [px, py] of positions) {
      const sx = pad + ((px - minX) / rangeX) * drawW;
      const sy = pad + ((py - minY) / rangeY) * drawH;
      const cx = Math.floor(((px - minX) / rangeX) * (drawW / cellSize));
      const cy = Math.floor(((py - minY) / rangeY) * (drawH / cellSize));
      const density = grid.get(`${cx},${cy}`) || 1;
      const opacity = 0.2 + 0.8 * (density / maxDensity);

      const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
      gradient.addColorStop(0, `rgba(74, 222, 128, ${opacity * 0.4})`);
      gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(sx - 8, sy - 8, 16, 16);

      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(74, 222, 128, ${opacity})`;
      ctx.fill();
    }
  }, [positions]);

  return (
    <Card label="[HEATMAP]" delay={0.2} span="heatmap">
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
        {positions.length > 0 && (
          <motion.button
            className="btn"
            whileTap={{ scale: 0.95 }}
            onClick={clearHeatmap}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              fontSize: 8,
              padding: '2px 6px',
              background: 'rgba(17,17,16,0.8)',
            }}
          >
            CLEAR
          </motion.button>
        )}
      </div>
    </Card>
  );
}

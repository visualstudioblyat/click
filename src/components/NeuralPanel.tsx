import { useRef, useEffect } from 'react';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';

export function NeuralPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neuralLoss = useClickStore((s) => s.telemetry.neural_loss);
  const isRunning = useClickStore((s) => s.status === 'running');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Network architecture: 4 → 8 → 8 → 1
    const layers = [4, 8, 8, 1];
    const layerNames = ['INPUT', 'HIDDEN 1', 'HIDDEN 2', 'OUTPUT'];
    const padding = 20;
    const layerSpacing = (w - padding * 2) / (layers.length - 1);

    // Draw connections first (behind nodes)
    ctx.lineWidth = 0.5;
    for (let l = 0; l < layers.length - 1; l++) {
      const x1 = padding + l * layerSpacing;
      const x2 = padding + (l + 1) * layerSpacing;
      for (let i = 0; i < layers[l]; i++) {
        const y1 = padding + (i / (layers[l] - 1 || 1)) * (h - padding * 2 - 14);
        for (let j = 0; j < layers[l + 1]; j++) {
          const y2 = padding + (j / (layers[l + 1] - 1 || 1)) * (h - padding * 2 - 14);
          const weight = Math.sin(l * 3 + i * 7 + j * 13 + neuralLoss * 10) * 0.5 + 0.5;
          ctx.strokeStyle = isRunning
            ? `rgba(74, 222, 128, ${weight * 0.3})`
            : `rgba(255, 255, 255, ${weight * 0.06})`;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (let l = 0; l < layers.length; l++) {
      const x = padding + l * layerSpacing;
      for (let i = 0; i < layers[l]; i++) {
        const y = padding + (i / (layers[l] - 1 || 1)) * (h - padding * 2 - 14);
        const activation = Math.sin(l * 5 + i * 11 + neuralLoss * 20) * 0.5 + 0.5;

        // Glow
        if (isRunning) {
          ctx.fillStyle = `rgba(74, 222, 128, ${activation * 0.15})`;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node
        ctx.fillStyle = isRunning
          ? `rgba(74, 222, 128, ${0.3 + activation * 0.7})`
          : 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Layer label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '7px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(layerNames[l], x, h - 2);
    }
  }, [neuralLoss, isRunning]);

  return (
    <Card label="[NEURAL HUMANIZER]" delay={0.3} span="neural">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <canvas
          ref={canvasRef}
          width={220}
          height={100}
          style={{ width: '100%', height: 100, borderRadius: 4 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>TRAINING LOSS</div>
            <div className="mono" style={{ fontSize: 12, color: neuralLoss < 0.1 ? 'var(--green)' : 'var(--text-primary)' }}>
              {neuralLoss.toFixed(4)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>ARCHITECTURE</div>
            <div className="mono text-secondary" style={{ fontSize: 10 }}>4→8→8→1</div>
          </div>
        </div>

        <div className="mono text-tertiary" style={{ fontSize: 8 }}>
          FEEDFORWARD / SGD / MSE LOSS / NO DEPS
        </div>
      </div>
    </Card>
  );
}

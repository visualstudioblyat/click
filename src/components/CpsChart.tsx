import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { Card } from './Card';
import { useClickStore } from '../store/clickStore';

export function CpsChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const lineSeriesRef = useRef<any>(null);
  const candles = useClickStore((s) => s.candles);
  const cpsHistory = useClickStore((s) => s.cpsHistory);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.3)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        vertLine: { color: 'rgba(74,222,128,0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(74,222,128,0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
      },
      handleScale: false,
      handleScroll: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#4ade80',
      downColor: '#f97316',
      borderUpColor: '#4ade80',
      borderDownColor: '#f97316',
      wickUpColor: 'rgba(74,222,128,0.5)',
      wickDownColor: 'rgba(249,115,22,0.5)',
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: 'rgba(74,222,128,0.4)',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    lineSeriesRef.current = lineSeries;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  // Update candle data
  useEffect(() => {
    if (candleSeriesRef.current && candles.length > 0) {
      candleSeriesRef.current.setData(
        candles.map((c) => ({
          time: c.time as any,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
      );
    }
  }, [candles]);

  // Update line (moving average) data
  useEffect(() => {
    if (lineSeriesRef.current && cpsHistory.length > 0) {
      const win = 10;
      const ma = cpsHistory.map((_, i, arr) => {
        const start = Math.max(0, i - win + 1);
        const slice = arr.slice(start, i + 1);
        return slice.reduce((a, b) => a + b, 0) / slice.length;
      });

      lineSeriesRef.current.setData(
        ma.map((v, i) => ({
          time: (Math.floor(Date.now() / 1000) - cpsHistory.length + i) as any,
          value: v,
        })),
      );
    }
  }, [cpsHistory]);

  return (
    <Card label="[CPS MARKET]" delay={0.1} span="chart">
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <span className="mono text-secondary" style={{ fontSize: 9 }}>CANDLESTICK</span>
        <span className="mono text-tertiary" style={{ fontSize: 9 }}>SMA(10)</span>
        <span className="mono text-tertiary" style={{ fontSize: 9 }}>VOL</span>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: 'calc(100% - 36px)' }} />
    </Card>
  );
}

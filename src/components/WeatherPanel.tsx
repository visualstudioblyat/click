import { motion } from 'framer-motion';
import { Card } from './Card';
import { BigNumber } from './BigNumber';
import { useClickStore } from '../store/clickStore';

// SVG weather icons that match the tactical style
function WeatherIcon({ type, color }: { type: string; color: string }) {
  const size = 28;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {type === 'clear' && (
        <>
          <circle cx="14" cy="14" r="5" />
          <line x1="14" y1="3" x2="14" y2="6" />
          <line x1="14" y1="22" x2="14" y2="25" />
          <line x1="3" y1="14" x2="6" y2="14" />
          <line x1="22" y1="14" x2="25" y2="14" />
          <line x1="6.2" y1="6.2" x2="8.3" y2="8.3" />
          <line x1="19.7" y1="19.7" x2="21.8" y2="21.8" />
          <line x1="6.2" y1="21.8" x2="8.3" y2="19.7" />
          <line x1="19.7" y1="8.3" x2="21.8" y2="6.2" />
        </>
      )}
      {type === 'partly' && (
        <>
          <circle cx="11" cy="11" r="4" />
          <line x1="11" y1="2" x2="11" y2="4" />
          <line x1="3" y1="11" x2="5" y2="11" />
          <line x1="5.3" y1="5.3" x2="6.7" y2="6.7" />
          <line x1="16.7" y1="5.3" x2="15.3" y2="6.7" />
          <path d="M 8 18 Q 8 14 12 14 Q 14 10 18 12 Q 22 12 22 16 Q 24 16 24 18 Q 24 20 22 20 L 10 20 Q 8 20 8 18 Z" />
        </>
      )}
      {type === 'overcast' && (
        <path d="M 6 18 Q 6 14 10 14 Q 12 10 16 12 Q 20 11 21 14 Q 24 14 24 17 Q 24 20 21 20 L 9 20 Q 6 20 6 18 Z" />
      )}
      {type === 'rain' && (
        <>
          <path d="M 6 15 Q 6 11 10 11 Q 12 7 16 9 Q 20 8 21 11 Q 24 11 24 14 Q 24 17 21 17 L 9 17 Q 6 17 6 15 Z" />
          <line x1="10" y1="20" x2="9" y2="23" />
          <line x1="14" y1="20" x2="13" y2="23" />
          <line x1="18" y1="20" x2="17" y2="23" />
        </>
      )}
      {type === 'severe' && (
        <>
          <path d="M 6 13 Q 6 9 10 9 Q 12 5 16 7 Q 20 6 21 9 Q 24 9 24 12 Q 24 15 21 15 L 9 15 Q 6 15 6 13 Z" />
          <line x1="9" y1="18" x2="8" y2="21" />
          <line x1="13" y1="18" x2="12" y2="21" />
          <line x1="17" y1="18" x2="16" y2="21" />
          <polyline points="14,22 16,25 13,25 15,28" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

export function WeatherPanel() {
  const forecastCps = useClickStore((s) => s.telemetry.forecast_cps);
  const currentCps = useClickStore((s) => s.telemetry.cps);
  const targetCps = useClickStore((s) => s.config.target_cps);

  const trend = forecastCps > currentCps * 1.05 ? 'RISING' :
                forecastCps < currentCps * 0.95 ? 'FALLING' : 'STEADY';
  const trendColor = trend === 'RISING' ? 'var(--green)' :
                     trend === 'FALLING' ? 'var(--red)' : 'var(--text-secondary)';

  const ratio = forecastCps / Math.max(targetCps, 1);
  const condition =
    ratio > 0.95 ? 'Clear skies' :
    ratio > 0.8 ? 'Partly cloudy' :
    ratio > 0.6 ? 'Overcast' :
    ratio > 0.4 ? 'Light rain' :
    'Severe disruption';

  const iconType =
    ratio > 0.95 ? 'clear' :
    ratio > 0.8 ? 'partly' :
    ratio > 0.6 ? 'overcast' :
    ratio > 0.4 ? 'rain' :
    'severe';

  const iconColor =
    ratio > 0.8 ? 'var(--green)' :
    ratio > 0.5 ? 'var(--amber)' :
    'var(--red)';

  return (
    <Card label="[CPS WEATHER]" delay={0.55} span="weather">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Weather icon + condition */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <WeatherIcon type={iconType} color={iconColor} />
          </motion.div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{condition}</div>
            <div className="mono text-secondary" style={{ fontSize: 10 }}>
              {forecastCps.toFixed(1)} CPS expected
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>FORECAST</div>
            <BigNumber value={forecastCps} decimals={1} suffix=" CPS" />
          </div>
          <div>
            <div className="mono text-tertiary" style={{ fontSize: 8 }}>TREND</div>
            <motion.div
              className="mono"
              style={{ fontSize: 13, fontWeight: 600, color: trendColor }}
              animate={trend === 'RISING' ? { y: [0, -2, 0] } : trend === 'FALLING' ? { y: [0, 2, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {trend}
            </motion.div>
          </div>
        </div>

        <div className="mono text-tertiary" style={{ fontSize: 8 }}>
          HOLT-WINTERS TRIPLE EXPONENTIAL SMOOTHING
        </div>
      </div>
    </Card>
  );
}

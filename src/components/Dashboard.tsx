import { ControlPanel } from './ControlPanel';
import { CpsChart } from './CpsChart';
import { EntropyGauge } from './EntropyGauge';
import { PidPanel } from './PidPanel';
import { FourierSpectrum } from './FourierSpectrum';
import { BayesianPanel } from './BayesianPanel';
import { SeismographPanel } from './SeismographPanel';
import { MonteCarloPanel } from './MonteCarloPanel';
import { ProvenancePanel } from './ProvenancePanel';
import { OshaPanel } from './OshaPanel';
import { BocpdPanel } from './BocpdPanel';
import { WeatherPanel } from './WeatherPanel';
import { BrierPanel } from './BrierPanel';
import { NeuralPanel } from './NeuralPanel';

export function Dashboard() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gridTemplateRows: '420px 260px 260px 260px 260px',
        gridTemplateAreas: [
          'control control chart chart chart chart',
          'bayes bayes pid pid entropy entropy',
          'neural neural fft fft seismo seismo',
          'monte monte bocpd bocpd weather weather',
          'osha osha prov prov brier brier',
        ].map(r => `"${r}"`).join(' '),
        gap: 'var(--gap)',
        padding: 'var(--gap)',
        paddingBottom: 40,
        position: 'relative',
        zIndex: 2,
      }}
    >
      <ControlPanel />
      <CpsChart />
      <BayesianPanel />
      <PidPanel />
      <EntropyGauge />
      <NeuralPanel />
      <FourierSpectrum />
      <SeismographPanel />
      <MonteCarloPanel />
      <BocpdPanel />
      <WeatherPanel />
      <OshaPanel />
      <ProvenancePanel />
      <BrierPanel />
    </div>
  );
}

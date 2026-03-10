import { ControlPanel } from './ControlPanel';
import { CpsChart } from './CpsChart';
import { StatisticsPanel } from './StatisticsPanel';
import { ProfilesPanel } from './ProfilesPanel';
import { SchedulePanel } from './SchedulePanel';
import { SequencePanel } from './SequencePanel';
import { KeyboardPanel } from './KeyboardPanel';
import { HoldDragPanel } from './HoldDragPanel';
import { HeatmapPanel } from './HeatmapPanel';
import { AntiDetectionPanel } from './AntiDetectionPanel';
import { CounterOverlay } from './CounterOverlay';

export function Dashboard() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gridTemplateRows: '420px 260px 260px 260px',
        gridTemplateAreas: [
          'control control chart chart chart chart',
          'stats stats profiles profiles schedule schedule',
          'sequence sequence keyboard keyboard holddrag holddrag',
          'heatmap heatmap antidet antidet counter counter',
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
      <StatisticsPanel />
      <ProfilesPanel />
      <SchedulePanel />
      <SequencePanel />
      <KeyboardPanel />
      <HoldDragPanel />
      <HeatmapPanel />
      <AntiDetectionPanel />
      <CounterOverlay />
    </div>
  );
}

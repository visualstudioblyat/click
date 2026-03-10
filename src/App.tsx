import { GridOverlay } from './components/GridOverlay';
import { Dashboard } from './components/Dashboard';
import { useTauriEngine } from './hooks/useTauriEngine';
import { useMockTelemetry } from './hooks/useMockTelemetry';
import './styles/global.css';

const IS_TAURI = '__TAURI_INTERNALS__' in window;

function TauriApp() {
  useTauriEngine();
  return <Dashboard />;
}

function BrowserApp() {
  useMockTelemetry();
  return <Dashboard />;
}

function App() {
  return (
    <>
      <GridOverlay />
      {IS_TAURI ? <TauriApp /> : <BrowserApp />}
    </>
  );
}

export default App;

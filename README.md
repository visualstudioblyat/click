# Click

An autoclicker for Windows, built with Tauri v2, React, and Rust.

It does what OP Auto Clicker does but with a real UI -- live CPS charts, click heatmaps,
statistics, profiles, and anti-detection jitter (gaussian/poisson/uniform distributions).
The clicking engine runs entirely in Rust on a separate thread, so the UI never blocks.

Beyond basic auto-clicking, it supports keyboard mode, click-and-hold, drag automation,
and multi-step sequences (chain clicks, keypresses, and waits together). You can save
and load profiles, schedule start/stop times, and set position jitter so clicks aren't
all landing on the exact same pixel.

Default hotkey is F6. You can rebind it to any key, including mouse4/mouse5.

## Download

Grab the latest `.msi` from [Releases](../../releases).

## Building from source

Requires Node.js 18+ and Rust 1.75+.

```
npm install
npm run tauri dev     # dev mode with hot reload
npm run tauri build   # production build (.msi output)
```

## Keybinds

| Key | Action |
|-----|--------|
| F6 (default) | Toggle clicker on/off |
| Rebindable to F1-F12, any letter/number, Mouse4, Mouse5 |

## Stack

- **Frontend**: React 19, Zustand, Framer Motion, Lightweight Charts
- **Backend**: Rust, windows-rs for input simulation, parking_lot + tokio for the engine
- **Framework**: Tauri v2 with global shortcut and auto-updater plugins

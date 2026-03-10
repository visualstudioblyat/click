mod bayesian;
mod brier;
mod bocpd;
mod clicker;
mod engine;
mod entropy;
mod fatigue;
mod fourier;
mod hotkey;
mod montecarlo;
mod neural;
mod osha;
mod pid;
mod provenance;
mod weather;

use engine::{SharedEngine, ClickConfig};
use tauri::{AppHandle, State, Emitter};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

struct EngineState(SharedEngine);

fn key_to_code(key: &str) -> Option<Code> {
    match key {
        "F1" => Some(Code::F1), "F2" => Some(Code::F2), "F3" => Some(Code::F3),
        "F4" => Some(Code::F4), "F5" => Some(Code::F5), "F6" => Some(Code::F6),
        "F7" => Some(Code::F7), "F8" => Some(Code::F8), "F9" => Some(Code::F9),
        "F10" => Some(Code::F10), "F11" => Some(Code::F11), "F12" => Some(Code::F12),
        "Space" => Some(Code::Space),
        "`" => Some(Code::Backquote),
        "Insert" => Some(Code::Insert), "Home" => Some(Code::Home),
        "End" => Some(Code::End), "PageUp" => Some(Code::PageUp),
        "PageDown" => Some(Code::PageDown), "Delete" => Some(Code::Delete),
        "Pause" => Some(Code::Pause), "ScrollLock" => Some(Code::ScrollLock),
        "NumLock" => Some(Code::NumLock),
        s if s.len() == 1 => {
            let c = s.chars().next().unwrap();
            match c {
                'A'..='Z' | 'a'..='z' => {
                    let upper = c.to_ascii_uppercase();
                    match upper {
                        'A' => Some(Code::KeyA), 'B' => Some(Code::KeyB), 'C' => Some(Code::KeyC),
                        'D' => Some(Code::KeyD), 'E' => Some(Code::KeyE), 'F' => Some(Code::KeyF),
                        'G' => Some(Code::KeyG), 'H' => Some(Code::KeyH), 'I' => Some(Code::KeyI),
                        'J' => Some(Code::KeyJ), 'K' => Some(Code::KeyK), 'L' => Some(Code::KeyL),
                        'M' => Some(Code::KeyM), 'N' => Some(Code::KeyN), 'O' => Some(Code::KeyO),
                        'P' => Some(Code::KeyP), 'Q' => Some(Code::KeyQ), 'R' => Some(Code::KeyR),
                        'S' => Some(Code::KeyS), 'T' => Some(Code::KeyT), 'U' => Some(Code::KeyU),
                        'V' => Some(Code::KeyV), 'W' => Some(Code::KeyW), 'X' => Some(Code::KeyX),
                        'Y' => Some(Code::KeyY), 'Z' => Some(Code::KeyZ),
                        _ => None,
                    }
                }
                '0' => Some(Code::Digit0), '1' => Some(Code::Digit1), '2' => Some(Code::Digit2),
                '3' => Some(Code::Digit3), '4' => Some(Code::Digit4), '5' => Some(Code::Digit5),
                '6' => Some(Code::Digit6), '7' => Some(Code::Digit7), '8' => Some(Code::Digit8),
                '9' => Some(Code::Digit9),
                _ => None,
            }
        }
        _ => None,
    }
}

fn register_hotkey(app: &AppHandle, key: &str) -> Result<(), String> {
    let bind = hotkey::HotkeyBind::from_str(key);

    // Always clean up both systems
    let _ = app.global_shortcut().unregister_all();
    hotkey::stop_mouse_hook();

    if bind.is_mouse() {
        let xbutton = match bind {
            hotkey::HotkeyBind::Mouse4 => 1u16,
            hotkey::HotkeyBind::Mouse5 => 2u16,
            _ => unreachable!(),
        };
        hotkey::start_mouse_hook(app, xbutton);
        Ok(())
    } else {
        let code = key_to_code(key).ok_or_else(|| format!("Unknown key: {}", key))?;
        let shortcut = Shortcut::new(None::<Modifiers>, code);
        app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let _ = _app.emit("hotkey-toggle", ());
            }
        }).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn start_engine(state: State<EngineState>, config: ClickConfig) {
    engine::start_engine(&state.0, config);
}

#[tauri::command]
fn stop_engine(state: State<EngineState>) {
    engine::stop_engine(&state.0);
}

#[tauri::command]
fn update_config(state: State<EngineState>, config: ClickConfig) {
    engine::update_config(&state.0, config);
}

#[tauri::command]
fn rebind_hotkey(app: AppHandle, key: String) -> Result<(), String> {
    register_hotkey(&app, &key)
}

#[tauri::command]
fn get_cursor_pos() -> (i32, i32) {
    use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
    use windows::Win32::Foundation::POINT;
    let mut pt = POINT::default();
    unsafe { let _ = GetCursorPos(&mut pt); }
    (pt.x, pt.y)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let engine = engine::create_engine(ClickConfig::default());
    let engine_clone = engine.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(EngineState(engine))
        .invoke_handler(tauri::generate_handler![
            start_engine,
            stop_engine,
            update_config,
            rebind_hotkey,
            get_cursor_pos,
        ])
        .setup(move |app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(engine::run_click_loop(engine_clone, handle.clone()));

            // Register default F6 hotkey
            register_hotkey(&handle, "F6").expect("Failed to register default hotkey");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

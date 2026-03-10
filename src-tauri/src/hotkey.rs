use std::sync::atomic::{AtomicU16, AtomicU32, Ordering};
use std::sync::OnceLock;
use parking_lot::Mutex;
use tauri::{AppHandle, Emitter};
use windows::Win32::Foundation::{LPARAM, LRESULT, WPARAM};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, DispatchMessageW, GetMessageW, PostThreadMessageW,
    SetWindowsHookExW, UnhookWindowsHookEx,
    HHOOK, MSLLHOOKSTRUCT, MSG, WH_MOUSE_LL, WM_QUIT, WM_XBUTTONDOWN,
};

/// Which hotkey is currently bound
#[derive(Debug, Clone, PartialEq)]
pub enum HotkeyBind {
    Keyboard(String),
    Mouse4,
    Mouse5,
}

impl HotkeyBind {
    pub fn from_str(key: &str) -> Self {
        match key {
            "Mouse4" | "mouse4" | "MOUSE4" => HotkeyBind::Mouse4,
            "Mouse5" | "mouse5" | "MOUSE5" => HotkeyBind::Mouse5,
            k => HotkeyBind::Keyboard(k.to_string()),
        }
    }

    pub fn is_mouse(&self) -> bool {
        matches!(self, HotkeyBind::Mouse4 | HotkeyBind::Mouse5)
    }
}

// Atomics for the hook callback (no mutex needed in the hot path)
static TARGET_XBUTTON: AtomicU16 = AtomicU16::new(0);
static HOOK_THREAD_ID: AtomicU32 = AtomicU32::new(0);

// AppHandle needs a mutex but is only accessed from the hook callback
static APP_HANDLE: OnceLock<Mutex<Option<AppHandle>>> = OnceLock::new();

fn app_handle_store() -> &'static Mutex<Option<AppHandle>> {
    APP_HANDLE.get_or_init(|| Mutex::new(None))
}

unsafe extern "system" fn mouse_hook_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 && wparam.0 as u32 == WM_XBUTTONDOWN {
        let mouse_struct = &*(lparam.0 as *const MSLLHOOKSTRUCT);
        let xbutton = (mouse_struct.mouseData >> 16) as u16;
        let target = TARGET_XBUTTON.load(Ordering::Relaxed);

        if target != 0 && xbutton == target {
            if let Some(ref app) = *app_handle_store().lock() {
                let _ = app.emit("hotkey-toggle", ());
            }
        }
    }
    CallNextHookEx(None, code, wparam, lparam)
}

/// Start the mouse hook on a dedicated thread with a message pump
pub fn start_mouse_hook(app: &AppHandle, button: u16) {
    stop_mouse_hook();

    TARGET_XBUTTON.store(button, Ordering::Relaxed);
    *app_handle_store().lock() = Some(app.clone());

    std::thread::spawn(|| {
        unsafe {
            // Store this thread's ID so we can post WM_QUIT to it later
            let tid = windows::Win32::System::Threading::GetCurrentThreadId();
            HOOK_THREAD_ID.store(tid, Ordering::Relaxed);

            let hook = SetWindowsHookExW(
                WH_MOUSE_LL,
                Some(mouse_hook_proc),
                None,
                0,
            );

            if let Ok(hook) = hook {
                let mut msg = MSG::default();
                while GetMessageW(&mut msg, None, 0, 0).as_bool() {
                    let _ = DispatchMessageW(&msg);
                }
                let _ = UnhookWindowsHookEx(hook);
            }

            HOOK_THREAD_ID.store(0, Ordering::Relaxed);
        }
    });
}

/// Stop the mouse hook
pub fn stop_mouse_hook() {
    TARGET_XBUTTON.store(0, Ordering::Relaxed);

    let tid = HOOK_THREAD_ID.load(Ordering::Relaxed);
    if tid != 0 {
        unsafe {
            // Post WM_QUIT to break the message loop
            let _ = PostThreadMessageW(tid, WM_QUIT, WPARAM(0), LPARAM(0));
        }
    }

    *app_handle_store().lock() = None;
}

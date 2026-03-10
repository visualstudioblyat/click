use crate::clicker::MouseButton;
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_MOUSE, MOUSEEVENTF_ABSOLUTE, MOUSEEVENTF_LEFTDOWN,
    MOUSEEVENTF_LEFTUP, MOUSEEVENTF_MIDDLEDOWN, MOUSEEVENTF_MIDDLEUP, MOUSEEVENTF_MOVE,
    MOUSEEVENTF_RIGHTDOWN, MOUSEEVENTF_RIGHTUP, MOUSEINPUT,
};
use windows::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN};

fn button_down_flag(button: MouseButton) -> windows::Win32::UI::Input::KeyboardAndMouse::MOUSE_EVENT_FLAGS {
    match button {
        MouseButton::Left => MOUSEEVENTF_LEFTDOWN,
        MouseButton::Right => MOUSEEVENTF_RIGHTDOWN,
        MouseButton::Middle => MOUSEEVENTF_MIDDLEDOWN,
    }
}

fn button_up_flag(button: MouseButton) -> windows::Win32::UI::Input::KeyboardAndMouse::MOUSE_EVENT_FLAGS {
    match button {
        MouseButton::Left => MOUSEEVENTF_LEFTUP,
        MouseButton::Right => MOUSEEVENTF_RIGHTUP,
        MouseButton::Middle => MOUSEEVENTF_MIDDLEUP,
    }
}

fn screen_to_abs(x: i32, y: i32) -> (i32, i32) {
    let sw = unsafe { GetSystemMetrics(SM_CXSCREEN) };
    let sh = unsafe { GetSystemMetrics(SM_CYSCREEN) };
    let ax = ((x as f64 / sw as f64) * 65535.0) as i32;
    let ay = ((y as f64 / sh as f64) * 65535.0) as i32;
    (ax, ay)
}

/// Send only a mouse button down event
pub fn hold_button(button: MouseButton) {
    let flag = button_down_flag(button);
    let inputs = [INPUT {
        r#type: INPUT_MOUSE,
        Anonymous: INPUT_0 {
            mi: MOUSEINPUT {
                dwFlags: flag,
                ..Default::default()
            },
        },
    }];
    unsafe { SendInput(&inputs, std::mem::size_of::<INPUT>() as i32); }
}

/// Send only a mouse button up event
pub fn release_button(button: MouseButton) {
    let flag = button_up_flag(button);
    let inputs = [INPUT {
        r#type: INPUT_MOUSE,
        Anonymous: INPUT_0 {
            mi: MOUSEINPUT {
                dwFlags: flag,
                ..Default::default()
            },
        },
    }];
    unsafe { SendInput(&inputs, std::mem::size_of::<INPUT>() as i32); }
}

/// Click at `from`, drag to `to` via interpolated move events, then release
pub fn drag_to(button: MouseButton, from: (i32, i32), to: (i32, i32), steps: u32) {
    let steps = steps.max(1);

    // Move to start position
    let (ax, ay) = screen_to_abs(from.0, from.1);
    let move_input = [INPUT {
        r#type: INPUT_MOUSE,
        Anonymous: INPUT_0 {
            mi: MOUSEINPUT {
                dx: ax,
                dy: ay,
                dwFlags: MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE,
                ..Default::default()
            },
        },
    }];
    unsafe { SendInput(&move_input, std::mem::size_of::<INPUT>() as i32); }

    std::thread::sleep(std::time::Duration::from_millis(5));

    // Press button
    hold_button(button);
    std::thread::sleep(std::time::Duration::from_millis(5));

    // Interpolate movement
    for i in 1..=steps {
        let t = i as f64 / steps as f64;
        let cx = from.0 as f64 + (to.0 - from.0) as f64 * t;
        let cy = from.1 as f64 + (to.1 - from.1) as f64 * t;
        let (ax, ay) = screen_to_abs(cx as i32, cy as i32);

        let step_input = [INPUT {
            r#type: INPUT_MOUSE,
            Anonymous: INPUT_0 {
                mi: MOUSEINPUT {
                    dx: ax,
                    dy: ay,
                    dwFlags: MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE,
                    ..Default::default()
                },
            },
        }];
        unsafe { SendInput(&step_input, std::mem::size_of::<INPUT>() as i32); }
        std::thread::sleep(std::time::Duration::from_millis(2));
    }

    // Release button
    std::thread::sleep(std::time::Duration::from_millis(5));
    release_button(button);
}

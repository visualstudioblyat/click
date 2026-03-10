use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_MOUSE, MOUSEEVENTF_ABSOLUTE, MOUSEEVENTF_LEFTDOWN,
    MOUSEEVENTF_LEFTUP, MOUSEEVENTF_MIDDLEDOWN, MOUSEEVENTF_MIDDLEUP, MOUSEEVENTF_MOVE,
    MOUSEEVENTF_RIGHTDOWN, MOUSEEVENTF_RIGHTUP, MOUSEINPUT,
};

#[derive(Debug, Clone, Copy, PartialEq, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MouseButton {
    Left,
    Right,
    Middle,
}

/// Send a single click at current cursor position
pub fn send_click(button: MouseButton) {
    send_click_at(button, None);
}

/// Send a click, optionally at a fixed screen position
pub fn send_click_at(button: MouseButton, position: Option<(i32, i32)>) {
    let (down, up) = match button {
        MouseButton::Left => (MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP),
        MouseButton::Right => (MOUSEEVENTF_RIGHTDOWN, MOUSEEVENTF_RIGHTUP),
        MouseButton::Middle => (MOUSEEVENTF_MIDDLEDOWN, MOUSEEVENTF_MIDDLEUP),
    };

    // If fixed position, move cursor first
    if let Some((x, y)) = position {
        // Convert screen coords to normalized absolute coords (0-65535)
        let screen_w = unsafe { windows::Win32::UI::WindowsAndMessaging::GetSystemMetrics(windows::Win32::UI::WindowsAndMessaging::SM_CXSCREEN) };
        let screen_h = unsafe { windows::Win32::UI::WindowsAndMessaging::GetSystemMetrics(windows::Win32::UI::WindowsAndMessaging::SM_CYSCREEN) };
        let abs_x = ((x as f64 / screen_w as f64) * 65535.0) as i32;
        let abs_y = ((y as f64 / screen_h as f64) * 65535.0) as i32;

        let move_input = [INPUT {
            r#type: INPUT_MOUSE,
            Anonymous: INPUT_0 {
                mi: MOUSEINPUT {
                    dx: abs_x,
                    dy: abs_y,
                    dwFlags: MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE,
                    ..Default::default()
                },
            },
        }];
        unsafe {
            SendInput(&move_input, std::mem::size_of::<INPUT>() as i32);
        }
    }

    let inputs = [
        INPUT {
            r#type: INPUT_MOUSE,
            Anonymous: INPUT_0 {
                mi: MOUSEINPUT {
                    dwFlags: down,
                    ..Default::default()
                },
            },
        },
        INPUT {
            r#type: INPUT_MOUSE,
            Anonymous: INPUT_0 {
                mi: MOUSEINPUT {
                    dwFlags: up,
                    ..Default::default()
                },
            },
        },
    ];

    unsafe {
        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
    }
}

/// Move cursor to screen position
pub fn move_to(x: i32, y: i32) {
    let screen_w = unsafe { windows::Win32::UI::WindowsAndMessaging::GetSystemMetrics(windows::Win32::UI::WindowsAndMessaging::SM_CXSCREEN) };
    let screen_h = unsafe { windows::Win32::UI::WindowsAndMessaging::GetSystemMetrics(windows::Win32::UI::WindowsAndMessaging::SM_CYSCREEN) };
    let abs_x = ((x as f64 / screen_w as f64) * 65535.0) as i32;
    let abs_y = ((y as f64 / screen_h as f64) * 65535.0) as i32;

    let move_input = [INPUT {
        r#type: INPUT_MOUSE,
        Anonymous: INPUT_0 {
            mi: MOUSEINPUT {
                dx: abs_x,
                dy: abs_y,
                dwFlags: MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE,
                ..Default::default()
            },
        },
    }];
    unsafe {
        SendInput(&move_input, std::mem::size_of::<INPUT>() as i32);
    }
}

/// Send a double-click
pub fn send_double_click_at(button: MouseButton, position: Option<(i32, i32)>) {
    send_click_at(button, position);
    // Small delay between clicks for OS to register as double-click
    std::thread::sleep(std::time::Duration::from_millis(30));
    send_click_at(button, position);
}

use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VIRTUAL_KEY,
    VK_A, VK_B, VK_C, VK_D, VK_E, VK_F, VK_G, VK_H, VK_I, VK_J, VK_K, VK_L, VK_M,
    VK_N, VK_O, VK_P, VK_Q, VK_R, VK_S, VK_T, VK_U, VK_V, VK_W, VK_X, VK_Y, VK_Z,
    VK_0, VK_1, VK_2, VK_3, VK_4, VK_5, VK_6, VK_7, VK_8, VK_9,
    VK_F1, VK_F2, VK_F3, VK_F4, VK_F5, VK_F6, VK_F7, VK_F8, VK_F9, VK_F10, VK_F11, VK_F12,
    VK_SPACE, VK_RETURN, VK_TAB, VK_ESCAPE,
    VK_UP, VK_DOWN, VK_LEFT, VK_RIGHT,
    VK_SHIFT, VK_CONTROL, VK_MENU,
};

fn key_to_vk(key: &str) -> Option<VIRTUAL_KEY> {
    match key.to_uppercase().as_str() {
        "A" => Some(VK_A), "B" => Some(VK_B), "C" => Some(VK_C), "D" => Some(VK_D),
        "E" => Some(VK_E), "F" => Some(VK_F), "G" => Some(VK_G), "H" => Some(VK_H),
        "I" => Some(VK_I), "J" => Some(VK_J), "K" => Some(VK_K), "L" => Some(VK_L),
        "M" => Some(VK_M), "N" => Some(VK_N), "O" => Some(VK_O), "P" => Some(VK_P),
        "Q" => Some(VK_Q), "R" => Some(VK_R), "S" => Some(VK_S), "T" => Some(VK_T),
        "U" => Some(VK_U), "V" => Some(VK_V), "W" => Some(VK_W), "X" => Some(VK_X),
        "Y" => Some(VK_Y), "Z" => Some(VK_Z),
        "0" => Some(VK_0), "1" => Some(VK_1), "2" => Some(VK_2), "3" => Some(VK_3),
        "4" => Some(VK_4), "5" => Some(VK_5), "6" => Some(VK_6), "7" => Some(VK_7),
        "8" => Some(VK_8), "9" => Some(VK_9),
        "F1" => Some(VK_F1), "F2" => Some(VK_F2), "F3" => Some(VK_F3), "F4" => Some(VK_F4),
        "F5" => Some(VK_F5), "F6" => Some(VK_F6), "F7" => Some(VK_F7), "F8" => Some(VK_F8),
        "F9" => Some(VK_F9), "F10" => Some(VK_F10), "F11" => Some(VK_F11), "F12" => Some(VK_F12),
        "SPACE" => Some(VK_SPACE),
        "ENTER" | "RETURN" => Some(VK_RETURN),
        "TAB" => Some(VK_TAB),
        "ESCAPE" | "ESC" => Some(VK_ESCAPE),
        "UP" | "ARROWUP" => Some(VK_UP),
        "DOWN" | "ARROWDOWN" => Some(VK_DOWN),
        "LEFT" | "ARROWLEFT" => Some(VK_LEFT),
        "RIGHT" | "ARROWRIGHT" => Some(VK_RIGHT),
        "SHIFT" => Some(VK_SHIFT),
        "CTRL" | "CONTROL" => Some(VK_CONTROL),
        "ALT" => Some(VK_MENU),
        _ => None,
    }
}

/// Send a single keydown + keyup
pub fn send_key(key: &str) {
    let Some(vk) = key_to_vk(key) else { return };

    let inputs = [
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: vk,
                    dwFlags: Default::default(),
                    ..Default::default()
                },
            },
        },
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: vk,
                    dwFlags: KEYEVENTF_KEYUP,
                    ..Default::default()
                },
            },
        },
    ];

    unsafe {
        SendInput(&inputs, std::mem::size_of::<INPUT>() as i32);
    }
}

/// Send keydown, hold for duration_ms, then keyup
pub fn send_key_hold(key: &str, duration_ms: u64) {
    let Some(vk) = key_to_vk(key) else { return };

    let down = [INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: vk,
                dwFlags: Default::default(),
                ..Default::default()
            },
        },
    }];

    unsafe {
        SendInput(&down, std::mem::size_of::<INPUT>() as i32);
    }

    std::thread::sleep(std::time::Duration::from_millis(duration_ms));

    let up = [INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: vk,
                dwFlags: KEYEVENTF_KEYUP,
                ..Default::default()
            },
        },
    }];

    unsafe {
        SendInput(&up, std::mem::size_of::<INPUT>() as i32);
    }
}

use std::f64::consts::PI;

/// Hand-rolled radix-2 Cooley-Tukey FFT.
/// Input must be power-of-2 length. Returns magnitude spectrum.
pub fn fft_magnitudes(signal: &[f64]) -> Vec<f64> {
    let n = signal.len();
    if n == 0 {
        return vec![];
    }

    // Pad to next power of 2
    let n_padded = n.next_power_of_two();
    let mut real = vec![0.0; n_padded];
    let mut imag = vec![0.0; n_padded];
    for (i, &v) in signal.iter().enumerate() {
        real[i] = v;
    }

    fft_in_place(&mut real, &mut imag);

    // Return magnitude of first half (positive frequencies)
    let half = n_padded / 2;
    (0..half)
        .map(|i| (real[i] * real[i] + imag[i] * imag[i]).sqrt())
        .collect()
}

/// Dominant frequency bin index
pub fn dominant_frequency(spectrum: &[f64], sample_rate: f64) -> f64 {
    if spectrum.is_empty() {
        return 0.0;
    }
    let (max_idx, _) = spectrum
        .iter()
        .enumerate()
        .skip(1) // skip DC
        .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
        .unwrap_or((0, &0.0));

    let n = spectrum.len() * 2; // original FFT size
    max_idx as f64 * sample_rate / n as f64
}

fn fft_in_place(real: &mut [f64], imag: &mut [f64]) {
    let n = real.len();
    if n <= 1 {
        return;
    }

    // Bit-reversal permutation
    let mut j = 0;
    for i in 1..n {
        let mut bit = n >> 1;
        while j & bit != 0 {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if i < j {
            real.swap(i, j);
            imag.swap(i, j);
        }
    }

    // Cooley-Tukey iterative FFT
    let mut len = 2;
    while len <= n {
        let half = len / 2;
        let angle = -2.0 * PI / len as f64;
        let wn_r = angle.cos();
        let wn_i = angle.sin();

        for start in (0..n).step_by(len) {
            let mut w_r = 1.0;
            let mut w_i = 0.0;
            for k in 0..half {
                let a = start + k;
                let b = start + k + half;
                let tr = w_r * real[b] - w_i * imag[b];
                let ti = w_r * imag[b] + w_i * real[b];
                real[b] = real[a] - tr;
                imag[b] = imag[a] - ti;
                real[a] += tr;
                imag[a] += ti;
                let new_wr = w_r * wn_r - w_i * wn_i;
                let new_wi = w_r * wn_i + w_i * wn_r;
                w_r = new_wr;
                w_i = new_wi;
            }
        }
        len <<= 1;
    }
}

/// Shannon entropy of click inter-arrival times.
/// Bins intervals into buckets and computes H = -sum(p * log2(p)).
pub fn shannon_entropy(intervals: &[f64]) -> f64 {
    if intervals.len() < 2 {
        return 0.0;
    }

    let n_bins = 16;
    let min = intervals.iter().cloned().fold(f64::INFINITY, f64::min);
    let max = intervals.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let range = max - min;

    if range < 1e-10 {
        return 0.0; // All identical => zero entropy
    }

    let mut bins = vec![0usize; n_bins];
    for &v in intervals {
        let idx = ((v - min) / range * (n_bins as f64 - 1.0)) as usize;
        bins[idx.min(n_bins - 1)] += 1;
    }

    let n = intervals.len() as f64;
    let mut h = 0.0;
    for &count in &bins {
        if count > 0 {
            let p = count as f64 / n;
            h -= p * p.log2();
        }
    }

    // Normalize to 0-1 range (max entropy = log2(n_bins))
    let max_entropy = (n_bins as f64).log2();
    if max_entropy > 0.0 {
        h / max_entropy
    } else {
        0.0
    }
}

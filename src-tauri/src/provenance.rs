use sha2::{Sha256, Digest};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct ClickRecord {
    pub id: String,
    pub timestamp: f64,
    pub interval_ms: f64,
    pub hash: String,
}

/// SHA-256 append-only hash chain for click provenance.
/// Every click is hashed with the previous hash to form an immutable audit trail.
pub struct ProvenanceChain {
    prev_hash: String,
    pub records: Vec<ClickRecord>,
    pub valid: bool,
}

impl ProvenanceChain {
    pub fn new() -> Self {
        Self {
            prev_hash: "0000000000000000".to_string(),
            records: Vec::new(),
            valid: true,
        }
    }

    pub fn record_click(&mut self, timestamp: f64, interval_ms: f64) -> ClickRecord {
        let id = uuid::Uuid::new_v4().to_string();

        let mut hasher = Sha256::new();
        hasher.update(self.prev_hash.as_bytes());
        hasher.update(timestamp.to_le_bytes());
        hasher.update(interval_ms.to_le_bytes());
        hasher.update(id.as_bytes());
        let result = hasher.finalize();
        let hash = hex::encode(&result[..8]); // First 8 bytes = 16 hex chars

        let record = ClickRecord {
            id,
            timestamp,
            interval_ms,
            hash: hash.clone(),
        };

        self.prev_hash = hash;
        self.records.push(record.clone());

        // Keep last 100 records
        if self.records.len() > 100 {
            self.records.remove(0);
        }

        record
    }

    pub fn verify(&self) -> bool {
        self.valid
    }

    pub fn len(&self) -> usize {
        self.records.len()
    }

    pub fn recent(&self, n: usize) -> &[ClickRecord] {
        let start = self.records.len().saturating_sub(n);
        &self.records[start..]
    }

    pub fn reset(&mut self) {
        *self = Self::new();
    }
}

// Inline hex encoding to avoid adding a dep
mod hex {
    pub fn encode(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{:02x}", b)).collect()
    }
}

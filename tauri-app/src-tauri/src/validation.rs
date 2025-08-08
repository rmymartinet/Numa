// src-tauri/src/validation.rs
//! 🛡️ IPC validation and security hardening for Tauri commands
//! 
//! This module provides comprehensive input validation for all IPC commands
//! to prevent malicious or malformed requests from affecting the application.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use thiserror::Error;
use tracing::{warn, debug, error};

/// Rate limiting storage
static RATE_LIMITER: once_cell::sync::Lazy<Arc<Mutex<HashMap<String, Vec<Instant>>>>> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));

/// Configuration for rate limiting per command
const RATE_LIMITS: &[(&str, usize, Duration)] = &[
    ("resize_window", 10, Duration::from_secs(60)),       // 10/min
    ("capture_screen", 30, Duration::from_secs(60)),      // 30/min  
    ("secure_store", 20, Duration::from_secs(60)),        // 20/min
    ("secure_load", 50, Duration::from_secs(60)),         // 50/min
    ("toggle_stealth_cmd", 5, Duration::from_secs(60)),   // 5/min
    ("panel_show", 100, Duration::from_secs(60)),         // 100/min
    ("panel_hide", 100, Duration::from_secs(60)),         // 100/min
];

#[derive(Error, Debug)]
pub enum ValidationError {
    #[error("Input too large: {field} exceeds {max_size} characters")]
    InputTooLarge { field: String, max_size: usize },
    
    #[error("Invalid range: {field} must be between {min} and {max}")]
    InvalidRange { field: String, min: f64, max: f64 },
    
    #[error("Rate limit exceeded for command: {command}")]
    RateLimitExceeded { command: String },
    
    #[error("Invalid characters in {field}: only alphanumeric and basic punctuation allowed")]
    InvalidCharacters { field: String },
    
    #[error("Empty required field: {field}")]
    EmptyField { field: String },
    
    #[error("Suspicious pattern detected in {field}")]
    SuspiciousPattern { field: String },
}

/// Validated window size parameters
#[derive(Deserialize, Serialize, Debug)]
pub struct WindowSize {
    pub width: f64,
    pub height: f64,
}

impl WindowSize {
    /// Validate window dimensions
    pub fn validate(&self) -> Result<(), ValidationError> {
        self.validate_width()?;
        self.validate_height()?;
        Ok(())
    }
    
    fn validate_width(&self) -> Result<(), ValidationError> {
        if !(64.0..=4096.0).contains(&self.width) {
            return Err(ValidationError::InvalidRange {
                field: "width".to_string(),
                min: 64.0,
                max: 4096.0,
            });
        }
        Ok(())
    }
    
    fn validate_height(&self) -> Result<(), ValidationError> {
        if !(32.0..=2160.0).contains(&self.height) {
            return Err(ValidationError::InvalidRange {
                field: "height".to_string(),
                min: 32.0,
                max: 2160.0,
            });
        }
        Ok(())
    }
}

/// Validated secure storage key-value pair
#[derive(Deserialize, Serialize, Debug)]
pub struct SecureKeyValue {
    pub key: String,
    pub value: String,
}

impl SecureKeyValue {
    /// Validate secure storage parameters
    pub fn validate(&self) -> Result<(), ValidationError> {
        self.validate_key()?;
        self.validate_value()?;
        Ok(())
    }
    
    fn validate_key(&self) -> Result<(), ValidationError> {
        if self.key.is_empty() {
            return Err(ValidationError::EmptyField {
                field: "key".to_string(),
            });
        }
        
        if self.key.len() > 64 {
            return Err(ValidationError::InputTooLarge {
                field: "key".to_string(),
                max_size: 64,
            });
        }
        
        // Only allow alphanumeric + basic punctuation for keys
        if !self.key.chars().all(|c| c.is_alphanumeric() || "_.-".contains(c)) {
            return Err(ValidationError::InvalidCharacters {
                field: "key".to_string(),
            });
        }
        
        Ok(())
    }
    
    fn validate_value(&self) -> Result<(), ValidationError> {
        if self.value.len() > 1024 {
            return Err(ValidationError::InputTooLarge {
                field: "value".to_string(),
                max_size: 1024,
            });
        }
        
        // Check for suspicious patterns
        if contains_suspicious_patterns(&self.value) {
            warn!("🚨 Suspicious pattern detected in secure storage value");
            return Err(ValidationError::SuspiciousPattern {
                field: "value".to_string(),
            });
        }
        
        Ok(())
    }
}

/// Validated secure storage key for load/delete operations
#[derive(Deserialize, Serialize, Debug)]
pub struct SecureKey {
    pub key: String,
}

impl SecureKey {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.key.is_empty() {
            return Err(ValidationError::EmptyField {
                field: "key".to_string(),
            });
        }
        
        if self.key.len() > 64 {
            return Err(ValidationError::InputTooLarge {
                field: "key".to_string(),
                max_size: 64,
            });
        }
        
        if !self.key.chars().all(|c| c.is_alphanumeric() || "_.-".contains(c)) {
            return Err(ValidationError::InvalidCharacters {
                field: "key".to_string(),
            });
        }
        
        Ok(())
    }
}

/// Check if input contains suspicious patterns
fn contains_suspicious_patterns(input: &str) -> bool {
    let suspicious_patterns = [
        // Path traversal
        "../", "..\\", "..:",
        // Script injection
        "<script", "</script", "javascript:",
        // Command injection
        "|", "&", ";", "`", "$(",
        // SQL injection indicators
        "DROP ", "SELECT ", "INSERT ", "UPDATE ", "DELETE ",
        // Protocol handlers
        "file://", "data://", "javascript:",
    ];
    
    let input_lower = input.to_lowercase();
    suspicious_patterns.iter().any(|pattern| input_lower.contains(pattern))
}

/// Rate limiting implementation
pub fn check_rate_limit(command: &str) -> Result<(), ValidationError> {
    let now = Instant::now();
    let mut limiter = RATE_LIMITER.lock().unwrap();
    
    // Find rate limit config for this command
    let (max_requests, window) = RATE_LIMITS
        .iter()
        .find(|(cmd, _, _)| *cmd == command)
        .map(|(_, max, dur)| (*max, *dur))
        .unwrap_or((100, Duration::from_secs(60))); // Default: 100 requests per minute
    
    // Get or create request history for this command
    let requests = limiter.entry(command.to_string()).or_insert_with(Vec::new);
    
    // Remove old requests outside the time window
    requests.retain(|&timestamp| now.duration_since(timestamp) <= window);
    
    // Check if we're over the limit
    if requests.len() >= max_requests {
        warn!("🚨 Rate limit exceeded for command '{}': {} requests in {:?}", 
              command, requests.len(), window);
        return Err(ValidationError::RateLimitExceeded {
            command: command.to_string(),
        });
    }
    
    // Add current request
    requests.push(now);
    
    debug!("✅ Rate limit check passed for '{}': {}/{} requests", 
           command, requests.len(), max_requests);
    
    Ok(())
}

/// Middleware wrapper for IPC commands with validation and rate limiting
pub fn validate_and_rate_limit<T, F, R>(
    command: &str,
    input: T,
    handler: F,
) -> Result<R, String>
where
    T: ValidatedInput,
    F: FnOnce(T) -> Result<R, String>,
{
    // Rate limiting
    if let Err(e) = check_rate_limit(command) {
        error!("🚨 Command '{}' blocked by rate limiter: {}", command, e);
        return Err(e.to_string());
    }
    
    // Input validation
    if let Err(e) = input.validate() {
        error!("🚨 Command '{}' failed validation: {}", command, e);
        return Err(e.to_string());
    }
    
    debug!("✅ Command '{}' passed validation and rate limiting", command);
    
    // Execute the actual command
    handler(input)
}

/// Trait for validatable input types
pub trait ValidatedInput {
    fn validate(&self) -> Result<(), ValidationError>;
}

impl ValidatedInput for WindowSize {
    fn validate(&self) -> Result<(), ValidationError> {
        WindowSize::validate(self)
    }
}

impl ValidatedInput for SecureKeyValue {
    fn validate(&self) -> Result<(), ValidationError> {
        SecureKeyValue::validate(self)
    }
}

impl ValidatedInput for SecureKey {
    fn validate(&self) -> Result<(), ValidationError> {
        SecureKey::validate(self)
    }
}

/// Utility to clean up old rate limit entries periodically
pub fn cleanup_rate_limiter() {
    let now = Instant::now();
    let mut limiter = RATE_LIMITER.lock().unwrap();
    
    limiter.retain(|_, requests| {
        requests.retain(|&timestamp| now.duration_since(timestamp) <= Duration::from_secs(3600));
        !requests.is_empty()
    });
    
    debug!("🧹 Rate limiter cleaned up, {} commands tracked", limiter.len());
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_window_size_validation() {
        // Valid sizes
        let valid = WindowSize { width: 800.0, height: 600.0 };
        assert!(valid.validate().is_ok());
        
        // Invalid width
        let invalid_width = WindowSize { width: 32.0, height: 600.0 };
        assert!(invalid_width.validate().is_err());
        
        // Invalid height  
        let invalid_height = WindowSize { width: 800.0, height: 10.0 };
        assert!(invalid_height.validate().is_err());
    }
    
    #[test]
    fn test_secure_key_validation() {
        // Valid key
        let valid = SecureKey { key: "user_token".to_string() };
        assert!(valid.validate().is_ok());
        
        // Empty key
        let empty = SecureKey { key: "".to_string() };
        assert!(empty.validate().is_err());
        
        // Too long
        let too_long = SecureKey { key: "a".repeat(100) };
        assert!(too_long.validate().is_err());
        
        // Invalid characters
        let invalid_chars = SecureKey { key: "key with spaces".to_string() };
        assert!(invalid_chars.validate().is_err());
    }
    
    #[test]
    fn test_suspicious_patterns() {
        assert!(contains_suspicious_patterns("../etc/passwd"));
        assert!(contains_suspicious_patterns("<script>alert('xss')</script>"));
        assert!(contains_suspicious_patterns("DROP TABLE users"));
        assert!(!contains_suspicious_patterns("normal text content"));
    }
    
    #[test] 
    fn test_rate_limiting() {
        // First request should pass
        assert!(check_rate_limit("test_command").is_ok());
        
        // Simulate rapid requests
        for _ in 0..10 {
            let _ = check_rate_limit("test_command");
        }
        
        // Should eventually hit rate limit
        // Note: This test might be flaky depending on timing
    }
}
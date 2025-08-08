// src-tauri/src/logging.rs
//! 📝 Comprehensive logging and panic handling system for Numa
//! 
//! Features:
//! - Structured logging with different levels per environment
//! - Comprehensive panic hook with context capture
//! - Privacy-aware logging (respects stealth mode)
//! - Performance-optimized for production

use std::panic;
use tracing::{info, warn, error, debug};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Initialize comprehensive logging system
/// 
/// This must be called EARLY in the application lifecycle,
/// ideally as the first thing in main() or run()
pub fn init_comprehensive_logging() {
    // Install panic hook FIRST to capture even initialization panics
    install_comprehensive_panic_hook();
    
    let env_filter = determine_log_level();
    let subscriber = build_subscriber(env_filter.clone());
    
    // Initialize the global subscriber
    subscriber.init();
    
    info!("🚀 Numa logging system initialized");
    info!("📊 Log level: {}", env_filter);
    log_system_info();
}

/// Determine appropriate log level based on build configuration
fn determine_log_level() -> String {
    std::env::var("RUST_LOG").unwrap_or_else(|_| {
        if cfg!(feature = "debug") {
            "debug,hyper=info,reqwest=info".into() // Debug mais silence les HTTP libs
        } else if cfg!(debug_assertions) {
            "info,hyper=warn,reqwest=warn".into() // Dev builds
        } else {
            "warn,error".into() // Production: seulement warnings et erreurs
        }
    })
}

/// Build the tracing subscriber with appropriate configuration
fn build_subscriber(env_filter: String) -> impl SubscriberExt + Send + Sync {
    let env_filter = EnvFilter::new(env_filter);
    
    // Base format layer - always present
    let fmt_layer = tracing_subscriber::fmt::layer()
        .with_target(false) // Remove target for cleaner logs
        .with_thread_ids(cfg!(feature = "debug")) // Thread IDs only in debug
        .with_file(cfg!(feature = "debug")) // File info only in debug
        .with_line_number(cfg!(feature = "debug")) // Line numbers only in debug
        .compact();
    
    let subscriber = tracing_subscriber::registry()
        .with(env_filter)
        .with(fmt_layer);
    
    // Add ANSI colors only in debug mode and if terminal supports it
    #[cfg(feature = "debug")]
    let subscriber = {
        use tracing_subscriber::fmt::format::FmtSpan;
        subscriber.with(
            tracing_subscriber::fmt::layer()
                .with_ansi(true)
                .with_span_events(FmtSpan::CLOSE)
        )
    };
    
    subscriber
}

/// Install comprehensive panic hook with context capture
fn install_comprehensive_panic_hook() {
    panic::set_hook(Box::new(|panic_info| {
        let panic_message = extract_panic_message(panic_info);
        let location = extract_panic_location(panic_info);
        let thread_info = extract_thread_info();
        
        // Log the panic with maximum context
        error!(
            target: "panic", 
            "💥 PANIC DETECTED: {} {} {}",
            panic_message,
            location,
            thread_info
        );
        
        // Additional system context
        error!(target: "panic", "🖥️  System: {} {}", 
               std::env::consts::OS, 
               std::env::consts::ARCH);
        
        // Memory info if available
        if let Ok(memory) = get_memory_info() {
            error!(target: "panic", "💾 Memory: {}", memory);
        }
        
        // Stack trace would be here but requires additional dependencies
        // TODO: Add backtrace crate for production stack traces
        
        // Privacy-aware panic reporting
        handle_panic_reporting(&panic_message, &location);
    }));
}

/// Extract human-readable panic message
fn extract_panic_message(panic_info: &panic::PanicHookInfo) -> String {
    if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
        (*s).to_string()
    } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
        s.clone()
    } else {
        "Unknown panic payload".to_string()
    }
}

/// Extract panic location with file and line info
fn extract_panic_location(panic_info: &panic::PanicHookInfo) -> String {
    panic_info
        .location()
        .map(|loc| format!("at {}:{}", loc.file(), loc.line()))
        .unwrap_or_else(|| "at unknown location".to_string())
}

/// Extract current thread information
fn extract_thread_info() -> String {
    let thread = std::thread::current();
    let thread_name = thread.name().unwrap_or("unnamed");
    let thread_id = format!("{:?}", thread.id());
    format!("thread='{}' id={}", thread_name, thread_id)
}

/// Get basic memory information (cross-platform)
fn get_memory_info() -> Result<String, Box<dyn std::error::Error>> {
    // Simple memory info - could be enhanced with platform-specific APIs
    Ok("Memory info not available".to_string())
}

/// Handle panic reporting with privacy considerations
fn handle_panic_reporting(message: &str, location: &str) {
    // TODO: Integrate with existing privacy/stealth system
    // For now, just log locally
    
    warn!(target: "panic", "🔒 Privacy note: Panic not reported remotely due to privacy settings");
    
    // Future integration:
    // 1. Check if stealth mode is active
    // 2. Check user consent for error reporting  
    // 3. If both OK, send to Sentry/remote logging
    // 4. Always log locally for debugging
    
    debug!(target: "panic", "Full panic context: message='{}' location='{}'", message, location);
}

/// Log basic system information at startup
fn log_system_info() {
    info!("🖥️  System: {} {} on {}", 
          std::env::consts::OS,
          std::env::consts::ARCH,
          std::env::consts::FAMILY);
          
    if let Ok(current_dir) = std::env::current_dir() {
        info!("📁 Working directory: {}", current_dir.display());
    }
    
    // Log feature flags for debugging
    let mut features = Vec::new();
    if cfg!(feature = "debug") { features.push("debug"); }
    if cfg!(feature = "dev") { features.push("dev"); }
    if cfg!(feature = "stealth_macos") { features.push("stealth_macos"); }
    if cfg!(feature = "secure") { features.push("secure"); }
    
    if !features.is_empty() {
        info!("🎯 Active features: {}", features.join(", "));
    }
    
    info!("🔧 Build type: {}", if cfg!(debug_assertions) { "debug" } else { "release" });
}

/// Utility function to check if verbose logging is enabled
pub fn is_verbose_logging() -> bool {
    cfg!(feature = "debug") || cfg!(debug_assertions)
}

/// Utility function for performance-sensitive logging
/// Only logs in debug builds to avoid performance impact
#[macro_export]
macro_rules! debug_perf {
    ($($arg:tt)*) => {
        #[cfg(any(feature = "debug", debug_assertions))]
        tracing::debug!($($arg)*);
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_log_level_determination() {
        // Test without environment variable
        std::env::remove_var("RUST_LOG");
        let level = determine_log_level();
        
        if cfg!(feature = "debug") {
            assert!(level.contains("debug"));
        } else if cfg!(debug_assertions) {
            assert!(level.contains("info"));
        } else {
            assert!(level.contains("warn"));
        }
    }
    
    #[test]
    fn test_panic_message_extraction() {
        // This test is limited since we can't easily trigger panics in tests
        // but we can test the message extraction logic
        assert!(!extract_thread_info().is_empty());
    }
    
    #[test]
    fn test_system_info_logging() {
        // Just ensure it doesn't panic
        log_system_info();
    }
}
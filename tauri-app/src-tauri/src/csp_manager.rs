// src-tauri/src/csp_manager.rs
//! 🛡️ Dynamic CSP (Content Security Policy) management
//! 
//! Manages CSP policies based on:
//! - User consent for telemetry/observability
//! - Stealth mode status
//! - Security requirements

use tauri::{AppHandle, Manager};
use tracing::{info, debug};

/// Generate CSP policy based on current application state
#[tauri::command]
pub fn get_dynamic_csp_policy(app: AppHandle) -> String {
    let stealth_active = app.state::<crate::stealth::StealthState>().is_active();
    let telemetry_consent = check_telemetry_consent();
    
    debug!("🛡️ Generating CSP policy - stealth: {}, telemetry: {}", 
           stealth_active, telemetry_consent);
    
    let mut csp = build_base_csp();
    
    // Add telemetry endpoints only if consented AND not in stealth mode
    if telemetry_consent && !stealth_active {
        add_telemetry_csp(&mut csp);
        info!("🔗 CSP: Telemetry endpoints enabled");
    } else {
        info!("🔒 CSP: Telemetry endpoints blocked (stealth={}, consent={})", 
              stealth_active, telemetry_consent);
    }
    
    // Add development endpoints in debug builds
    add_development_csp(&mut csp);
    
    debug!("🛡️ Final CSP: {}", csp);
    csp
}

/// Check if user has consented to telemetry
/// TODO: Implement proper consent checking (localStorage, config file, etc.)
fn check_telemetry_consent() -> bool {
    // For now, return false to be privacy-first
    // This should check actual user consent from storage
    false
}

/// Build base CSP policy that's always applied
fn build_base_csp() -> String {
    let mut policy = Vec::new();
    
    // Core policies
    policy.push("default-src 'self'");
    policy.push("script-src 'self' 'unsafe-inline'"); // Unsafe-inline needed for React
    policy.push("style-src 'self' 'unsafe-inline'");  // Unsafe-inline needed for styling
    policy.push("img-src 'self' data: blob:");         // Data URLs for images
    policy.push("font-src 'self' data:");              // Data URLs for fonts
    
    // Object and embed policies
    policy.push("object-src 'none'");
    policy.push("embed-src 'none'");
    
    // Form actions
    policy.push("form-action 'self'");
    
    // Base connect-src (will be extended conditionally)
    policy.push("connect-src 'self'");
    
    policy.join("; ")
}

/// Add telemetry-related CSP directives
fn add_telemetry_csp(csp: &mut String) {
    // Replace connect-src with version that includes telemetry endpoints
    *csp = csp.replace(
        "connect-src 'self'", 
        "connect-src 'self' https://api.sentry.io https://*.sentry.io wss://api.sentry.io"
    );
    
    // Add report-uri for CSP violations (only if telemetry enabled)
    csp.push_str("; report-uri https://api.sentry.io/security/?sentry_key=YOUR_KEY");
}

/// Add development-specific CSP directives
fn add_development_csp(csp: &mut String) {
    #[cfg(debug_assertions)]
    {
        // Allow localhost connections for development
        *csp = csp.replace(
            "connect-src 'self'",
            "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*"
        );
        
        // Allow unsafe-eval in development for better debugging
        *csp = csp.replace(
            "script-src 'self' 'unsafe-inline'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        );
        
        debug!("🔧 CSP: Development directives added");
    }
}

/// Update CSP based on stealth mode changes
pub fn on_stealth_changed(_app: &AppHandle, stealth_active: bool) {
    if stealth_active {
        info!("🕵️ Stealth mode activated - CSP will block telemetry");
        // In stealth mode, ensure no external connections
        // This would require updating the webview CSP dynamically
        // For now, we log the intent
    } else {
        info!("🌐 Stealth mode deactivated - CSP may allow telemetry if consented");
    }
}

/// Validate CSP policy for common security issues
fn validate_csp_policy(policy: &str) -> Vec<String> {
    let mut warnings = Vec::new();
    
    // Check for unsafe directives
    if policy.contains("'unsafe-eval'") && !cfg!(debug_assertions) {
        warnings.push("⚠️ CSP contains 'unsafe-eval' in production".to_string());
    }
    
    if policy.contains("'unsafe-inline'") {
        warnings.push("⚠️ CSP contains 'unsafe-inline' (consider nonce-based CSP)".to_string());
    }
    
    // Check for overly permissive policies
    if policy.contains("*") {
        warnings.push("⚠️ CSP contains wildcard (*) - consider restricting".to_string());
    }
    
    // Check for missing security headers
    if !policy.contains("object-src") {
        warnings.push("⚠️ CSP missing object-src directive".to_string());
    }
    
    if !warnings.is_empty() {
        info!("🛡️ CSP validation warnings: {:?}", warnings);
    }
    
    warnings
}

/// Get CSP policy for specific use case
#[tauri::command] 
pub fn get_csp_for_context(context: String) -> Result<String, String> {
    match context.as_str() {
        "main" => {
            let policy = build_base_csp();
            validate_csp_policy(&policy);
            Ok(policy)
        }
        "panel" => {
            // Panel might need more restrictive CSP
            let mut policy = build_base_csp();
            policy = policy.replace("'unsafe-inline'", ""); // Remove unsafe-inline for panel
            Ok(policy)
        }
        _ => Err(format!("Unknown CSP context: {}", context))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_base_csp_generation() {
        let csp = build_base_csp();
        assert!(csp.contains("default-src 'self'"));
        assert!(csp.contains("object-src 'none'"));
        assert!(csp.contains("connect-src 'self'"));
    }
    
    #[test]
    fn test_csp_validation() {
        let unsafe_policy = "script-src 'self' 'unsafe-eval'; object-src *";
        let warnings = validate_csp_policy(unsafe_policy);
        
        assert!(warnings.len() > 0);
        assert!(warnings.iter().any(|w| w.contains("unsafe-eval")));
        assert!(warnings.iter().any(|w| w.contains("wildcard")));
    }
    
    #[test]
    fn test_telemetry_csp_addition() {
        let mut base_csp = build_base_csp();
        add_telemetry_csp(&mut base_csp);
        
        assert!(base_csp.contains("sentry.io"));
        assert!(base_csp.contains("report-uri"));
    }
}
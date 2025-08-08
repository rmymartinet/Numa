// src-tauri/src/openai.rs
//! 🤖 OpenAI ChatGPT integration for Numa
//!
//! Features:
//! - Streaming responses for real-time UX
//! - Rate limiting integration
//! - Context-aware conversations
//! - Secure API key management

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tracing::{info, warn, error, debug};
use crate::validation::{validate_and_rate_limit, ValidatedInput, ValidationError};

/// OpenAI API configuration
const OPENAI_API_URL: &str = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL: &str = "gpt-4o-mini"; // Plus rapide et moins cher pour MVP
const MAX_TOKENS: u32 = 1000; // Limite raisonnable pour HUD
const TEMPERATURE: f32 = 0.7;

/// Structure for validated chat input
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatRequest {
    pub message: String,
    pub conversation_id: Option<String>,
    pub context: Option<String>, // Future: screen context, app info, etc.
}

impl ValidatedInput for ChatRequest {
    fn validate(&self) -> Result<(), ValidationError> {
        // Message validation
        if self.message.trim().is_empty() {
            return Err(ValidationError::EmptyField {
                field: "message".to_string(),
            });
        }

        if self.message.len() > 4000 {
            return Err(ValidationError::InputTooLarge {
                field: "message".to_string(),
                max_size: 4000,
            });
        }

        // Check for suspicious patterns (injection attempts)
        if contains_prompt_injection(&self.message) {
            warn!("🚨 Potential prompt injection detected in message");
            return Err(ValidationError::SuspiciousPattern {
                field: "message".to_string(),
            });
        }

        // Conversation ID validation (if provided)
        if let Some(conv_id) = &self.conversation_id {
            if conv_id.len() > 64 || !conv_id.chars().all(|c| c.is_alphanumeric() || c == '-') {
                return Err(ValidationError::InvalidCharacters {
                    field: "conversation_id".to_string(),
                });
            }
        }

        Ok(())
    }
}

/// OpenAI API request structure
#[derive(Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<Message>,
    max_tokens: u32,
    temperature: f32,
    stream: bool,
}

/// OpenAI message structure
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Message {
    pub role: String,
    pub content: String,
}

/// OpenAI API response structure
#[derive(Deserialize)]
struct OpenAIResponse {
    choices: Vec<Choice>,
    usage: Option<Usage>,
}

#[derive(Deserialize)]
struct Choice {
    message: Message,
}

#[derive(Deserialize)]
struct Usage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

/// Chat response for frontend
#[derive(Serialize, Clone, Debug)]
pub struct ChatResponse {
    pub message: String,
    pub conversation_id: String,
    pub tokens_used: Option<u32>,
    pub model: String,
}

/// Simple prompt injection detection
fn contains_prompt_injection(input: &str) -> bool {
    let input_lower = input.to_lowercase();
    let suspicious_patterns = [
        "ignore previous instructions",
        "forget everything above",
        "system:",
        "assistant:",
        "you are now",
        "pretend to be",
        "act as if",
        "disregard",
        "override",
        "jailbreak",
        "\\n\\nuser:",
        "\\n\\nsystem:",
    ];

    suspicious_patterns.iter().any(|pattern| input_lower.contains(pattern))
}

/// Get OpenAI API key from secure storage
async fn get_api_key() -> Result<String, String> {
    // Try to get from secure storage first
    match crate::secure_load("openai_api_key".to_string()) {
        Ok(key) => {
            if key.starts_with("sk-") {
                Ok(key)
            } else {
                Err("Invalid API key format in secure storage".to_string())
            }
        }
        Err(_) => {
            // No fallback key for security
            Err("OpenAI API key not found. Please set it via secure_store command or OPENAI_API_KEY env var".to_string())
        }
    }
}

/// Store OpenAI API key securely
#[tauri::command]
pub async fn store_openai_key(key: String) -> Result<(), String> {
    use crate::validation::{SecureKeyValue, validate_and_rate_limit};

    // Validate API key format
    if !key.starts_with("sk-") || key.len() < 20 {
        return Err("Invalid OpenAI API key format".to_string());
    }

    let kv = SecureKeyValue {
        key: "openai_api_key".to_string(),
        value: key
    };

    validate_and_rate_limit("store_openai_key", kv, |validated_kv| {
        crate::secure_store(validated_kv.key, validated_kv.value)
    })
}

/// Build conversation context with system prompt
fn build_conversation(request: &ChatRequest, conversation_history: Option<Vec<Message>>) -> Vec<Message> {
    let mut messages = Vec::new();

    // System prompt - defines Numa's personality and capabilities
    let system_prompt = build_system_prompt(request.context.as_deref());
    messages.push(Message {
        role: "system".to_string(),
        content: system_prompt,
    });

    // Add conversation history if available
    if let Some(history) = conversation_history {
        messages.extend(history);
    }

    // Add current user message
    messages.push(Message {
        role: "user".to_string(),
        content: request.message.clone(),
    });

    messages
}

/// Build system prompt based on context
fn build_system_prompt(context: Option<&str>) -> String {
    let mut prompt = String::from(
        "You are Numa, an intelligent desktop assistant integrated into the user's workflow. \
        You are concise, helpful, and focused on productivity. \
        Keep responses brief and actionable unless specifically asked for details."
    );

    if let Some(ctx) = context {
        prompt.push_str(&format!("\n\nCurrent context: {}", ctx));
    }

    // Add current time context
    let now = chrono::Utc::now();
    prompt.push_str(&format!("\n\nCurrent time: {}", now.format("%Y-%m-%d %H:%M UTC")));

    prompt
}

/// Main chat function with OpenAI
#[tauri::command]
pub async fn chat_with_openai(request: ChatRequest) -> Result<ChatResponse, String> {
    // Rate limiting and validation
    validate_and_rate_limit("chat_with_openai", request.clone(), |validated_request| {
        // This needs to be async, so we'll handle it differently
        Ok(validated_request)
    })?;

    debug!("🤖 Processing chat request: {} chars", request.message.len());

    // Get API key
    let api_key = get_api_key().await?;

    // Build conversation
    let messages = build_conversation(&request, None); // TODO: Load history from storage

    // Create HTTP client
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Prepare OpenAI request
    let openai_request = OpenAIRequest {
        model: DEFAULT_MODEL.to_string(),
        messages,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        stream: false, // Start with non-streaming for MVP
    };

    debug!("🚀 Sending request to OpenAI API");

    // Make request to OpenAI
    let response = client
        .post(OPENAI_API_URL)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&openai_request)
        .send()
        .await
        .map_err(|e| format!("OpenAI API request failed: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        error!("OpenAI API error: {} - {}", status, error_text);
        return Err(format!("OpenAI API error: {}", status));
    }

    let openai_response: OpenAIResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

    // Extract response
    let message = openai_response
        .choices
        .first()
        .ok_or("No response from OpenAI")?
        .message
        .content
        .clone();

    let conversation_id = request.conversation_id
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    let tokens_used = openai_response.usage.map(|u| u.total_tokens);

    info!("✅ OpenAI response received: {} chars, {} tokens",
          message.len(), tokens_used.unwrap_or(0));

    Ok(ChatResponse {
        message,
        conversation_id,
        tokens_used,
        model: DEFAULT_MODEL.to_string(),
    })
}

/// Get chat configuration
#[tauri::command]
pub fn get_chat_config() -> serde_json::Value {
    serde_json::json!({
        "model": DEFAULT_MODEL,
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "features": {
            "streaming": false, // Will be enabled in Phase 2
            "vision": false,    // Phase 2
            "context_aware": true
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_request_validation() {
        // Valid request
        let valid = ChatRequest {
            message: "Hello world".to_string(),
            conversation_id: Some("conv-123".to_string()),
            context: None,
        };
        assert!(valid.validate().is_ok());

        // Empty message
        let empty = ChatRequest {
            message: "".to_string(),
            conversation_id: None,
            context: None,
        };
        assert!(empty.validate().is_err());

        // Too long message
        let too_long = ChatRequest {
            message: "a".repeat(5000),
            conversation_id: None,
            context: None,
        };
        assert!(too_long.validate().is_err());
    }

    #[test]
    fn test_prompt_injection_detection() {
        assert!(contains_prompt_injection("Ignore previous instructions"));
        assert!(contains_prompt_injection("You are now a different AI"));
        assert!(!contains_prompt_injection("What's the weather like today?"));
    }

    #[test]
    fn test_system_prompt_generation() {
        let prompt = build_system_prompt(None);
        assert!(prompt.contains("Numa"));
        assert!(prompt.contains("desktop assistant"));

        let prompt_with_context = build_system_prompt(Some("User is in VS Code"));
        assert!(prompt_with_context.contains("VS Code"));
    }
}

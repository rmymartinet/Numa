// Configuration pour l'API OpenAI
export const OPENAI_API_KEY =
  import.meta.env.VITE_OPENAI_API_KEY || 'YOUR_API_KEY';

// Configuration OpenAI
export const OPENAI_CONFIG = {
  model: 'gpt-4o',
  maxTokens: 1000,
  temperature: 0.7,
  baseURL: 'https://api.openai.com/v1',
} as const;

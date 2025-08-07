import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../utils/storage';

interface ApiConfigProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

const ApiConfig: React.FC<ApiConfigProps> = ({ isVisible, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [storedApiKey] = useLocalStorage('openai_api_key', '');

  useEffect(() => {
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, [storedApiKey]);

  const validateApiKey = async (key: string) => {
    if (!key.startsWith('sk-')) {
      return { valid: false, message: 'La clé API doit commencer par "sk-"' };
    }

    setIsValidating(true);
    setValidationMessage('Validation en cours...');

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { valid: true, message: 'Clé API valide !' };
      } else {
        return { valid: false, message: 'Clé API invalide ou expirée' };
      }
    } catch (error) {
      return { valid: false, message: 'Erreur de connexion lors de la validation' };
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setValidationMessage('Veuillez entrer une clé API');
      return;
    }

    const validation = await validateApiKey(apiKey);
    setValidationMessage(validation.message);

    if (validation.valid) {
      onSave(apiKey);
      onClose();
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setValidationMessage('Veuillez entrer une clé API');
      return;
    }

    const validation = await validateApiKey(apiKey);
    setValidationMessage(validation.message);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🔑</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Configuration API OpenAI
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Configurez votre clé API pour utiliser l'analyse IA
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Clé API OpenAI
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Validation Message */}
          {validationMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              validationMessage.includes('valide') 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}>
              {validationMessage}
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Votre clé API est stockée localement sur votre ordinateur</p>
            <p>• Elle n'est jamais envoyée à nos serveurs</p>
            <p>• Obtenez votre clé sur{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                platform.openai.com
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            Annuler
          </button>
          
          <button
            onClick={handleTest}
            disabled={isValidating || !apiKey.trim()}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
          >
            {isValidating ? 'Test...' : 'Tester'}
          </button>
          
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiConfig; 
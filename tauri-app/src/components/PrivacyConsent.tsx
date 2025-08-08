import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { errorReporter } from '../utils/errorReporting';
import { metricsTracker } from '../utils/metrics';

interface PrivacyConsentProps {
  onClose?: () => void;
  show?: boolean;
}

const PrivacyConsent: React.FC<PrivacyConsentProps> = ({ onClose, show = false }) => {
  const [consents, setConsents] = useState({
    errorReporting: false,
    logging: false,
    metrics: false,
  });

  useEffect(() => {
    // Charger les consentements existants
    const loadConsents = () => {
      try {
        const errorConsent = localStorage.getItem('numa_error_reporting_consent');
        const loggingConsent = localStorage.getItem('numa_logging_consent');
        const metricsConsent = localStorage.getItem('numa_metrics_consent');

        setConsents({
          errorReporting: errorConsent ? JSON.parse(errorConsent) : false,
          logging: loggingConsent ? JSON.parse(loggingConsent) : false,
          metrics: metricsConsent ? JSON.parse(metricsConsent) : false,
        });
      } catch (error) {
        console.error('Erreur lors du chargement des consentements:', error);
      }
    };

    loadConsents();
  }, []);

  const handleConsentChange = (type: keyof typeof consents, value: boolean) => {
    setConsents(prev => ({ ...prev, [type]: value }));

    // Appliquer le consentement
    switch (type) {
      case 'errorReporting':
        errorReporter.setUserConsent(value);
        break;
      case 'logging':
        logger.setUserConsent(value);
        break;
      case 'metrics':
        metricsTracker.setUserConsent(value);
        break;
    }

    // Sauvegarder
    try {
      localStorage.setItem(`numa_${type}_consent`, JSON.stringify(value));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du consentement:', error);
    }
  };

  const handleSave = () => {
    logger.info('Préférences de confidentialité mises à jour', { consents });
    onClose?.();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Confidentialité et Observabilité
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Numa collecte des données pour améliorer l'expérience utilisateur et diagnostiquer les problèmes.
            Vous pouvez contrôler ce qui est collecté :
          </p>

          {/* Error Reporting */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="errorReporting"
              checked={consents.errorReporting}
              onChange={(e) => handleConsentChange('errorReporting', e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="errorReporting" className="block text-sm font-medium text-gray-900 dark:text-white">
                Rapport d'erreurs
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Envoyer automatiquement les erreurs pour améliorer la stabilité
              </p>
            </div>
          </div>

          {/* Logging */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="logging"
              checked={consents.logging}
              onChange={(e) => handleConsentChange('logging', e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="logging" className="block text-sm font-medium text-gray-900 dark:text-white">
                Logs détaillés
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Collecter les logs pour le débogage et l'analyse
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="metrics"
              checked={consents.metrics}
              onChange={(e) => handleConsentChange('metrics', e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="metrics" className="block text-sm font-medium text-gray-900 dark:text-white">
                Métriques d'usage
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Analyser l'utilisation pour améliorer les performances
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Enregistrer
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Annuler
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>
            Ces paramètres peuvent être modifiés à tout moment dans les paramètres.
            Aucune donnée personnelle n'est collectée.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsent;

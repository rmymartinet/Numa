import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { errorReporter } from '../utils/errorReporting';
import { metricsTracker } from '../utils/metrics';
import AccessibleModal from './ui/AccessibleModal';
import AccessibleButton from './ui/AccessibleButton';

interface PrivacyConsentProps {
  onClose: () => void;
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

  return (
    <AccessibleModal
      isOpen={show}
      onClose={onClose}
      title="Confidentialité et Observabilité"
      size="md"
    >

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
          <AccessibleButton
            onClick={handleSave}
            variant="primary"
            className="flex-1"
          >
            Enregistrer
          </AccessibleButton>
          <AccessibleButton
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Annuler
          </AccessibleButton>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>
            Ces paramètres peuvent être modifiés à tout moment dans les paramètres.
            Aucune donnée personnelle n'est collectée.
          </p>
        </div>
    </AccessibleModal>
  );
};

export default PrivacyConsent;

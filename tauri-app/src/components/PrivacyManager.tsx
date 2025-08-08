import React, { useState, useEffect } from 'react';
import { usePrivacyManager } from '../utils/privacyManager';
import { useSecureStorage } from '../utils/secureStorage';
import AccessibleModal from './ui/AccessibleModal';
import AccessibleButton from './ui/AccessibleButton';

interface PrivacyManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyManager: React.FC<PrivacyManagerProps> = ({ isOpen, onClose }) => {
  const { getConsent, updateConsent, hasConsent, isDoNotTrackActive, resetConsent, clearAllData } = usePrivacyManager();
  const { hasSensitiveData, clearAll } = useSecureStorage();
  
  const [consent, setConsent] = useState(getConsent());
  const [doNotTrack, setDoNotTrack] = useState(isDoNotTrackActive());
  const [hasSecureData, setHasSecureData] = useState(false);

  useEffect(() => {
    setConsent(getConsent());
    setDoNotTrack(isDoNotTrackActive());
    
    // Vérifier les données sensibles
    hasSensitiveData().then(setHasSecureData);
  }, [isOpen, getConsent, isDoNotTrackActive, hasSensitiveData]);

  const handleConsentChange = (type: keyof typeof consent, value: boolean) => {
    if (doNotTrack) {
      alert('Do Not Track est activé - impossible de modifier le consentement');
      return;
    }

    const newConsent = { ...consent, [type]: value };
    setConsent(newConsent);
    updateConsent(newConsent);
  };

  const handleResetAll = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres de confidentialité ?')) {
      resetConsent();
      setConsent(getConsent());
    }
  };

  const handleClearAllData = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.')) {
      clearAllData();
      await clearAll();
      setHasSecureData(false);
      alert('Toutes les données ont été supprimées');
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestion de la Confidentialité"
      size="lg"
    >
      <div className="space-y-6">
        {/* Do Not Track Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Statut Do Not Track
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${doNotTrack ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-sm">
              {doNotTrack 
                ? 'Do Not Track est activé - Aucun consentement autorisé'
                : 'Do Not Track est désactivé - Consentements autorisés'
              }
            </span>
          </div>
          {doNotTrack && (
            <p className="text-xs text-blue-700 mt-2">
              Votre navigateur a activé Do Not Track. Tous les consentements sont automatiquement désactivés.
            </p>
          )}
        </div>

        {/* Consentements */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Consentements</h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={consent.errorReporting}
                onChange={(e) => handleConsentChange('errorReporting', e.target.checked)}
                disabled={doNotTrack}
                className="rounded border-gray-300"
              />
              <div>
                <span className="font-medium">Signalement d'erreurs</span>
                <p className="text-sm text-gray-600">
                  Envoyer les erreurs à Sentry pour améliorer l'application
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={consent.logging}
                onChange={(e) => handleConsentChange('logging', e.target.checked)}
                disabled={doNotTrack}
                className="rounded border-gray-300"
              />
              <div>
                <span className="font-medium">Logs réseau</span>
                <p className="text-sm text-gray-600">
                  Envoyer les logs de diagnostic via le réseau
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={consent.metrics}
                onChange={(e) => handleConsentChange('metrics', e.target.checked)}
                disabled={doNotTrack}
                className="rounded border-gray-300"
              />
              <div>
                <span className="font-medium">Métriques d'utilisation</span>
                <p className="text-sm text-gray-600">
                  Collecter des métriques pour améliorer les performances
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                disabled={doNotTrack}
                className="rounded border-gray-300"
              />
              <div>
                <span className="font-medium">Analytics</span>
                <p className="text-sm text-gray-600">
                  Collecter des données d'analyse d'utilisation
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                disabled={doNotTrack}
                className="rounded border-gray-300"
              />
              <div>
                <span className="font-medium">Marketing</span>
                <p className="text-sm text-gray-600">
                  Utiliser les données pour le marketing (non implémenté)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Stockage Sécurisé */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Stockage Sécurisé
          </h3>
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${hasSecureData ? 'bg-yellow-500' : 'bg-gray-300'}`} />
            <span className="text-sm">
              {hasSecureData 
                ? 'Données sensibles stockées dans le Keychain'
                : 'Aucune donnée sensible stockée'
              }
            </span>
          </div>
          {hasSecureData && (
            <p className="text-xs text-yellow-700 mb-3">
              Des tokens ou clés sont stockés de manière sécurisée dans le Keychain système.
            </p>
          )}
          <AccessibleButton
            variant="outline"
            size="sm"
            onClick={handleClearAllData}
            disabled={!hasSecureData}
          >
            Supprimer toutes les données sensibles
          </AccessibleButton>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <AccessibleButton
            variant="outline"
            onClick={handleResetAll}
            disabled={doNotTrack}
          >
            Réinitialiser les consentements
          </AccessibleButton>
          
          <AccessibleButton
            variant="primary"
            onClick={onClose}
          >
            Fermer
          </AccessibleButton>
        </div>
      </div>
    </AccessibleModal>
  );
};

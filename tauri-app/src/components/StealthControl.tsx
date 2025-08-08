import React, { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getStealthStatus, toggleStealth } from '../utils/tauriClient';

interface StealthControlProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const StealthControl: React.FC<StealthControlProps> = ({
  isVisible = false,
  onClose,
}) => {
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [detectedApps, setDetectedApps] = useState<string[]>([]);
  const [lastEvent, setLastEvent] = useState<string>('');

  useEffect(() => {
    // Écouter les événements de mode furtif
    const unlistenStealthActivated = listen('stealth-mode-activated', event => {
      setLastEvent(event.payload as string);
      setIsStealthMode(true);
    });

    const unlistenStealthDeactivated = listen(
      'stealth-mode-deactivated',
      event => {
        setLastEvent(event.payload as string);
        setIsStealthMode(false);
      }
    );

    // Charger l'état initial
    loadStealthStatus();
    loadDetectedApps();

    return () => {
      unlistenStealthActivated.then(f => f());
      unlistenStealthDeactivated.then(f => f());
    };
  }, []);

  const loadStealthStatus = async () => {
    try {
      const status = await getStealthStatus();
      setIsStealthMode(status);
    } catch (error) {
      console.error('Erreur lors du chargement du statut furtif:', error);
    }
  };

  const loadDetectedApps = async () => {
    try {
      // TODO: Implémenter get_detected_meeting_apps
      setDetectedApps([]);
    } catch (error) {
      console.error('Erreur lors du chargement des apps détectées:', error);
    }
  };

  const toggleStealthMode = async () => {
    try {
      await toggleStealth();
      // L'état sera mis à jour via les événements
    } catch (error) {
      console.error('Erreur lors du toggle du mode furtif:', error);
    }
  };

  const refreshStatus = async () => {
    await loadStealthStatus();
    await loadDetectedApps();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🛡️ Contrôle Furtif
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Statut du mode furtif */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mode Furtif
            </h3>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isStealthMode
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
              }`}
            >
              {isStealthMode ? 'ACTIF' : 'INACTIF'}
            </div>
          </div>

          <button
            onClick={toggleStealthMode}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isStealthMode
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isStealthMode
              ? '🛡️ Désactiver le Mode Furtif'
              : '🛡️ Activer le Mode Furtif'}
          </button>
        </div>

        {/* Apps de réunion détectées */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📹 Apps de Réunion Détectées
          </h3>

          {detectedApps.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-4">
              Aucune app de réunion détectée
            </div>
          ) : (
            <div className="space-y-2">
              {detectedApps.map((app, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg"
                >
                  <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                    {app}
                  </span>
                  <span className="text-yellow-600 dark:text-yellow-400 text-sm">
                    ⚠️ Détectée
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dernier événement */}
        {lastEvent && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📋 Dernier Événement
            </h3>
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                {lastEvent}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={refreshStatus}
            className="flex-1 py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            🔄 Actualiser
          </button>

          <button
            onClick={() => {
              setLastEvent('');
              setDetectedApps([]);
            }}
            className="flex-1 py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            🗑️ Effacer
          </button>
        </div>

        {/* Informations */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            ℹ️ Informations
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Masquage automatique lors des captures d'écran</li>
            <li>• Protection pendant les réunions vidéo</li>
            <li>• Raccourci: Cmd+Shift+H (à venir)</li>
            <li>• Restauration automatique après 3 secondes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StealthControl;

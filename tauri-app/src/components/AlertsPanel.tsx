import React, { useState } from 'react';
import { useAlerts } from '../utils/alerts';

interface AlertsPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  isVisible = false,
  onClose,
}) => {
  const {
    alerts,
    notifications,
    acknowledgeAlert,
    resolveAlert,
    clearNotifications,
    rules,
  } = useAlerts();
  const [activeTab, setActiveTab] = useState<
    'alerts' | 'rules' | 'notifications'
  >('alerts');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  if (!isVisible) return null;

  const filteredAlerts = alerts.filter(
    alert => filterSeverity === 'all' || alert.severity === filterSeverity
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return '📊';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🚨 Centre d'Alertes
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Onglets */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'alerts'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Alertes ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'notifications'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'rules'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Règles ({rules.length})
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'alerts' && (
          <div>
            {/* Filtres */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <select
                  value={filterSeverity}
                  onChange={e => setFilterSeverity(e.target.value)}
                  className="px-3 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="all">Toutes les sévérités</option>
                  <option value="critical">Critique</option>
                  <option value="high">Élevée</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Faible</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                {filteredAlerts.length} alerte(s) affichée(s)
              </div>
            </div>

            {/* Liste des alertes */}
            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune alerte à afficher
                </div>
              ) : (
                filteredAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 ${
                      alert.acknowledged ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {getSeverityIcon(alert.severity)}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {alert.message}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatTimestamp(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm font-mono">
                          {alert.value}
                          {alert.unit} / {alert.threshold}
                          {alert.unit}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex space-x-2">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Acknowledger
                        </button>
                      )}
                      {!alert.resolved && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Résoudre
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Notifications Récentes</h3>
              <button
                onClick={clearNotifications}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Effacer tout
              </button>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune notification
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(notification.severity)}`}
                      >
                        {notification.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Règles d'Alerte Configurées
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {rule.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(rule.severity)}`}
                      >
                        {rule.severity.toUpperCase()}
                      </span>
                      <span
                        className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-400'}`}
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {rule.description}
                  </p>

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      Seuil: {rule.threshold} {rule.unit}
                    </div>
                    <div>Cooldown: {rule.cooldown / 1000}s</div>
                    <div>Catégorie: {rule.category}</div>
                    <div>Actions: {rule.actions.length}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions globales */}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={() => {
              // Exporter les alertes
              const data = {
                alerts,
                notifications,
                rules,
                timestamp: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `alerts-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            📥 Exporter
          </button>
          <button
            onClick={() => {
              // Réinitialiser les alertes
              alerts.forEach(alert => resolveAlert(alert.id));
              clearNotifications();
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🔄 Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;

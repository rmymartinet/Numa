import React, { useState, useEffect } from 'react';
import { useMetrics } from '../utils/metrics';

interface MetricsDashboardProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ isVisible = false, onClose }) => {
  const { getMetrics, getUserMetrics, getBusinessMetrics } = useMetrics();
  const [metrics, setMetrics] = useState(getMetrics());
  const [userMetrics, setUserMetrics] = useState(getUserMetrics());
  const [businessMetrics, setBusinessMetrics] = useState(getBusinessMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getMetrics());
      setUserMetrics(getUserMetrics());
      setBusinessMetrics(getBusinessMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [getMetrics, getUserMetrics, getBusinessMetrics]);

  if (!isVisible) return null;

  const performanceMetrics = metrics.filter(m => m.category === 'performance');
  const errorMetrics = metrics.filter(m => m.category === 'error');
  const userMetricsData = metrics.filter(m => m.category === 'user');
  const businessMetricsData = metrics.filter(m => m.category === 'business');

  const getLatestMetric = (name: string) => {
    const metric = metrics.find(m => m.name === name);
    return metric ? `${metric.value}${metric.unit}` : 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Dashboard Métriques
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Métriques de Performance */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ⚡ Performance
            </h3>
            <div className="space-y-1 text-sm">
              <div>Page Load: {getLatestMetric('page_load_time')}</div>
              <div>FCP: {getLatestMetric('first_contentful_paint')}</div>
              <div>LCP: {getLatestMetric('largest_contentful_paint')}</div>
              <div>Memory: {getLatestMetric('memory_used')}</div>
            </div>
          </div>

          {/* Métriques Utilisateur */}
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              👤 Utilisateur
            </h3>
            <div className="space-y-1 text-sm">
              <div>Session: {userMetrics.sessionId.slice(-8)}</div>
              <div>Interactions: {userMetrics.interactions}</div>
              <div>Temps: {Math.round((Date.now() - userMetrics.startTime) / 1000)}s</div>
              <div>Erreurs: {userMetrics.errors}</div>
            </div>
          </div>

          {/* Métriques Business */}
          <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
              💼 Business
            </h3>
            <div className="space-y-1 text-sm">
              <div>Satisfaction: {businessMetrics.userSatisfaction}/10</div>
              <div>Features: {Object.keys(businessMetrics.featureUsage).length}</div>
              <div>Conversions: {Object.keys(businessMetrics.conversionEvents).length}</div>
              <div>Retention: {businessMetrics.retentionRate}%</div>
            </div>
          </div>

          {/* Métriques d'Erreurs */}
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              🚨 Erreurs
            </h3>
            <div className="space-y-1 text-sm">
              <div>JS Errors: {errorMetrics.filter(m => m.name === 'javascript_error').length}</div>
              <div>Network: {errorMetrics.filter(m => m.name === 'network_request_error').length}</div>
              <div>Promises: {errorMetrics.filter(m => m.name === 'unhandled_promise_rejection').length}</div>
              <div>Total: {errorMetrics.length}</div>
            </div>
          </div>
        </div>

        {/* Graphiques en temps réel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Timeline */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">📈 Timeline Performance</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {performanceMetrics.slice(-10).reverse().map((metric, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{metric.name}</span>
                  <span className="font-mono">{metric.value}{metric.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Utilisation des Features */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">🎯 Features Utilisées</h3>
            <div className="space-y-2">
              {Object.entries(businessMetrics.featureUsage).map(([feature, count]) => (
                <div key={feature} className="flex justify-between items-center">
                  <span className="text-sm">{feature}</span>
                  <div className="flex items-center">
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(count * 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={() => {
              const data = {
                metrics,
                userMetrics,
                businessMetrics,
                timestamp: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `metrics-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            📥 Exporter
          </button>
          <button
            onClick={() => {
              setMetrics([]);
              setUserMetrics({
                sessionId: userMetrics.sessionId,
                pageViews: 0,
                timeOnSite: 0,
                interactions: 0,
                errors: 0,
                startTime: Date.now(),
              });
              setBusinessMetrics({
                featureUsage: {},
                conversionEvents: {},
                userSatisfaction: 0,
                retentionRate: 0,
              });
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

export default MetricsDashboard;

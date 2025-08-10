import React, { useState, useEffect } from 'react';
import { useCSPManager } from '../utils/cspManager';
import AccessibleModal from './ui/AccessibleModal';
import AccessibleButton from './ui/AccessibleButton';

interface CSPManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CSPManager: React.FC<CSPManagerProps> = ({ isOpen, onClose }) => {
  const { getConfig, addSource, removeSource, enableReportOnly, disableReportOnly, reset, isAllowed } = useCSPManager();
  const [config, setConfig] = useState(getConfig());
  const [testUrl, setTestUrl] = useState('');
  const [testDirective, setTestDirective] = useState('connect-src');
  const [isTestAllowed, setIsTestAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setConfig(getConfig());
  }, [isOpen, getConfig]);

  // const handleUpdateDirective = (_directive: string, _sources: string[]) => {
  //   updateDirective(_directive, _sources);
  //   setConfig(getConfig());
  // };

  const handleAddSource = (directive: string, source: string) => {
    if (source.trim()) {
      addSource(directive, source.trim());
      setConfig(getConfig());
    }
  };

  const handleRemoveSource = (directive: string, source: string) => {
    removeSource(directive, source);
    setConfig(getConfig());
  };

  const handleTestUrl = () => {
    if (testUrl && testDirective) {
      const allowed = isAllowed(testDirective, testUrl);
      setIsTestAllowed(allowed);
    }
  };

  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser la CSP à sa configuration par défaut ?')) {
      reset();
      setConfig(getConfig());
    }
  };

  const handleToggleReportOnly = () => {
    if (config.reportOnly) {
      disableReportOnly();
    } else {
      enableReportOnly();
    }
    setConfig(getConfig());
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestion de la Content Security Policy"
      size="lg"
    >
      <div className="space-y-6">
        {/* Statut CSP */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Statut CSP
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${config.reportOnly ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <span className="text-sm">
              {config.reportOnly 
                ? 'Mode Report-Only - Les violations sont signalées mais pas bloquées'
                : 'Mode Strict - Les violations sont bloquées'
              }
            </span>
          </div>
          <AccessibleButton
            variant="outline"
            size="sm"
            onClick={handleToggleReportOnly}
            className="mt-2"
          >
            {config.reportOnly ? 'Activer le mode strict' : 'Activer le mode report-only'}
          </AccessibleButton>
        </div>

        {/* Test d'URL */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Test d'URL</h3>
          <div className="space-y-2">
            <div className="flex space-x-2">
              <select
                value={testDirective}
                onChange={(e) => setTestDirective(e.target.value)}
                className="border rounded px-2 py-1"
              >
                {Object.keys(config.directives).map(directive => (
                  <option key={directive} value={directive}>{directive}</option>
                ))}
              </select>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 border rounded px-2 py-1"
              />
              <AccessibleButton
                variant="outline"
                size="sm"
                onClick={handleTestUrl}
              >
                Tester
              </AccessibleButton>
            </div>
            {isTestAllowed !== null && (
              <div className={`text-sm ${isTestAllowed ? 'text-green-600' : 'text-red-600'}`}>
                {isTestAllowed ? '✅ URL autorisée' : '❌ URL bloquée'}
              </div>
            )}
          </div>
        </div>

        {/* Directives CSP */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Directives CSP</h3>
            <AccessibleButton
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              Réinitialiser
            </AccessibleButton>
          </div>
          
          {Object.entries(config.directives).map(([directive, sources]) => (
            <div key={directive} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">{directive}</h4>
                <div className="text-sm text-gray-500">
                  {sources.length} source(s)
                </div>
              </div>
              
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                      {source}
                    </span>
                    <AccessibleButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveSource(directive, source)}
                    >
                      Supprimer
                    </AccessibleButton>
                  </div>
                ))}
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Nouvelle source"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSource(directive, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <AccessibleButton
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      handleAddSource(directive, input.value);
                      input.value = '';
                    }}
                  >
                    Ajouter
                  </AccessibleButton>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
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

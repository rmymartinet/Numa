import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erreur capturée par ErrorBoundary:', error, errorInfo);

    // Log l'erreur
    try {
      logger.error('Erreur React capturée', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    } catch (e) {
      console.error("Impossible de logger l'erreur:", e);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">😵</div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Oups ! Quelque chose s'est mal passé
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Une erreur inattendue s'est produite. L'application va se
                redémarrer automatiquement.
              </p>

              {this.state.error && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Détails techniques
                  </summary>
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto max-h-32">
                    {this.state.error.message}
                  </div>
                </details>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Redémarrer l'application
                </button>

                <button
                  onClick={() => this.setState({ hasError: false })}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

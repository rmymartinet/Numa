import React, { useState } from 'react';

interface OnboardingProps {
  isVisible: boolean;
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ isVisible, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Bienvenue dans Numa !",
      description: "Votre assistant IA pour la capture et l'analyse d'écran",
      icon: "🎉",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Numa vous permet de capturer votre écran et d'obtenir des analyses intelligentes grâce à l'IA.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Fonctionnalités principales :</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Capture d'écran avec raccourci global</li>
              <li>• Reconnaissance de texte (OCR)</li>
              <li>• Analyse IA avec GPT</li>
              <li>• Interface moderne et intuitive</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Configuration de l'API OpenAI",
      description: "Configurez votre clé API pour utiliser l'analyse IA",
      icon: "🔑",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Pour utiliser l'analyse IA, vous devez configurer votre clé API OpenAI.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Clé API OpenAI
              </label>
              <input
                type="password"
                placeholder="sk-..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Vous pouvez obtenir votre clé API sur{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" 
                 className="text-blue-500 hover:text-blue-600 underline">
                platform.openai.com
              </a>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Raccourci clavier global",
      description: "Apprenez à utiliser le raccourci principal",
      icon: "⌨️",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Le raccourci principal vous permet de capturer votre écran depuis n'importe où.
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Raccourci principal :</h4>
            <div className="flex items-center space-x-2">
              <kbd className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
                Cmd + Shift + G
              </kbd>
              <span className="text-sm text-green-700 dark:text-green-300">(macOS)</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <kbd className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono">
                Ctrl + Shift + G
              </kbd>
              <span className="text-sm text-green-700 dark:text-green-300">(Windows/Linux)</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Ce raccourci fonctionne même quand l'application n'est pas au premier plan !
          </div>
        </div>
      )
    },
    {
      title: "Autres raccourcis utiles",
      description: "Découvrez tous les raccourcis disponibles",
      icon: "⚡",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Voici les raccourcis disponibles dans l'application :
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Navigation onglets</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
                1, 2, 3
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Capture d'écran</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
                Ctrl + C
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Changer de thème</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
                Ctrl + T
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">Fermer la bulle</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">
                Échap
              </kbd>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "C'est parti !",
      description: "Vous êtes prêt à utiliser Numa",
      icon: "🚀",
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Félicitations ! Vous êtes maintenant prêt à utiliser Numa.
          </p>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Prochaines étapes :</h4>
            <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
              <li>• Testez le raccourci global Cmd+Shift+G</li>
              <li>• Explorez les différents onglets</li>
              <li>• Personnalisez vos préférences</li>
              <li>• Commencez à capturer et analyser !</li>
            </ul>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Vous pouvez toujours accéder à cette aide depuis les paramètres.
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{steps[currentStep].icon}</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {steps[currentStep].title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>
            <button
              onClick={onComplete}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <div className="flex space-x-3">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Précédent
              </button>
            )}
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
            >
              {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 
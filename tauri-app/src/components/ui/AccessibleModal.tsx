import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Gérer le focus trap
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  // Gérer les touches clavier
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose();
    } else if (event.key === 'Tab') {
      handleTabKey(event);
    }
  }, [onClose, closeOnEscape, handleTabKey]);

  // Gérer le clic sur l'overlay
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  }, [onClose, closeOnOverlayClick]);

  // Gérer l'ouverture/fermeture
  useEffect(() => {
    if (isOpen) {
      // Sauvegarder l'élément actuellement focusé
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
      
      // Ajouter les event listeners
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus sur le modal après un court délai
      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }, 100);
    } else {
      // Restaurer le scroll
      document.body.style.overflow = '';
      
      // Retirer les event listeners
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restaurer le focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Tailles des modales
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        aria-hidden="true"
        onClick={handleOverlayClick}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all duration-200 ease-out`}
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
            aria-label="Fermer la modale"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div id="modal-description" className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AccessibleModal;

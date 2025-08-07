import React, { Suspense, lazy } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Wrapper pour le lazy loading avec fallback
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
  children,
  fallback = <LoadingSpinner text="Chargement..." variant="dots" />
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// Composants lazy-loaded avec type assertion
const ActivityContent = lazy(() => 
  import('./ActivityContent').then(module => ({ default: module.default as React.ComponentType }))
);

const PersonalizeContent = lazy(() => 
  import('./PersonalizeContent').then(module => ({ default: module.default as React.ComponentType }))
);

const SettingsContent = lazy(() => 
  import('./SettingsContent').then(module => ({ default: module.default as React.ComponentType }))
);

// Composants spécifiques pour chaque onglet
export const LazyActivityContent: React.FC = () => (
  <LazyComponentWrapper>
    <ActivityContent />
  </LazyComponentWrapper>
);

export const LazyPersonalizeContent: React.FC = () => (
  <LazyComponentWrapper>
    <PersonalizeContent />
  </LazyComponentWrapper>
);

export const LazySettingsContent: React.FC = () => (
  <LazyComponentWrapper>
    <SettingsContent />
  </LazyComponentWrapper>
);

// Hook pour le lazy loading conditionnel
export function useLazyLoad<T>(
  importFn: () => Promise<T>,
  deps: React.DependencyList = []
): T | null {
  const [module, setModule] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    importFn()
      .then((module) => {
        setModule(module);
      })
      .catch((error) => {
        console.error('Erreur lors du chargement lazy:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, deps);

  return loading ? null : module;
}

// Composant pour le lazy loading d'images
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}> = ({ src, alt, className = '', placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4MyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+' }) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder);
  const [imageRef, setImageRef] = React.useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    let observer: IntersectionObserver;
    let didCancel = false;

    if (imageRef && imageSrc === placeholder) {
      if (IntersectionObserver) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (
                !didCancel &&
                (entry.intersectionRatio > 0 || entry.isIntersecting)
              ) {
                setImageSrc(src);
                if (imageRef) {
                  observer.unobserve(imageRef);
                }
              }
            });
          },
          {
            threshold: 0.01,
            rootMargin: '75%',
          }
        );
        if (imageRef) {
          observer.observe(imageRef);
        }
      } else {
        // Fallback pour les navigateurs sans IntersectionObserver
        setImageSrc(src);
      }
    }
    return () => {
      didCancel = true;
      if (observer && observer.unobserve && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [src, imageSrc, imageRef]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      onLoad={() => {
        if (imageSrc === placeholder) {
          setImageSrc(src);
        }
      }}
    />
  );
}; 
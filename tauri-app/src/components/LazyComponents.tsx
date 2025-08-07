import React, { lazy, Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Composants lazy avec preloading intelligent
const ActivityContent = lazy(() => 
  import('./ActivityContent').then(module => ({
    default: module.default
  }))
);

const PersonalizeContent = lazy(() => 
  import('./PersonalizeContent').then(module => ({
    default: module.default
  }))
);

const SettingsContent = lazy(() => 
  import('./SettingsContent').then(module => ({
    default: module.default
  }))
);

// Wrapper avec Suspense optimisé
const LazyWrapper: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = <LoadingSpinner size="sm" /> 
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// Composants exportés avec preloading
export const LazyActivityContent: React.FC = () => (
  <LazyWrapper>
    <ActivityContent />
  </LazyWrapper>
);

export const LazyPersonalizeContent: React.FC = () => (
  <LazyWrapper>
    <PersonalizeContent />
  </LazyWrapper>
);

export const LazySettingsContent: React.FC = () => (
  <LazyWrapper>
    <SettingsContent />
  </LazyWrapper>
);

// Fonctions de preloading pour optimiser les performances
export const preloadActivityContent = () => {
  import('./ActivityContent');
};

export const preloadPersonalizeContent = () => {
  import('./PersonalizeContent');
};

export const preloadSettingsContent = () => {
  import('./SettingsContent');
};

// Hook pour le preloading intelligent
export const usePreloadComponents = () => {
  const preloadAll = React.useCallback(() => {
    // Preload tous les composants en arrière-plan
    Promise.all([
      preloadActivityContent(),
      preloadPersonalizeContent(),
      preloadSettingsContent()
    ]).catch(console.error);
  }, []);

  return { preloadAll };
};

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
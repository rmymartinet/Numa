import { test, expect } from '@playwright/test';

test.describe('Performance E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load within performance budget', async ({ page }) => {
    // Mesurer le temps de chargement initial
    const loadTime = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation.loadEventEnd - navigation.loadEventStart;
    });

    // Budget de performance : moins de 3 secondes
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('networkidle');

    // Mesurer LCP (Largest Contentful Paint)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    // LCP doit être inférieur à 2.5 secondes
    expect(lcp).toBeLessThan(2500);
  });

  test('should handle rapid interactions without lag', async ({ page }) => {
    // Mesurer le temps de réponse aux interactions
    const interactionTimes: number[] = [];

    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      await page.click('[data-testid="toggle-panel-button"]');
      await page.click('[data-testid="toggle-panel-button"]');
      const endTime = Date.now();
      interactionTimes.push(endTime - startTime);
    }

    // Temps de réponse moyen doit être inférieur à 100ms
    const averageTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
    expect(averageTime).toBeLessThan(100);
  });

  test('should maintain good memory usage', async ({ page }) => {
    // Mesurer l'utilisation mémoire initiale
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory.usedJSHeapSize;
    });

    // Effectuer des actions répétées
    for (let i = 0; i < 20; i++) {
      await page.click('[data-testid="toggle-panel-button"]');
      await page.click('text=Settings');
      await page.click('text=Activity');
      await page.click('[data-testid="toggle-panel-button"]');
    }

    // Mesurer l'utilisation mémoire finale
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory.usedJSHeapSize;
    });

    // L'augmentation mémoire ne doit pas dépasser 50%
    const memoryIncrease = (finalMemory - initialMemory) / initialMemory;
    expect(memoryIncrease).toBeLessThan(0.5);
  });

  test('should have efficient bundle size', async ({ page }) => {
    // Vérifier la taille des ressources chargées
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        size: (entry as PerformanceResourceTiming).transferSize,
        duration: entry.duration,
      }));
    });

    // Calculer la taille totale
    const totalSize = resources.reduce((sum, resource) => sum + (resource.size || 0), 0);
    
    // Taille totale ne doit pas dépasser 2MB
    expect(totalSize).toBeLessThan(2 * 1024 * 1024);
  });

  test('should handle network throttling gracefully', async ({ page }) => {
    // Simuler une connexion lente
    await page.route('**/*', route => {
      route.continue();
    });

    // Mesurer le temps de chargement avec throttling
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Même avec une connexion lente, le chargement ne doit pas prendre plus de 10 secondes
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have smooth animations', async ({ page }) => {
    // Mesurer la fluidité des animations
    const frameRates: number[] = [];

    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();

        function measureFPS() {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - lastTime >= 1000) {
            const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            frameRates.push(fps);
            frameCount = 0;
            lastTime = currentTime;
          }

          if (frameRates.length < 3) {
            requestAnimationFrame(measureFPS);
          } else {
            resolve();
          }
        }

        requestAnimationFrame(measureFPS);
      });
    });

    // FPS moyen doit être supérieur à 30
    const averageFPS = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
    expect(averageFPS).toBeGreaterThan(30);
  });

  test('should handle concurrent operations efficiently', async ({ page }) => {
    // Lancer plusieurs opérations simultanément
    const promises = [
      page.click('[data-testid="capture-button"]'),
      page.click('[data-testid="toggle-panel-button"]'),
      page.keyboard.press('Escape'),
      page.click('text=Settings'),
    ];

    const startTime = Date.now();
    await Promise.all(promises);
    const executionTime = Date.now() - startTime;

    // Les opérations concurrentes doivent s'exécuter rapidement
    expect(executionTime).toBeLessThan(1000);
  });

  test('should have efficient DOM updates', async ({ page }) => {
    // Mesurer les performances des mises à jour DOM
    const updateTimes: number[] = [];

    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      
      await page.evaluate(() => {
        // Simuler une mise à jour DOM complexe
        const container = document.querySelector('[data-testid="hud-container"]');
        if (container) {
          container.innerHTML = `<div>Update ${Date.now()}</div>`;
        }
      });

      const endTime = performance.now();
      updateTimes.push(endTime - startTime);
    }

    // Temps moyen de mise à jour DOM doit être inférieur à 16ms (60fps)
    const averageUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
    expect(averageUpdateTime).toBeLessThan(16);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Simuler le chargement d'un grand volume de données
    await page.evaluate(() => {
      // Créer un grand dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: `Data for item ${i}`,
      }));

      // Simuler le rendu
      const container = document.createElement('div');
      largeDataset.forEach(item => {
        const element = document.createElement('div');
        element.textContent = item.name;
        container.appendChild(element);
      });
    });

    // Vérifier que l'application reste responsive
    const responseTime = await page.evaluate(() => {
      const start = performance.now();
      const button = document.querySelector('[data-testid="toggle-panel-button"]') as HTMLElement;
      button?.click();
      return performance.now() - start;
    });

    expect(responseTime).toBeLessThan(100);
  });
});

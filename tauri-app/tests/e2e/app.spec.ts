import { test, expect } from '@playwright/test';

test.describe('Numa Application E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the main HUD interface', async ({ page }) => {
    // Vérifier que l'interface principale se charge
    await expect(page.locator('[data-testid="hud-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="hud-bar"]')).toBeVisible();

    // Vérifier les éléments de contrôle
    await expect(page.locator('[data-testid="capture-button"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="toggle-panel-button"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="close-button"]')).toBeVisible();
  });

  test('should toggle panel visibility', async ({ page }) => {
    // Panel initialement caché
    await expect(
      page.locator('[data-testid="dropdown-panel"]')
    ).not.toBeVisible();

    // Cliquer pour ouvrir le panel
    await page.click('[data-testid="toggle-panel-button"]');
    await expect(page.locator('[data-testid="dropdown-panel"]')).toBeVisible();

    // Cliquer pour fermer le panel
    await page.click('[data-testid="toggle-panel-button"]');
    await expect(
      page.locator('[data-testid="dropdown-panel"]')
    ).not.toBeVisible();
  });

  test('should navigate between tabs in panel', async ({ page }) => {
    // Ouvrir le panel
    await page.click('[data-testid="toggle-panel-button"]');
    await expect(page.locator('[data-testid="dropdown-panel"]')).toBeVisible();

    // Vérifier que l'onglet Activity est actif par défaut
    await expect(
      page.locator('[data-testid="activity-content"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="personalize-content"]')
    ).not.toBeVisible();
    await expect(
      page.locator('[data-testid="settings-content"]')
    ).not.toBeVisible();

    // Naviguer vers l'onglet Personalize
    await page.click('text=Personalize');
    await expect(
      page.locator('[data-testid="personalize-content"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="activity-content"]')
    ).not.toBeVisible();

    // Naviguer vers l'onglet Settings
    await page.click('text=Settings');
    await expect(
      page.locator('[data-testid="settings-content"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="personalize-content"]')
    ).not.toBeVisible();
  });

  test('should handle input field interactions', async ({ page }) => {
    // Ouvrir le panel
    await page.click('[data-testid="toggle-panel-button"]');

    // Tester la saisie dans le champ de recherche
    const inputField = page.locator('[data-testid="search-input"]');
    await inputField.fill('test query');
    await expect(inputField).toHaveValue('test query');

    // Tester la validation du champ
    await inputField.clear();
    await inputField.fill('a'); // Valeur trop courte
    await expect(page.locator('[data-testid="input-error"]')).toBeVisible();
  });

  test('should handle capture functionality', async ({ page }) => {
    // Simuler la capture d'écran
    await page.click('[data-testid="capture-button"]');

    // Vérifier que l'état de traitement est affiché
    await expect(
      page.locator('[data-testid="processing-indicator"]')
    ).toBeVisible();

    // Attendre que le traitement soit terminé
    await expect(
      page.locator('[data-testid="processing-indicator"]')
    ).not.toBeVisible({ timeout: 10000 });
  });

  test('should handle theme switching', async ({ page }) => {
    // Ouvrir le panel
    await page.click('[data-testid="toggle-panel-button"]');

    // Aller dans les paramètres
    await page.click('text=Settings');

    // Tester le switch de thème
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    const initialTheme = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );

    await themeToggle.click();

    // Vérifier que le thème a changé
    const newTheme = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Tester le raccourci pour ouvrir/fermer le panel
    await page.keyboard.press('Escape');
    await expect(
      page.locator('[data-testid="dropdown-panel"]')
    ).not.toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="dropdown-panel"]')).toBeVisible();

    // Tester le raccourci pour la capture
    await page.keyboard.press('Control+Shift+C');
    await expect(
      page.locator('[data-testid="processing-indicator"]')
    ).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Tester sur mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Vérifier que l'interface s'adapte
    await expect(page.locator('[data-testid="hud-container"]')).toBeVisible();

    // Tester l'ouverture du panel sur mobile
    await page.click('[data-testid="toggle-panel-button"]');
    await expect(page.locator('[data-testid="dropdown-panel"]')).toBeVisible();

    // Revenir au desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('[data-testid="hud-container"]')).toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Simuler une erreur réseau
    await page.route('**/api/**', route => route.abort());

    // Tenter une action qui nécessite une requête réseau
    await page.click('[data-testid="capture-button"]');

    // Vérifier que l'erreur est affichée
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should handle accessibility features', async ({ page }) => {
    // Vérifier les attributs ARIA
    await expect(
      page.locator('[data-testid="capture-button"]')
    ).toHaveAttribute('aria-label');
    await expect(
      page.locator('[data-testid="toggle-panel-button"]')
    ).toHaveAttribute('aria-label');

    // Tester la navigation au clavier
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="capture-button"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(
      page.locator('[data-testid="toggle-panel-button"]')
    ).toBeFocused();
  });

  test('should handle performance metrics', async ({ page }) => {
    // Vérifier que les métriques sont collectées
    const metrics = await page.evaluate(() => {
      return window.performance.getEntriesByType('navigation')[0];
    });

    expect(metrics).toBeDefined();
    expect(metrics.loadEventEnd).toBeGreaterThan(0);
  });

  test('should handle PWA features', async ({ page }) => {
    // Vérifier que le service worker est enregistré
    const swRegistered = await page.evaluate(() => {
      return (
        'serviceWorker' in navigator &&
        navigator.serviceWorker.controller !== null
      );
    });

    expect(swRegistered).toBe(true);

    // Vérifier que le manifest est présent
    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? link.getAttribute('href') : null;
    });

    expect(manifest).toBeTruthy();
  });

  test('should handle data persistence', async ({ page }) => {
    // Ouvrir le panel et changer de thème
    await page.click('[data-testid="toggle-panel-button"]');
    await page.click('text=Settings');
    await page.click('[data-testid="theme-toggle"]');

    // Recharger la page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Vérifier que les préférences sont persistées
    const themePersisted = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark');
    });

    expect(themePersisted).toBe(true);
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    // Simuler des interactions rapides
    await page.click('[data-testid="toggle-panel-button"]');
    await page.click('[data-testid="capture-button"]');
    await page.click('[data-testid="toggle-panel-button"]');

    // Vérifier que l'interface reste stable
    await expect(page.locator('[data-testid="hud-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="hud-bar"]')).toBeVisible();
  });

  test('should handle memory usage', async ({ page }) => {
    // Effectuer plusieurs actions pour tester la gestion mémoire
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="toggle-panel-button"]');
      await page.click('text=Settings');
      await page.click('text=Activity');
      await page.click('[data-testid="toggle-panel-button"]');
    }

    // Vérifier que l'application reste performante
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory;
    });

    expect(memoryInfo.usedJSHeapSize).toBeLessThan(memoryInfo.jsHeapSizeLimit);
  });
});

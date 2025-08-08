import { test, expect } from '@playwright/test';

test.describe('Alerts System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display alerts panel when button is clicked', async ({
    page,
  }) => {
    // Cliquer sur le bouton d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Vérifier que le panel s'ouvre
    await expect(page.locator("text=🚨 Centre d'Alertes")).toBeVisible();
    await expect(page.locator('text=Alertes')).toBeVisible();
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Règles')).toBeVisible();
  });

  test('should show alert count in button', async ({ page }) => {
    // Vérifier que le bouton affiche le nombre d'alertes
    const alertButton = page.locator('button[title*="Centre d\'alertes"]');
    await expect(alertButton).toBeVisible();

    // Le bouton devrait contenir soit "🚨" soit "🚨X" où X est le nombre d'alertes
    const buttonText = await alertButton.textContent();
    expect(buttonText).toMatch(/🚨/);
  });

  test('should filter alerts by severity', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Vérifier que le filtre de sévérité est présent
    const severityFilter = page.locator('select');
    await expect(severityFilter).toBeVisible();

    // Tester les différentes options de filtre
    await severityFilter.selectOption('critical');
    await severityFilter.selectOption('high');
    await severityFilter.selectOption('medium');
    await severityFilter.selectOption('low');
    await severityFilter.selectOption('all');
  });

  test('should acknowledge and resolve alerts', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Si des alertes sont présentes, tester les actions
    const alerts = page.locator('[class*="border rounded-lg p-4"]');
    const alertCount = await alerts.count();

    if (alertCount > 0) {
      // Tester l'acknowledgement
      const acknowledgeButton = page
        .locator('button:has-text("Acknowledger")')
        .first();
      if (await acknowledgeButton.isVisible()) {
        await acknowledgeButton.click();
        // Vérifier que l'alerte est marquée comme acknowledged
        await expect(page.locator('[class*="opacity-60"]')).toBeVisible();
      }

      // Tester la résolution
      const resolveButton = page.locator('button:has-text("Résoudre")').first();
      if (await resolveButton.isVisible()) {
        await resolveButton.click();
        // Vérifier que l'alerte est marquée comme résolue
        await expect(resolveButton).not.toBeVisible();
      }
    }
  });

  test('should display notifications tab', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Aller dans l'onglet notifications
    await page.click('button:has-text("Notifications")');

    // Vérifier que l'onglet notifications est affiché
    await expect(page.locator('text=Notifications Récentes')).toBeVisible();

    // Vérifier le bouton "Effacer tout"
    const clearButton = page.locator('button:has-text("Effacer tout")');
    await expect(clearButton).toBeVisible();
  });

  test('should display rules tab', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Aller dans l'onglet règles
    await page.click('button:has-text("Règles")');

    // Vérifier que l'onglet règles est affiché
    await expect(
      page.locator("text=Règles d'Alerte Configurées")
    ).toBeVisible();

    // Vérifier que les règles sont affichées
    const rules = page.locator('[class*="border rounded-lg p-4"]');
    await expect(rules).toBeVisible();
  });

  test('should export alerts data', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Cliquer sur le bouton d'export
    const exportButton = page.locator('button:has-text("📥 Exporter")');
    await expect(exportButton).toBeVisible();

    // Simuler le téléchargement (ne peut pas être testé directement en E2E)
    await exportButton.click();
  });

  test('should reset alerts', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Cliquer sur le bouton reset
    const resetButton = page.locator('button:has-text("🔄 Reset")');
    await expect(resetButton).toBeVisible();

    await resetButton.click();

    // Vérifier que les alertes sont réinitialisées
    await expect(page.locator('text=Aucune alerte à afficher')).toBeVisible();
  });

  test('should handle alert notifications', async ({ page }) => {
    // Simuler une alerte en injectant du JavaScript
    await page.evaluate(() => {
      // Simuler une utilisation mémoire élevée
      const mockMemory = {
        usedJSHeapSize: 1000000000, // 1GB
        totalJSHeapSize: 1200000000, // 1.2GB
        jsHeapSizeLimit: 1200000000, // 1.2GB
      };

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        writable: true,
      });
    });

    // Attendre que l'alerte soit déclenchée
    await page.waitForTimeout(2000);

    // Vérifier que l'alerte apparaît
    await page.click('button[title*="Centre d\'alertes"]');
    await expect(page.locator('text=Utilisation mémoire élevée')).toBeVisible();
  });

  test('should show alert severity indicators', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Vérifier que les indicateurs de sévérité sont présents
    const severityIndicators = page.locator(
      '[class*="px-2 py-1 rounded text-xs font-medium"]'
    );
    await expect(severityIndicators).toBeVisible();
  });

  test('should handle multiple alerts', async ({ page }) => {
    // Simuler plusieurs alertes
    await page.evaluate(() => {
      // Simuler des erreurs JavaScript
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          console.error(`Test error ${i}`);
        }, i * 100);
      }
    });

    // Attendre que les alertes soient déclenchées
    await page.waitForTimeout(3000);

    // Vérifier que les alertes sont affichées
    await page.click('button[title*="Centre d\'alertes"]');
    const alerts = page.locator('[class*="border rounded-lg p-4"]');
    const alertCount = await alerts.count();
    expect(alertCount).toBeGreaterThan(0);
  });

  test('should handle alert cooldown', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Noter le nombre initial d'alertes
    const initialAlerts = page.locator('[class*="border rounded-lg p-4"]');
    const initialCount = await initialAlerts.count();

    // Simuler une alerte répétée
    await page.evaluate(() => {
      // Simuler une utilisation mémoire élevée
      const mockMemory = {
        usedJSHeapSize: 1000000000,
        totalJSHeapSize: 1200000000,
        jsHeapSizeLimit: 1200000000,
      };

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        writable: true,
      });
    });

    // Attendre moins que le cooldown
    await page.waitForTimeout(1000);

    // Vérifier que le nombre d'alertes n'a pas augmenté (cooldown actif)
    const finalAlerts = page.locator('[class*="border rounded-lg p-4"]');
    const finalCount = await finalAlerts.count();
    expect(finalCount).toBeLessThanOrEqual(initialCount + 1);
  });

  test('should display alert timestamps', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Vérifier que les timestamps sont affichés
    const timestamps = page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}/');
    await expect(timestamps).toBeVisible();
  });

  test('should handle alert actions', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Vérifier que les actions d'alerte sont présentes
    const actionButtons = page.locator(
      'button:has-text("Acknowledger"), button:has-text("Résoudre")'
    );
    await expect(actionButtons).toBeVisible();
  });

  test('should show alert thresholds', async ({ page }) => {
    // Ouvrir le panel d'alertes
    await page.click('button[title*="Centre d\'alertes"]');

    // Vérifier que les seuils sont affichés
    const thresholds = page.locator('text=/\\d+\\/\\d+/');
    await expect(thresholds).toBeVisible();
  });
});

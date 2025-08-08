# Guide de Tests et Assurance Qualité

## Vue d'ensemble

Le projet utilise une approche multi-niveaux pour assurer la qualité du code :

### 1. Tests Frontend (Vitest + React Testing Library)

#### Configuration
- **Coverage minimale** : 60% global, 70% pour les utils, 50% pour les composants
- **Seuils par module** : Différenciés selon l'importance du code
- **Exclusions** : Tests, configs, types, fichiers de build

#### Types de Tests
```bash
# Tests unitaires
npm run test:run

# Tests avec coverage
npm run test:coverage

# Tests en mode watch
npm run test:watch

# Interface de tests
npm run test:ui
```

#### Structure des Tests
- `src/utils/__tests__/` - Tests des utilitaires
- `src/components/__tests__/` - Tests des composants React
- `src/hooks/__tests__/` - Tests des hooks personnalisés

### 2. Tests Rust (Cargo Test + Clippy)

#### Configuration
- **Clippy** : Analyse statique avec règles personnalisées
- **Tests unitaires** : Couverture des modules critiques
- **Tests d'intégration** : Validation des commandes Tauri

#### Scripts Disponibles
```bash
# Tests Rust
npm run test:rust

# Analyse statique Clippy
npm run test:rust:clippy

# Tests complets (Rust + Frontend)
npm run test:all
```

#### Règles Clippy
- **Niveau** : Pedantic avec exclusions spécifiques
- **Exclusions** : Format strings, imports inutilisés, code mort
- **Focus** : Qualité du code sans bloquer le développement

### 3. Tests d'Intégration (GitHub Actions)

#### Workflow Automatisé
- **Déclenchement** : Push sur main/develop, Pull Requests
- **Parallélisation** : Tests frontend et Rust en parallèle
- **Quality Gates** : Validation des seuils de coverage

#### Jobs CI/CD
1. **Frontend Tests** : Type check, linting, tests, coverage
2. **Rust Tests** : Clippy, tests unitaires, audit de sécurité
3. **Integration Tests** : Tests complets après validation des unitaires
4. **Quality Gates** : Validation finale des seuils
5. **Security Scan** : Audit npm et cargo

### 4. Seuils de Coverage

#### Frontend
```typescript
// vitest.config.ts
thresholds: {
  global: {
    branches: 60,
    functions: 60,
    lines: 60,
    statements: 60,
  },
  './src/utils/': {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
  './src/components/': {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```

#### Rust
- **Tests unitaires** : Couverture des modules critiques
- **Clippy** : Zéro erreurs critiques
- **Audit** : Zéro vulnérabilités connues

### 5. Bonnes Pratiques

#### Écriture de Tests
1. **Nommage descriptif** : `should_handle_stealth_toggle_when_active`
2. **Arrange-Act-Assert** : Structure claire des tests
3. **Mocks appropriés** : Isolation des dépendances
4. **Tests d'erreurs** : Validation des cas d'échec

#### Exemple de Test
```typescript
describe('TauriClient', () => {
  it('should invoke command with validated args and result', async () => {
    const mockResult = { active: true };
    (invoke as any).mockResolvedValue(mockResult);

    const result = await TauriClient.invoke(COMMAND_NAMES.GET_STEALTH_STATUS);

    expect(invoke).toHaveBeenCalledWith(COMMAND_NAMES.GET_STEALTH_STATUS, {});
    expect(result).toEqual(mockResult);
  });
});
```

### 6. Debugging des Tests

#### Problèmes Courants
1. **Tests qui échouent** : Vérifier les mocks et les props
2. **Coverage insuffisant** : Ajouter des tests pour les branches manquantes
3. **Clippy warnings** : Ajuster les règles ou corriger le code

#### Commandes de Debug
```bash
# Tests avec verbose
npm run test:run -- --reporter=verbose

# Tests spécifiques
npm run test:run -- commands.test.ts

# Coverage HTML
npm run test:coverage:html
```

### 7. Intégration Continue

#### Validation Automatique
- **Pre-commit hooks** : Tests rapides avant commit
- **GitHub Actions** : Tests complets sur PR
- **Quality gates** : Blocage si seuils non atteints

#### Monitoring
- **Coverage trends** : Suivi de l'évolution
- **Test duration** : Optimisation des performances
- **Failure patterns** : Identification des problèmes récurrents

### 8. Métriques de Qualité

#### Indicateurs
- **Coverage global** : ≥ 60%
- **Coverage utils** : ≥ 70%
- **Coverage components** : ≥ 50%
- **Tests Rust** : 100% passants
- **Clippy** : Zéro erreurs critiques

#### Amélioration Continue
- **Review des tests** : Qualité et pertinence
- **Optimisation** : Performance des tests
- **Documentation** : Mise à jour des guides

# Guide de Développement

## Outils de DX (Developer Experience)

### Formatage et Linting Automatique

Le projet utilise plusieurs outils pour maintenir la qualité du code :

#### Pre-commit Hooks (Husky + lint-staged)
- **Formatage automatique** : Prettier formate le code avant chaque commit
- **Linting automatique** : ESLint corrige les erreurs de style
- **Validation des commits** : Commitlint vérifie le format des messages

#### Configuration VSCode
- **Formatage automatique** : `Ctrl+S` (ou `Cmd+S`) formate automatiquement
- **Extensions recommandées** : Installées automatiquement
- **Paramètres partagés** : Cohérence entre tous les développeurs

### Messages de Commit

Le projet suit les [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
# Format
<type>[optional scope]: <description>

# Exemples
feat: ajouter la fonctionnalité de capture d'écran
fix: corriger le bug de fermeture de fenêtre
docs: mettre à jour la documentation API
style: reformater le code selon les standards
refactor: refactoriser la logique de validation
test: ajouter des tests pour le module stealth
```

#### Types de Commit
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage, points-virgules manquants, etc.
- `refactor` : Refactorisation du code
- `perf` : Amélioration des performances
- `test` : Ajout ou modification de tests
- `build` : Changements dans le système de build
- `ci` : Changements dans l'intégration continue
- `chore` : Tâches de maintenance
- `revert` : Annulation d'un commit précédent
- `security` : Corrections de sécurité

### Scripts Disponibles

```bash
# Formatage manuel
npm run format          # Formater tout le code
npx prettier --write .  # Formater avec Prettier
npx eslint --fix .      # Corriger les erreurs ESLint

# Tests
npm run test            # Lancer les tests
npm run test:watch      # Tests en mode watch
npm run test:coverage   # Tests avec couverture

# Build
npm run build           # Build de production
npm run dev             # Serveur de développement
```

### Configuration des Extensions VSCode

Le projet recommande automatiquement les extensions suivantes :
- `esbenp.prettier-vscode` : Formatage Prettier
- `dbaeumer.vscode-eslint` : Linting ESLint
- `bradlc.vscode-tailwindcss` : Support Tailwind CSS
- `ms-vscode.vscode-typescript-next` : TypeScript avancé
- `tauri-apps.tauri-vscode` : Support Tauri

### Workflow de Développement

1. **Créer une branche** : `git checkout -b feature/nouvelle-fonctionnalite`
2. **Développer** : Le code est automatiquement formaté à la sauvegarde
3. **Tester** : `npm run test` avant de commiter
4. **Commiter** : Les hooks pre-commit valident automatiquement le code
5. **Pousser** : `git push origin feature/nouvelle-fonctionnalite`

### Résolution de Problèmes

#### Erreur de Commit Rejeté
Si un commit est rejeté par commitlint :
```bash
# Vérifier le format du message
git commit -m "feat: description en minuscules sans point final"
```

#### Erreur de Formatage
Si le formatage échoue :
```bash
# Formater manuellement
npx prettier --write .
npx eslint --fix .
```

#### Hooks Husky Non Fonctionnels
Si les hooks ne se déclenchent pas :
```bash
# Réinstaller les hooks
npx husky install
chmod +x .husky/pre-commit .husky/commit-msg
```

### Bonnes Pratiques

1. **Commits atomiques** : Un commit = une fonctionnalité/bug fix
2. **Messages descriptifs** : Expliquer le "pourquoi" pas le "quoi"
3. **Tests avant commit** : Toujours lancer les tests
4. **Formatage automatique** : Laisser Prettier faire le travail
5. **Linting** : Corriger les erreurs ESLint avant de commiter

### Intégration Continue

Les outils de DX s'intègrent avec :
- **GitHub Actions** : Validation automatique des PR
- **Pre-commit hooks** : Validation locale avant push
- **VSCode** : Validation en temps réel pendant le développement

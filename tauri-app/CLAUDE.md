# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev                    # Start development server (Vite + Tauri dev mode)
npm run tauri:dev             # Start Tauri development server
npm run tauri:dev:stealth     # Start with stealth mode features enabled
npm run tauri:dev:debug       # Start with debug features enabled
```

### Build
```bash
npm run build                 # Build frontend (TypeScript + Vite)
npm run tauri:build           # Build complete Tauri application
npm run tauri:build:stealth   # Build with stealth mode features
npm run tauri:build:debug     # Build with debug features
```

### Testing
```bash
npm run test                  # Run frontend tests with Vitest
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Run tests with coverage report
npm run test:rust             # Run Rust backend tests
npm run test:rust:clippy      # Run Rust linting and static analysis
npm run test:all              # Run all tests (Rust + TypeScript)
```

### Code Quality
```bash
npm run format                # Format all code with Prettier + ESLint fix
npm run format:check          # Check formatting without changing files
npm run lint                  # Lint TypeScript/TSX files
npm run lint:fix              # Lint and fix TypeScript/TSX files  
npm run type-check            # TypeScript type checking without build
```

### Cargo Commands (Rust Backend)
```bash
npm run cargo:dev             # Build Rust with dev features
npm run cargo:debug           # Build Rust with debug features
npm run cargo:stealth         # Build Rust with stealth_macos features
npm run cargo:prod            # Build Rust for production
npm run cargo:secure          # Build Rust in secure mode (no private APIs)
```

## Architecture

### High-Level Structure
This is a **Tauri v2** application combining a **React frontend** with a **Rust backend**. The app implements "Numa" - an AI assistant with advanced stealth capabilities for macOS.

### Key Architectural Patterns

#### Frontend (React + TypeScript)
- **Router-based navigation**: Uses React Router with HashRouter for `/hud` and `/panel` routes
- **Custom hooks architecture**: Extensive use of custom hooks for state management, performance, accessibility, and observability
- **Component composition**: Main components include HUDBar, DropdownPanel, and various content panels
- **Stealth observability**: Dynamic observability system that adjusts based on stealth mode status

#### Backend (Rust + Tauri)
- **Feature-based compilation**: Uses Cargo features for dev/prod isolation and macOS API security
- **Modular platform support**: Platform-specific modules (`platform/macos.rs`, `platform/stub.rs`)
- **Stealth implementation**: Uses macOS private APIs (NSWindow.sharingType) for screen capture invisibility
- **Security-first approach**: Conditional compilation ensures private APIs only compile when needed

### Stealth Mode System
The core architectural feature is the **stealth mode** that makes windows invisible to screen captures:

#### Rust Backend (`src-tauri/src/`)
- `stealth.rs`: Core stealth state management and toggle functionality
- `platform/macos.rs`: macOS-specific private API implementations (objc calls)
- `platform/stub.rs`: No-op implementations for non-macOS or when stealth features disabled
- Feature flags control compilation: `stealth_macos`, `dev`, `debug`, `secure`

#### Frontend Stealth Integration
- `useStealthObservability.ts`: Dynamically adjusts telemetry/logging based on stealth status
- `useDelayedObservability.ts`: Implements delayed initialization to avoid startup performance impact
- Event-driven updates: Listens for `stealth-activated`/`stealth-deactivated` events from Rust

### Window Management
- **HUD Window**: Always-on-top, transparent, borderless main interface
- **Panel Window**: Child window that appears/disappears, also stealth-capable
- **Parent-child relationship**: Panel is created as child of HUD for proper layering

### Performance Architecture
- **Lazy loading**: Components loaded on-demand via `LazyComponents.tsx`
- **Bundle splitting**: Manual chunks for vendor, router, UI, and OCR dependencies
- **Optimized dependencies**: Tailwind CSS v4 with Vite plugin, performance monitoring hooks

### Security Architecture
- **CSP Implementation**: Strict Content Security Policy with CSPManager component
- **Secure storage**: Keyring-based secure credential storage via Tauri commands
- **Feature isolation**: Production builds can exclude private APIs entirely via `secure` feature
- **Permission minimization**: Tauri capabilities restrict API access to essentials only

## Development Workflow

### Feature Development
1. Use `npm run tauri:dev:debug` for full development features + verbose logging
2. Frontend changes hot-reload via Vite; Rust changes require restart
3. Test stealth functionality with `npm run tauri:dev:stealth`

### Testing Strategy
- Frontend: Vitest with React Testing Library
- Rust: Standard cargo test with feature-specific test runs
- E2E: Playwright tests for full application workflows
- Run `npm run test:all` before commits to validate all components

### Cargo Features System
Critical for understanding builds - see `CARGO_FEATURES.md` for details:
- `default = ["stealth_macos"]`: Production build with stealth mode
- `dev`: Development mode with tests and stealth
- `debug`: Development mode with verbose logging  
- `secure`: Production without private APIs for distribution
- `stealth_macos`: Enable macOS private API usage (objc, core-graphics, cocoa)

### Code Quality
- Pre-commit hooks enforce formatting via Prettier and ESLint
- Husky + lint-staged for automatic code quality
- Commitlint enforces conventional commits
- TypeScript strict mode enabled with comprehensive linting rules

### Important Paths
- Main app entry: `src/main.tsx` → `src/AppWithRouter.tsx`
- HUD interface: `src/pages/MainHUDPage.tsx`
- Panel interface: `src/pages/PanelPage.tsx`
- Rust entry: `src-tauri/src/lib.rs`
- Tauri config: `src-tauri/tauri.conf.json`
- Stealth logic: `src-tauri/src/stealth.rs`

## Special Considerations

### macOS Private APIs
- Code using objc, core-graphics, cocoa is conditionally compiled
- Always wrap in `#[cfg(all(target_os = "macos", feature = "stealth_macos"))]`
- Provide stub implementations for non-macOS/non-stealth builds
- Private API usage isolated to `platform/macos.rs` module

### Observability Management  
- Dynamic observability system adjusts to stealth mode
- Sentry, metrics, and logging automatically disabled in stealth mode
- User consent tracking for re-enabling observability when stealth deactivated
- See `useStealthObservability.ts` for implementation details

### Bundle Optimization
- Manual chunk splitting configured in `vite.config.ts`
- OCR functionality (Tesseract.js) isolated to separate bundle
- Asset optimization scripts available (`optimize-assets.sh`)
- Bundle analysis available via visualizer plugin

### Security Compliance
- Never commit secrets or API keys
- Use secure storage APIs for sensitive data
- Validate all user inputs via Zod schemas (`utils/validation.ts`)
- CSP violations tracked and reported via CSPManager
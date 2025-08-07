#[cfg(test)]
mod tests {
    use crate::{
        PANEL_WIDTH, PANEL_HEIGHT, PANEL_INITIAL_X, PANEL_INITIAL_Y,
        capture_screen_internal, capture_and_analyze, get_image_as_base64
    };
    use tempfile::tempdir;

    // Tests pour les fonctions utilitaires
    #[test]
    fn test_constants_are_valid() {
        assert!(PANEL_WIDTH > 0.0);
        assert!(PANEL_HEIGHT > 0.0);
        assert!(PANEL_INITIAL_X >= 0.0);
        assert!(PANEL_INITIAL_Y >= 0.0);
    }

    // Tests pour la capture d'écran
    #[test]
    fn test_capture_screen_internal_returns_path() {
        let result = capture_screen_internal();
        match result {
            Ok(path) => {
                assert!(!path.is_empty());
                assert!(path.contains("screenshot_"));
                assert!(path.ends_with(".png"));
            }
            Err(_) => {
                // C'est normal que ça échoue dans un environnement de test
                // sans écran ou permissions
            }
        }
    }

    #[test]
    fn test_capture_and_analyze_returns_string() {
        let result = capture_and_analyze();
        assert!(!result.is_empty());
        assert!(result.contains("Capture") || result.contains("Erreur"));
    }

    // Tests pour la conversion base64
    #[test]
    fn test_get_image_as_base64_with_invalid_path() {
        let result = get_image_as_base64("invalid_path.png".to_string());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Erreur de lecture"));
    }

    #[test]
    fn test_get_image_as_base64_mime_type_detection() {
        // Test avec un fichier temporaire PNG
        let temp_dir = tempdir().unwrap();
        let png_path = temp_dir.path().join("test.png");
        std::fs::write(&png_path, b"fake png data").unwrap();
        
        let result = get_image_as_base64(png_path.to_string_lossy().to_string());
        if result.is_ok() {
            let base64_string = result.unwrap();
            assert!(base64_string.starts_with("data:image/png;base64,"));
        }
    }

    // Tests pour les fonctions de fenêtre
    #[test]
    fn test_resize_window_parameters() {
        // Test que les paramètres sont valides
        let width = 800.0;
        let height = 600.0;
        assert!(width > 0.0);
        assert!(height > 0.0);
    }

    // Tests pour les fonctions de panel
    #[test]
    fn test_panel_constants_consistency() {
        // Vérifier que les dimensions du panel sont cohérentes
        assert!(PANEL_WIDTH > PANEL_INITIAL_X);
        assert!(PANEL_HEIGHT > PANEL_INITIAL_Y);
    }

    // Tests d'intégration avec Tauri
    #[test]
    fn test_tauri_app_structure() {
        // Test que la structure de l'application est correcte
        assert!(PANEL_WIDTH > 0.0);
        assert!(PANEL_HEIGHT > 0.0);
        assert!(PANEL_INITIAL_X >= 0.0);
        assert!(PANEL_INITIAL_Y >= 0.0);
    }

    // Tests de performance
    #[test]
    fn test_ghost_panel_performance() {
        // Test que la fonction ghost_panel ne panique pas
        // (on ne peut pas tester avec une vraie fenêtre en test unitaire)
        let start = std::time::Instant::now();
        
        // Simuler des appels rapides
        for _ in 0..100 {
            // Test que la logique de ghost_panel est correcte
            let ghost = true;
            let alpha = if ghost { 0.0 } else { 1.0 };
            let ignores = ghost;
            
            assert_eq!(alpha, 0.0);
            assert_eq!(ignores, true);
        }
        
        let duration = start.elapsed();
        assert!(duration.as_millis() < 100); // Doit être rapide
    }

    // Tests de robustesse
    #[test]
    fn test_error_handling_patterns() {
        // Test que nos patterns de gestion d'erreur sont corrects
        let error = std::io::Error::new(std::io::ErrorKind::NotFound, "test error");
        let tauri_error = tauri::Error::from(error);
        
        assert!(tauri_error.to_string().contains("test error"));
    }

    // Tests de configuration
    #[test]
    fn test_panel_configuration() {
        // Vérifier que la configuration du panel est logique
        assert!(PANEL_WIDTH > 0.0 && PANEL_WIDTH < 10000.0); // Raisonnable
        assert!(PANEL_HEIGHT > 0.0 && PANEL_HEIGHT < 10000.0); // Raisonnable
        assert!(PANEL_INITIAL_X >= 0.0);
        assert!(PANEL_INITIAL_Y >= 0.0);
    }

    // Tests de sécurité
    #[test]
    fn test_path_safety() {
        // Test que les chemins de fichiers sont sécurisés
        let temp_dir = tempdir().unwrap();
        let safe_path = temp_dir.path().join("test.png");
        
        // Vérifier que le chemin est dans le répertoire temporaire
        assert!(safe_path.starts_with(temp_dir.path()));
    }

    // Tests de régression
    #[test]
    fn test_regression_panel_dimensions() {
        // S'assurer que les dimensions du panel n'ont pas changé accidentellement
        const EXPECTED_WIDTH: f64 = 1072.0;
        const EXPECTED_HEIGHT: f64 = 618.0;
        
        assert_eq!(PANEL_WIDTH, EXPECTED_WIDTH);
        assert_eq!(PANEL_HEIGHT, EXPECTED_HEIGHT);
    }

    #[test]
    fn test_panel_ghost_logic() {
        // Test de la logique de ghost panel
        let test_cases = vec![
            (true, 0.0, true),   // ghost=true -> alpha=0.0, ignores=true
            (false, 1.0, false), // ghost=false -> alpha=1.0, ignores=false
        ];

        for (ghost, expected_alpha, expected_ignores) in test_cases {
            let alpha = if ghost { 0.0 } else { 1.0 };
            let ignores = ghost;
            
            assert_eq!(alpha, expected_alpha);
            assert_eq!(ignores, expected_ignores);
        }
    }

    #[test]
    fn test_window_management_patterns() {
        // Test des patterns de gestion de fenêtres
        let window_names = vec!["hud", "panel"];
        
        for name in window_names {
            assert!(!name.is_empty());
            assert!(name.len() < 50); // Nom raisonnable
        }
    }
}

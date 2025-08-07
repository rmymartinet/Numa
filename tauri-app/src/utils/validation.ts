import { useState, useEffect, useCallback, useMemo } from 'react';

// Système de validation pour Numa

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  sanitize?: (value: any) => any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export class Validator {
  private rules: Record<string, ValidationRule> = {};

  addRule(fieldName: string, rule: ValidationRule): void {
    this.rules[fieldName] = { ...this.rules[fieldName], ...rule };
  }

  validate(data: Record<string, any>): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    for (const [fieldName, value] of Object.entries(data)) {
      const rule = this.rules[fieldName];
      if (!rule) {
        results[fieldName] = { isValid: true, errors: [] };
        continue;
      }

      results[fieldName] = this.validateField(value, rule);
    }

    return results;
  }

  private validateField(value: any, rule: ValidationRule): ValidationResult {
    const errors: string[] = [];
    let sanitizedValue = value;

    // Sanitisation
    if (rule.sanitize) {
      try {
        sanitizedValue = rule.sanitize(value);
      } catch (error) {
        errors.push(`Erreur de sanitisation: ${error}`);
      }
    }

    // Validation required
    if (rule.required && (sanitizedValue === null || sanitizedValue === undefined || sanitizedValue === '')) {
      errors.push('Ce champ est requis');
    }

    // Validation longueur pour les strings
    if (typeof sanitizedValue === 'string') {
      if (rule.minLength && sanitizedValue.length < rule.minLength) {
        errors.push(`Minimum ${rule.minLength} caractères requis`);
      }
      if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
        errors.push(`Maximum ${rule.maxLength} caractères autorisés`);
      }
    }

    // Validation pattern
    if (rule.pattern && typeof sanitizedValue === 'string' && !rule.pattern.test(sanitizedValue)) {
      errors.push('Format invalide');
    }

    // Validation custom
    if (rule.custom) {
      try {
        const customResult = rule.custom(sanitizedValue);
        if (typeof customResult === 'string') {
          errors.push(customResult);
        } else if (!customResult) {
          errors.push('Validation personnalisée échouée');
        }
      } catch (error) {
        errors.push(`Erreur de validation: ${error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  }
}

// Règles de validation prédéfinies
export const commonRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    sanitize: (value: string) => value.toLowerCase().trim(),
  },
  url: {
    pattern: /^https?:\/\/.+/,
    sanitize: (value: string) => value.trim(),
  },
  phone: {
    pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/,
    sanitize: (value: string) => value.replace(/[\s\-\(\)]/g, ''),
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_-]+$/,
    sanitize: (value: string) => value.toLowerCase().trim(),
  },
};

// Fonctions de sanitisation
export const sanitizers = {
  html: (value: string) => {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  },
  sql: (value: string) => {
    return value.replace(/['";\\]/g, '');
  },
  xss: (value: string) => {
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
  filename: (value: string) => {
    return value.replace(/[<>:"/\\|?*]/g, '_');
  },
  number: (value: any) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  },
  boolean: (value: any) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    return Boolean(value);
  },
};

// Validation de fichiers
export const fileValidation = {
  image: (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return 'Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.';
    }

    if (file.size > maxSize) {
      return 'Fichier trop volumineux. Maximum 5MB.';
    }

    return true;
  },
  document: (file: File) => {
    const validTypes = ['application/pdf', 'text/plain', 'application/msword'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return 'Type de fichier non supporté. Utilisez PDF, TXT ou DOC.';
    }

    if (file.size > maxSize) {
      return 'Fichier trop volumineux. Maximum 10MB.';
    }

    return true;
  },
};

// Hook React pour la validation
export function useValidation<T extends Record<string, any>>(
  initialData: T,
  rules: Record<keyof T, ValidationRule>
) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<keyof T, string[]>>({} as any);
  const [isValid, setIsValid] = useState(false);

  const validator = useMemo(() => {
    const v = new Validator();
    Object.entries(rules).forEach(([field, rule]) => {
      v.addRule(field, rule);
    });
    return v;
  }, [rules]);

  const validate = useCallback(() => {
    const results = validator.validate(data);
    const newErrors: Record<keyof T, string[]> = {} as any;
    let allValid = true;

    Object.entries(results).forEach(([field, result]) => {
      newErrors[field as keyof T] = result.errors;
      if (!result.isValid) allValid = false;
    });

    setErrors(newErrors);
    setIsValid(allValid);
    return allValid;
  }, [data, validator]);

  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setErrors({} as any);
    setIsValid(false);
  }, [initialData]);

  useEffect(() => {
    validate();
  }, [data, validate]);

  return {
    data,
    errors,
    isValid,
    updateField,
    validate,
    reset,
  };
}

import { useState, useCallback } from 'react';
import { ERROR_MESSAGES } from '@/utils/errorMessages';

export interface FormField {
  value: string;
  error?: string;
  touched?: boolean;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: string) => string | null;
}

export interface FieldConfig {
  [key: string]: ValidationRule;
}

export function useFormValidation<T extends Record<string, any>>(
  initialState: T,
  fieldConfig: FieldConfig
) {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate a single field
  const validateField = useCallback((name: string, value: any): string | null => {
    const config = fieldConfig[name];
    if (!config) return null;

    // Convert value to string for validation
    const stringValue = String(value ?? '');

    // Required validation
    if (config.required && !stringValue.trim()) {
      return ERROR_MESSAGES.REQUIRED[name as keyof typeof ERROR_MESSAGES.REQUIRED] || 
             `${name.replace('_', ' ')} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!stringValue.trim() && !config.required) {
      return null;
    }

    // Length validation
    if (config.minLength && stringValue.length < config.minLength) {
      return ERROR_MESSAGES.FORMAT[name as keyof typeof ERROR_MESSAGES.FORMAT] ||
             `Must be at least ${config.minLength} characters`;
    }

    if (config.maxLength && stringValue.length > config.maxLength) {
      return `Must be no more than ${config.maxLength} characters`;
    }

    // Pattern validation
    if (config.pattern && !config.pattern.test(stringValue)) {
      return ERROR_MESSAGES.FORMAT[name as keyof typeof ERROR_MESSAGES.FORMAT] ||
             'Invalid format';
    }

    // Numeric range validation
    if (config.min !== undefined || config.max !== undefined) {
      const numValue = parseFloat(stringValue);
      
      if (isNaN(numValue)) {
        return ERROR_MESSAGES.FORMAT[name as keyof typeof ERROR_MESSAGES.FORMAT] ||
               'Must be a valid number';
      }
      
      if (config.min !== undefined && numValue < config.min) {
        return ERROR_MESSAGES.RANGE[name as keyof typeof ERROR_MESSAGES.RANGE] ||
               `Must be at least ${config.min}`;
      }
      
      if (config.max !== undefined && numValue > config.max) {
        return ERROR_MESSAGES.RANGE[name as keyof typeof ERROR_MESSAGES.RANGE] ||
               `Must be no more than ${config.max}`;
      }
    }

    // Custom validation
    if (config.custom) {
      return config.custom(stringValue);
    }

    return null;
  }, [fieldConfig]);

  // Update a single field value
  const updateField = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
  }, [errors, touched]);

  // Validate field on blur
  const validateFieldOnBlur = useCallback((name: string) => {
    const value = formData[name] || '';
    const error = validateField(name, value);
    
    setErrors(prev => ({ ...prev, [name]: error || '' }));
    setTouched(prev => ({ ...prev, [name]: true }));
  }, [formData, validateField]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(fieldConfig).forEach(fieldName => {
      const value = formData[fieldName] || '';
      const error = validateField(fieldName, value);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    
    setErrors(newErrors);
    
    // Mark all fields as touched
    const touchedFields = Object.keys(fieldConfig).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(touchedFields);
    
    return Object.keys(newErrors).length === 0;
  }, [formData, fieldConfig, validateField]);

  // Get field props for easy integration with form inputs
  const getFieldProps = useCallback((name: string) => ({
    value: formData[name] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      updateField(name, e.target.value);
    },
    onBlur: () => validateFieldOnBlur(name),
    error: touched[name] ? errors[name] : undefined
  }), [formData, errors, touched, updateField, validateFieldOnBlur]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  // Set multiple fields at once
  const setFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Check if form has any errors
  const hasErrors = Object.values(errors).some(error => error);
  
  // Check if form has been touched
  const isFormTouched = Object.values(touched).some(t => t);
  
  // Check if form is valid (no errors and all required fields filled)
  const isValid = !hasErrors && Object.keys(fieldConfig)
    .filter(name => fieldConfig[name].required)
    .every(name => {
      const value = formData[name];
      return value != null && String(value).trim() !== '';
    });

  return {
    formData,
    errors,
    touched,
    hasErrors,
    isFormTouched,
    isValid,
    updateField,
    validateField,
    validateFieldOnBlur,
    validateForm,
    getFieldProps,
    resetForm,
    setFields
  };
}
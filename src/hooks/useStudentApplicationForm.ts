/**
 * Enhanced form state management with validation for student application
 */
import { useState, useCallback } from 'react';
import type { StudentApplicationData, ValidationError } from '@/types/student-application';
import {
  personalDetailsSchema,
  academicBackgroundSchema,
  studyDetailsSchema,
  coApplicantDetailsSchema,
} from '@/lib/validation/studentValidation';
import { ZodError } from 'zod';

const STEP_SCHEMAS = [
  personalDetailsSchema,
  academicBackgroundSchema,
  studyDetailsSchema,
  coApplicantDetailsSchema,
];

export const useStudentApplicationForm = (
  data: Partial<StudentApplicationData>,
  currentStep: number
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate a single field
   */
  const validateField = useCallback((field: string, value: any): string | null => {
    try {
      const schema = STEP_SCHEMAS[currentStep];
      if (!schema) return null;

      // Validate just this field
      const fieldSchema = (schema as any).shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return null;
    } catch (error) {
      if (error instanceof ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Validation error';
    }
  }, [currentStep]);

  /**
   * Validate current step
   */
  const validateStep = useCallback((): boolean => {
    try {
      const schema = STEP_SCHEMAS[currentStep];
      if (!schema) return true;

      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [currentStep, data]);

  /**
   * Clear error for a field
   */
  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);

  /**
   * Set custom error
   */
  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateField,
    validateStep,
    clearError,
    setError,
    clearAllErrors,
    hasErrors: Object.keys(errors).length > 0,
  };
};

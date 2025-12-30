import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  isValid: boolean;
  detectedType: string;
  expectedType: string;
  confidence: number;
  qualityAssessment: 'good' | 'acceptable' | 'poor' | 'unreadable';
  validationStatus: 'validated' | 'rejected' | 'manual_review';
  notes: string;
  redFlags: string[];
}

interface UseDocumentValidationOptions {
  onValidationComplete?: (result: ValidationResult) => void;
  onValidationError?: (error: string) => void;
}

export function useDocumentValidation(options?: UseDocumentValidationOptions) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const validateDocument = useCallback(async (
    file: File,
    expectedDocumentType: string,
    documentId?: string
  ): Promise<ValidationResult | null> => {
    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);

    try {
      // Only validate images and PDFs with images
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        // Skip validation for unsupported file types
        const skipResult: ValidationResult = {
          isValid: true,
          detectedType: 'unknown',
          expectedType: expectedDocumentType,
          confidence: 0,
          qualityAssessment: 'acceptable',
          validationStatus: 'manual_review',
          notes: 'Unsupported file type for AI validation',
          redFlags: []
        };
        setValidationResult(skipResult);
        options?.onValidationComplete?.(skipResult);
        return skipResult;
      }

      // For PDFs, we pass to the validation function which can handle them
      // The edge function can extract text or flag for manual review
      if (isPdf) {
        // Send PDF metadata to edge function for processing
        // Note: Full PDF content validation would require server-side processing
        const { data, error } = await supabase.functions.invoke('validate-document', {
          body: {
            mimeType: file.type,
            expectedDocumentType,
            documentId,
            isPdf: true,
            fileName: file.name,
            fileSize: file.size,
          }
        });

        if (error) {
          console.error('PDF validation function error:', error);
          // Fall back to manual review for PDFs
          const fallbackResult: ValidationResult = {
            isValid: true,
            detectedType: 'document',
            expectedType: expectedDocumentType,
            confidence: 0,
            qualityAssessment: 'acceptable',
            validationStatus: 'manual_review',
            notes: 'PDF document - requires manual verification',
            redFlags: []
          };
          setValidationResult(fallbackResult);
          options?.onValidationComplete?.(fallbackResult);
          return fallbackResult;
        }

        const result = data as ValidationResult;
        setValidationResult(result);
        options?.onValidationComplete?.(result);
        return result;
      }

      // Convert image to base64
      const base64 = await fileToBase64(file);

      // Call validation edge function
      const { data, error } = await supabase.functions.invoke('validate-document', {
        body: {
          fileBase64: base64,
          mimeType: file.type,
          expectedDocumentType,
          documentId
        }
      });

      if (error) {
        console.error('Validation function error:', error);
        throw new Error(error.message || 'Validation failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const result = data as ValidationResult;
      setValidationResult(result);
      options?.onValidationComplete?.(result);
      return result;

    } catch (error) {
      console.error('Document validation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setValidationError(errorMessage);
      options?.onValidationError?.(errorMessage);
      
      // Return a fallback result that allows upload but marks for review
      const fallbackResult: ValidationResult = {
        isValid: true,
        detectedType: 'unknown',
        expectedType: expectedDocumentType,
        confidence: 0,
        qualityAssessment: 'acceptable',
        validationStatus: 'manual_review',
        notes: `Validation error: ${errorMessage}`,
        redFlags: []
      };
      setValidationResult(fallbackResult);
      return fallbackResult;
    } finally {
      setIsValidating(false);
    }
  }, [fileToBase64, options]);

  const resetValidation = useCallback(() => {
    setValidationResult(null);
    setValidationError(null);
    setIsValidating(false);
  }, []);

  return {
    validateDocument,
    isValidating,
    validationResult,
    validationError,
    resetValidation
  };
}

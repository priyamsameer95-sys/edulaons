import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClassificationResult {
  detected_type: string;
  detected_type_label: string;
  detected_category: string;
  detected_category_label: string;
  detected_owner: 'student' | 'co_applicant' | 'collateral' | 'unknown';
  confidence: number;
  quality: 'good' | 'acceptable' | 'poor' | 'unreadable';
  is_document: boolean;
  red_flags: string[];
  notes: string;
}

export interface QueuedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'classifying' | 'classified' | 'uploading' | 'uploaded' | 'error';
  classification?: ClassificationResult;
  selectedDocumentTypeId?: string;
  selectedCategory?: string;
  error?: string;
}

export function useDocumentClassification() {
  const [isClassifying, setIsClassifying] = useState(false);

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 data (remove data URL prefix)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const classifyDocument = useCallback(async (file: File): Promise<ClassificationResult | null> => {
    // Skip PDFs for now - AI vision works better with images
    if (file.type === 'application/pdf') {
      return {
        detected_type: 'unknown',
        detected_type_label: 'PDF Document',
        detected_category: 'student',
        detected_category_label: 'Student KYC',
        detected_owner: 'unknown',
        confidence: 0,
        quality: 'acceptable',
        is_document: true,
        red_flags: [],
        notes: 'PDF files require manual classification',
      };
    }

    // Only process image files
    if (!file.type.startsWith('image/')) {
      return {
        detected_type: 'unknown',
        detected_type_label: 'Unknown File',
        detected_category: 'student',
        detected_category_label: 'Student KYC',
        detected_owner: 'unknown',
        confidence: 0,
        quality: 'acceptable',
        is_document: false,
        red_flags: ['unsupported_format'],
        notes: 'Unsupported file format',
      };
    }

    setIsClassifying(true);

    try {
      const fileBase64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke('classify-document', {
        body: {
          fileBase64,
          mimeType: file.type,
        },
      });

      if (error) {
        console.error('Classification error:', error);
        return null;
      }

      return data as ClassificationResult;
    } catch (err) {
      console.error('Classification error:', err);
      return null;
    } finally {
      setIsClassifying(false);
    }
  }, [fileToBase64]);

  return {
    classifyDocument,
    isClassifying,
  };
}

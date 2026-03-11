/**
 * AI Document Verification Edge Function
 * 
 * Placeholder for AI Vision logic to scan marksheets and verify
 * student percentages against the punched-in data.
 * 
 * ARCHITECTURE:
 * 1. Receive document URL and expected values
 * 2. Call Vision API (Google Vision/Azure/AWS Textract) to extract text
 * 3. Parse extracted text for percentage/grade values
 * 4. Compare with expected values
 * 5. Update document record with verification status
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyDocumentRequest {
    documentId: string;
    documentUrl: string;
    documentType: string;
    expectedValues: {
        tenth_percentage?: number;
        twelfth_percentage?: number;
        bachelors_percentage?: number;
        bachelors_cgpa?: number;
    };
}

interface ExtractedData {
    raw_text?: string;
    detected_percentages: number[];
    detected_cgpa: number[];
    confidence: number;
    parsing_notes: string[];
}

interface VerificationResult {
    success: boolean;
    verified: boolean;
    extracted_data: ExtractedData;
    mismatches: Array<{
        field: string;
        expected: number;
        found: number | null;
        severity: 'warning' | 'error';
    }>;
    confidence_score: number;
    ai_notes: string;
}

/**
 * PLACEHOLDER: Call Vision API to extract text from document
 * 
 * TODO: Implement actual API integration:
 * - Google Cloud Vision: https://cloud.google.com/vision/docs/ocr
 * - Azure Computer Vision: https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/
 * - AWS Textract: https://docs.aws.amazon.com/textract/latest/dg/what-is.html
 */
async function callVisionAPI(documentUrl: string, documentType: string): Promise<ExtractedData> {
    console.log(`🔍 [AI Vision] Processing document: ${documentType}`);
    console.log(`📄 URL: ${documentUrl}`);

    // PLACEHOLDER IMPLEMENTATION
    // In production, this would call the actual Vision API

    // Simulated delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return placeholder data
    // Real implementation would extract actual percentages from the document
    return {
        raw_text: '[PLACEHOLDER] OCR text extraction pending integration',
        detected_percentages: [],
        detected_cgpa: [],
        confidence: 0,
        parsing_notes: ['AI Vision integration pending - currently in placeholder mode'],
    };
}

/**
 * Compare extracted values with expected values
 */
function compareValues(
    expected: VerifyDocumentRequest['expectedValues'],
    extracted: ExtractedData
): VerificationResult['mismatches'] {
    const mismatches: VerificationResult['mismatches'] = [];
    const tolerance = 2; // Allow 2% tolerance for OCR errors

    // Helper to find closest match
    const findMatch = (expectedVal: number, detected: number[]): number | null => {
        if (detected.length === 0) return null;
        const closest = detected.reduce((prev, curr) =>
            Math.abs(curr - expectedVal) < Math.abs(prev - expectedVal) ? curr : prev
        );
        return Math.abs(closest - expectedVal) <= tolerance ? closest : null;
    };

    // Check each expected value
    if (expected.tenth_percentage !== undefined) {
        const found = findMatch(expected.tenth_percentage, extracted.detected_percentages);
        if (found === null && extracted.detected_percentages.length > 0) {
            mismatches.push({
                field: 'tenth_percentage',
                expected: expected.tenth_percentage,
                found: extracted.detected_percentages[0] || null,
                severity: 'warning',
            });
        }
    }

    if (expected.twelfth_percentage !== undefined) {
        const found = findMatch(expected.twelfth_percentage, extracted.detected_percentages);
        if (found === null && extracted.detected_percentages.length > 0) {
            mismatches.push({
                field: 'twelfth_percentage',
                expected: expected.twelfth_percentage,
                found: null,
                severity: 'warning',
            });
        }
    }

    if (expected.bachelors_percentage !== undefined) {
        const found = findMatch(expected.bachelors_percentage, extracted.detected_percentages);
        if (found === null && extracted.detected_percentages.length > 0) {
            mismatches.push({
                field: 'bachelors_percentage',
                expected: expected.bachelors_percentage,
                found: null,
                severity: 'error',
            });
        }
    }

    if (expected.bachelors_cgpa !== undefined) {
        const found = findMatch(expected.bachelors_cgpa, extracted.detected_cgpa);
        if (found === null && extracted.detected_cgpa.length > 0) {
            mismatches.push({
                field: 'bachelors_cgpa',
                expected: expected.bachelors_cgpa,
                found: null,
                severity: 'error',
            });
        }
    }

    return mismatches;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const body: VerifyDocumentRequest = await req.json();
        const { documentId, documentUrl, documentType, expectedValues } = body;

        console.log('🧪 [AI Doc Verify] Starting verification for document:', documentId);

        // 1. Call Vision API (placeholder)
        const extractedData = await callVisionAPI(documentUrl, documentType);

        // 2. Compare with expected values
        const mismatches = compareValues(expectedValues, extractedData);

        // 3. Determine verification status
        const hasErrors = mismatches.some(m => m.severity === 'error');
        const verified = extractedData.confidence > 0.8 && !hasErrors;

        // 4. Update document record
        const { error: updateError } = await supabase
            .from('documents')
            .update({
                ai_verified: true, // We attempted verification
                ai_extracted_data: extractedData,
                ai_confidence_score: extractedData.confidence,
                ai_mismatch_flag: mismatches.length > 0,
            })
            .eq('id', documentId);

        if (updateError) {
            console.error('❌ Failed to update document:', updateError.message);
            // Don't throw - verification still completed
        }

        const result: VerificationResult = {
            success: true,
            verified,
            extracted_data: extractedData,
            mismatches,
            confidence_score: extractedData.confidence,
            ai_notes: extractedData.confidence === 0
                ? 'AI Vision integration pending - document queued for manual review'
                : verified
                    ? 'Document verified successfully'
                    : `Found ${mismatches.length} potential mismatches requiring review`,
        };

        console.log('✅ [AI Doc Verify] Complete:', result.ai_notes);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('❌ [AI Doc Verify] Error:', error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});

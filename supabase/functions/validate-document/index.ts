import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map expected document type names to their canonical detected types
// This maps UI document names to what the AI detects
const DOCUMENT_TYPE_ALIASES: Record<string, string[]> = {
  'pan_card': ['pan_copy', 'pan_card_copy', 'co_applicant_pan', 'co_applicant_pan_card'],
  'aadhaar': ['aadhaar_copy', 'aadhaar_card', 'aadhaar_card_copy', 'co_applicant_aadhaar'],
  'passport': ['passport_copy', 'passport_document'],
  'bank_statement': ['bank_account_statement', 'indian_bank_account_statement', 'last_6_months_indian_bank_account_statement', 'last___months_indian_bank_account_statement', 'co_applicant_bank_statement'],
  'salary_slip': ['salary_slips', 'latest_salary_slips', 'co_applicant_salary_slips'],
  'itr': ['itr_documents', 'itr_returns', 'income_tax_return', 'co_applicant_itr', 'co_applicant_itr_documents'],
  'offer_letter': ['offer_letter_document', 'job_offer_letter'],
  'visa': ['visa_copy', 'visa_document', 'visa__if_available_'],
  'photo': ['passport_size_photo', 'passport_photo', 'passport_size_photograph'],
  'mark_sheet': ['mark_sheets', 'academic_mark_sheets', 'mark_sheet_document'],
  'degree_certificate': ['degree_certificates', 'graduation_certificate'],
  'admission_letter': ['admission_letter_i_20_cas', 'i_20', 'cas', 'admission_document'],
  'driving_license': ['driving_licence', 'dl', 'driving_license_copy'],
  'voter_id': ['voter_id_card', 'epic_card'],
  'property_deed': ['property_documents', 'property_papers', 'sale_deed'],
};

// Function to check if detected type matches expected type
function isTypeMatch(detectedType: string, expectedType: string): boolean {
  const normalizedDetected = detectedType.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  const normalizedExpected = expectedType.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  
  // Direct match
  if (normalizedDetected === normalizedExpected) return true;
  
  // Check if detected type is a known alias of any canonical type
  for (const [canonical, aliases] of Object.entries(DOCUMENT_TYPE_ALIASES)) {
    const allVariants = [canonical, ...aliases];
    const detectedMatches = allVariants.some(v => normalizedDetected.includes(v) || v.includes(normalizedDetected));
    const expectedMatches = allVariants.some(v => normalizedExpected.includes(v) || v.includes(normalizedExpected));
    
    if (detectedMatches && expectedMatches) {
      return true;
    }
  }
  
  // Fallback substring check
  return normalizedDetected.includes(normalizedExpected) || normalizedExpected.includes(normalizedDetected);
}

interface ValidationResult {
  isValid: boolean;
  detectedType: string;
  expectedType: string;
  confidence: number;
  qualityAssessment: 'good' | 'acceptable' | 'poor' | 'unreadable';
  validationStatus: 'validated' | 'rejected' | 'manual_review';
  notes: string;
  redFlags: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, mimeType, expectedDocumentType, documentId } = await req.json();

    if (!fileBase64 || !expectedDocumentType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fileBase64, expectedDocumentType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the vision prompt - STRICT validation
    const systemPrompt = `You are a STRICT document verification AI. Analyze if the uploaded image matches: ${expectedDocumentType}

CRITICAL RULES:
1. Random photos (selfies, objects, landscapes, people, animals) are NOT documents - set is_document: false
2. Screenshots of documents should be flagged
3. If you cannot clearly identify a known document type, set detected_type: "unknown"
4. Be STRICT - only approve clear, legitimate documents

Return ONLY valid JSON:
{
  "detected_type": "passport|aadhaar|pan_card|voter_id|driving_license|bank_statement|salary_slip|offer_letter|property_deed|photo|mark_sheet|degree_certificate|admission_letter|visa|itr|unknown",
  "is_document": true/false,
  "confidence": 0-100,
  "quality": "good|acceptable|poor|unreadable",
  "is_relevant": true/false,
  "red_flags": ["not_a_document","random_photo","selfie","screenshot","edited","blurry","partial","wrong_type"],
  "reasoning": "MAX 12 WORDS. Format: STATUS | issue. Examples: 'OK | Clear PAN card' or 'REJECTED | Selfie not a document' or 'WRONG TYPE | Aadhaar instead of PAN'"
}

REJECT: selfies, random photos, non-document images, screenshots, heavily edited documents.`;

    const userPrompt = `Expected: ${expectedDocumentType}. What is this document? Is it valid? Quality? Any issues?`;

    console.log(`Validating document. Expected type: ${expectedDocumentType}`);

    // Call Lovable AI (Gemini 2.5 Flash) with vision
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || 'image/jpeg'};base64,${fileBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service quota exceeded." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return manual_review status if AI fails
      return new Response(
        JSON.stringify({
          isValid: true,
          detectedType: 'unknown',
          expectedType: expectedDocumentType,
          confidence: 0,
          qualityAssessment: 'acceptable',
          validationStatus: 'manual_review',
          notes: 'AI validation unavailable - marked for manual review',
          redFlags: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error("No AI content in response");
      return new Response(
        JSON.stringify({
          isValid: true,
          detectedType: 'unknown',
          expectedType: expectedDocumentType,
          confidence: 0,
          qualityAssessment: 'acceptable',
          validationStatus: 'manual_review',
          notes: 'AI validation failed - marked for manual review',
          redFlags: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse AI response
    let aiResult;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      return new Response(
        JSON.stringify({
          isValid: true,
          detectedType: 'unknown',
          expectedType: expectedDocumentType,
          confidence: 0,
          qualityAssessment: 'acceptable',
          validationStatus: 'manual_review',
          notes: 'AI response parsing failed - marked for manual review',
          redFlags: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const detectedType = aiResult.detected_type || 'unknown';
    const confidence = aiResult.confidence || 0;
    const quality = aiResult.quality || 'acceptable';
    const redFlags = aiResult.red_flags || [];
    const isDocument = aiResult.is_document !== false; // Default true for backwards compatibility

    // STRICT validation logic
    let validationStatus: 'validated' | 'rejected' | 'manual_review';
    let isValid = true;
    let notes = aiResult.reasoning || '';

    // Priority 1: Reject non-documents (selfies, random photos, objects)
    if (!isDocument || redFlags.some((f: string) => ['not_a_document', 'random_photo', 'selfie'].includes(f))) {
      validationStatus = 'rejected';
      isValid = false;
      notes = `NOT A DOCUMENT | This image is not a valid ${expectedDocumentType}. Please upload the actual document.`;
    }
    // Priority 2: Reject unknown/unidentifiable documents
    else if (detectedType === 'unknown') {
      validationStatus = 'rejected';
      isValid = false;
      notes = `UNRECOGNIZED | Could not identify this as a valid document. Please upload a clear ${expectedDocumentType}.`;
    }
    // Priority 3: Check if document type matches using smart alias matching
    else if (!isTypeMatch(detectedType, expectedDocumentType)) {
      validationStatus = 'rejected';
      isValid = false;
      notes = `WRONG TYPE | Expected ${expectedDocumentType}, got ${detectedType}`;
    }
    // Priority 4: Reject very low confidence
    else if (confidence < 40) {
      validationStatus = 'rejected';
      isValid = false;
      notes = `LOW CONFIDENCE | Could not verify this document (${confidence}% confidence). Please upload a clearer image.`;
    }
    // Priority 5: Manual review for quality issues
    else if (quality === 'unreadable' || quality === 'poor') {
      validationStatus = 'manual_review';
      notes = `POOR QUALITY | Document is ${quality}. Please upload a clearer version.`;
    }
    // Priority 6: Manual review for edits/screenshots/partial
    else if (redFlags.some((f: string) => ['edited', 'screenshot', 'partial'].includes(f))) {
      validationStatus = 'manual_review';
      notes = `${redFlags.filter((f: string) => ['edited', 'screenshot', 'partial'].includes(f)).join(', ').toUpperCase()} | Needs verification`;
    }
    // Priority 7: Manual review for medium-low confidence
    else if (confidence < 60) {
      validationStatus = 'manual_review';
      notes = `NEEDS REVIEW | ${confidence}% confidence`;
    }
    // Pass: Valid document
    else {
      validationStatus = 'validated';
      notes = notes || `OK | Valid ${expectedDocumentType}`;
    }

    const result: ValidationResult = {
      isValid,
      detectedType: aiResult.detected_type || 'unknown',
      expectedType: expectedDocumentType,
      confidence,
      qualityAssessment: quality,
      validationStatus,
      notes,
      redFlags
    };

    console.log("Validation result:", JSON.stringify(result));

    // Update database if documentId provided
    if (documentId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabase
        .from('lead_documents')
        .update({
          ai_validation_status: result.validationStatus,
          ai_detected_type: result.detectedType,
          ai_confidence_score: result.confidence,
          ai_quality_assessment: result.qualityAssessment,
          ai_validation_notes: result.notes,
          ai_validated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        console.error("Failed to update document validation status:", updateError);
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in validate-document:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        isValid: true,
        validationStatus: 'manual_review',
        notes: 'Validation error - marked for manual review'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

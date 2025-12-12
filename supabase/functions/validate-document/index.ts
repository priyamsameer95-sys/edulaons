import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Document type mapping for validation
const DOCUMENT_TYPE_KEYWORDS: Record<string, string[]> = {
  'passport': ['passport', 'republic of india', 'nationality', 'date of birth', 'place of birth', 'date of issue', 'date of expiry', 'p<ind', 'type p'],
  'aadhaar': ['aadhaar', 'aadhar', 'uidai', 'unique identification', 'government of india', '12 digit', 'enrollment'],
  'pan_card': ['pan', 'permanent account number', 'income tax department', 'govt of india'],
  'voter_id': ['election commission', 'voter id', 'epic', 'electoral'],
  'driving_license': ['driving licence', 'driving license', 'transport department', 'motor vehicle'],
  'bank_statement': ['bank statement', 'account statement', 'transaction', 'balance', 'credit', 'debit', 'opening balance', 'closing balance'],
  'salary_slip': ['salary slip', 'pay slip', 'payslip', 'earnings', 'deductions', 'gross salary', 'net salary', 'basic pay'],
  'offer_letter': ['offer letter', 'appointment letter', 'employment offer', 'job offer', 'we are pleased to offer', 'position offered'],
  'property_deed': ['property', 'deed', 'registration', 'land', 'plot', 'sale deed', 'conveyance'],
  'photo': ['photograph', 'passport size', 'photo'],
  'mark_sheet': ['marks', 'grade', 'result', 'examination', 'semester', 'cgpa', 'percentage', 'university', 'board'],
  'degree_certificate': ['degree', 'certificate', 'conferred', 'bachelor', 'master', 'graduation', 'university'],
  'admission_letter': ['admission', 'acceptance', 'enrolled', 'university', 'congratulations', 'offer of admission', 'i-20', 'cas'],
  'visa': ['visa', 'immigration', 'entry permit', 'authorized stay'],
  'itr': ['income tax return', 'itr', 'assessment year', 'form 16', 'total income'],
};

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

    // Build the vision prompt - CONCISE output
    const systemPrompt = `You are a document verification AI. Analyze if the uploaded image matches: ${expectedDocumentType}

Return ONLY valid JSON:
{
  "detected_type": "passport|aadhaar|pan_card|voter_id|driving_license|bank_statement|salary_slip|offer_letter|property_deed|photo|mark_sheet|degree_certificate|admission_letter|visa|itr|unknown",
  "confidence": 0-100,
  "quality": "good|acceptable|poor|unreadable",
  "is_relevant": true/false,
  "red_flags": ["edited","blurry","screenshot","partial","wrong_type"],
  "reasoning": "MAX 12 WORDS. Format: STATUS | issue. Examples: 'OK | Clear PAN card' or 'EDITED | Fields blurred out' or 'WRONG | Selfie not passport'"
}

Be strict - random photos are NOT documents.`;

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

    // Build validation result
    const normalizedExpectedType = expectedDocumentType.toLowerCase().replace(/[^a-z]/g, '_');
    const normalizedDetectedType = (aiResult.detected_type || 'unknown').toLowerCase().replace(/[^a-z]/g, '_');
    
    // Check if types match (with some flexibility)
    const typeMatches = normalizedDetectedType === normalizedExpectedType || 
      normalizedDetectedType.includes(normalizedExpectedType) ||
      normalizedExpectedType.includes(normalizedDetectedType) ||
      aiResult.is_relevant === true;

    const confidence = aiResult.confidence || 0;
    const quality = aiResult.quality || 'acceptable';
    const redFlags = aiResult.red_flags || [];

    // Determine validation status - keep notes SHORT
    let validationStatus: 'validated' | 'rejected' | 'manual_review';
    let isValid = true;
    let notes = aiResult.reasoning || '';

    if (!typeMatches) {
      validationStatus = 'rejected';
      isValid = false;
      notes = `WRONG TYPE | Expected ${expectedDocumentType}, got ${aiResult.detected_type}`;
    } else if (quality === 'unreadable' || quality === 'poor') {
      validationStatus = 'manual_review';
      notes = `POOR QUALITY | ${quality}`;
    } else if (redFlags.length > 0 && redFlags.some((f: string) => ['edited', 'screenshot', 'partial'].includes(f))) {
      validationStatus = 'manual_review';
      notes = `${redFlags.join(', ').toUpperCase()} | ${notes}`;
    } else if (confidence < 60) {
      validationStatus = 'manual_review';
      notes = `LOW CONFIDENCE | ${confidence}%`;
    } else {
      validationStatus = 'validated';
      notes = notes || 'OK';
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

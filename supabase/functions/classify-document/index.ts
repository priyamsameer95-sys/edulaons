import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All known document types with their categories
const DOCUMENT_TYPES = {
  // Student KYC
  'pan_card': { category: 'student', owner: 'student', aliases: ['pan_copy', 'pan_card_copy'] },
  'aadhaar': { category: 'student', owner: 'student', aliases: ['aadhaar_copy', 'aadhaar_card', 'aadhaar_card_copy'] },
  'passport': { category: 'student', owner: 'student', aliases: ['passport_copy', 'passport_document'] },
  'photo': { category: 'student', owner: 'student', aliases: ['passport_size_photo', 'passport_photo', 'passport_size_photograph', 'photograph'] },
  'mark_sheet': { category: 'student', owner: 'student', aliases: ['mark_sheets', 'academic_mark_sheets', 'mark_sheet_document', 'transcript', 'academic_transcript'] },
  'degree_certificate': { category: 'student', owner: 'student', aliases: ['degree_certificates', 'graduation_certificate', 'diploma'] },
  'offer_letter': { category: 'student', owner: 'student', aliases: ['offer_letter_document', 'admission_offer', 'university_offer', 'condition_letter', 'conditional_offer'] },
  'admission_letter': { category: 'student', owner: 'student', aliases: ['admission_letter_i_20_cas', 'i_20', 'cas', 'admission_document', 'i20'] },
  'english_test': { category: 'student', owner: 'student', aliases: ['ielts', 'toefl', 'pte', 'duolingo', 'english_proficiency_test_result'] },
  'visa': { category: 'student', owner: 'student', aliases: ['visa_copy', 'visa_document', 'visa_stamp'] },
  
  // Co-Applicant Financial
  'co_applicant_pan': { category: 'financial_co_applicant', owner: 'co_applicant', aliases: ['co_applicant_pan_card'] },
  'co_applicant_aadhaar': { category: 'financial_co_applicant', owner: 'co_applicant', aliases: ['co_applicant_aadhaar_card'] },
  'co_applicant_photo': { category: 'financial_co_applicant', owner: 'co_applicant', aliases: ['co_applicant_photograph'] },
  'bank_statement': { category: 'financial_co_applicant', owner: 'co_applicant', aliases: ['bank_account_statement', 'indian_bank_account_statement', 'last_6_months_bank_statement', 'nri_bank_statement'] },
  'salary_slip': { category: 'financial_co_applicant', owner: 'co_applicant', aliases: ['salary_slips', 'latest_salary_slips', 'payslip', 'pay_slip'] },
  'itr': { category: 'financial_co_applicant', owner: 'co_applicant', aliases: ['itr_documents', 'itr_returns', 'income_tax_return', 'tax_return'] },
  
  // Collateral
  'property_deed': { category: 'collateral', owner: 'collateral', aliases: ['property_documents', 'property_papers', 'sale_deed', 'property_sale_deed'] },
  'encumbrance_certificate': { category: 'collateral', owner: 'collateral', aliases: ['ec', 'encumbrance'] },
  'property_tax_receipt': { category: 'collateral', owner: 'collateral', aliases: ['tax_receipt', 'property_tax'] },
  'fd_certificate': { category: 'collateral', owner: 'collateral', aliases: ['fixed_deposit', 'fd', 'fixed_deposit_certificate'] },
  
  // Other KYC
  'driving_license': { category: 'student', owner: 'any', aliases: ['driving_licence', 'dl', 'driving_license_copy'] },
  'voter_id': { category: 'student', owner: 'any', aliases: ['voter_id_card', 'epic_card', 'election_id'] },
};

interface ClassificationResult {
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
  suggested_document_type_id?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  student: 'Student KYC',
  financial_co_applicant: 'Co-Applicant Financial',
  non_financial_co_applicant: 'Non-Financial Co-Applicant',
  collateral: 'Property/Collateral',
  nri_financial: 'NRI Documents',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, mimeType } = await req.json();

    if (!fileBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: fileBase64' }),
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

    // Build the classification prompt
    const systemPrompt = `You are a document classification AI for a student loan application system. Analyze the uploaded document and identify:
1. What type of document it is
2. Who it belongs to (student or co-applicant/guardian)
3. The quality of the document

KNOWN DOCUMENT TYPES (use these exact keys):
- pan_card: PAN Card (Indian tax ID)
- aadhaar: Aadhaar Card (Indian ID)
- passport: Passport
- photo: Passport-size photograph
- mark_sheet: Academic mark sheets/transcripts
- degree_certificate: Degree/graduation certificates
- offer_letter: University offer/admission letter
- admission_letter: I-20/CAS/Admission documents
- english_test: IELTS/TOEFL/PTE/Duolingo scores
- visa: Visa stamp/document
- bank_statement: Bank account statements
- salary_slip: Salary slips/payslips
- itr: Income Tax Returns
- property_deed: Property sale deed
- encumbrance_certificate: Property EC
- property_tax_receipt: Property tax receipt
- fd_certificate: Fixed Deposit certificate
- driving_license: Driving license
- voter_id: Voter ID card

OWNER DETECTION:
- If document shows "student" or young person details → owner: "student"
- If document shows parent/guardian/older person OR income/salary/ITR details → owner: "co_applicant"  
- If document is property/FD related → owner: "collateral"
- Look for names, ages, designations to determine owner

Return ONLY valid JSON:
{
  "detected_type": "one of the types above or 'unknown'",
  "is_document": true/false,
  "owner": "student|co_applicant|collateral|unknown",
  "confidence": 0-100,
  "quality": "good|acceptable|poor|unreadable",
  "red_flags": ["not_a_document","selfie","screenshot","edited","blurry","partial"],
  "notes": "Brief description, max 15 words"
}`;

    const userPrompt = `Classify this document. What type is it? Who does it belong to (student or their parent/co-applicant)? What's the quality?`;

    console.log("Classifying document...");

    // Call Lovable AI with vision
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
      
      // Return unknown if AI fails
      const fallbackResult: ClassificationResult = {
        detected_type: 'unknown',
        detected_type_label: 'Unknown Document',
        detected_category: 'student',
        detected_category_label: 'Student KYC',
        detected_owner: 'unknown',
        confidence: 0,
        quality: 'acceptable',
        is_document: true,
        red_flags: [],
        notes: 'AI classification unavailable - please select document type manually',
      };
      
      return new Response(
        JSON.stringify(fallbackResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error("No AI content in response");
      const fallbackResult: ClassificationResult = {
        detected_type: 'unknown',
        detected_type_label: 'Unknown Document',
        detected_category: 'student',
        detected_category_label: 'Student KYC',
        detected_owner: 'unknown',
        confidence: 0,
        quality: 'acceptable',
        is_document: true,
        red_flags: [],
        notes: 'Classification failed - please select document type manually',
      };
      
      return new Response(
        JSON.stringify(fallbackResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse AI response
    let aiResult;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      const fallbackResult: ClassificationResult = {
        detected_type: 'unknown',
        detected_type_label: 'Unknown Document',
        detected_category: 'student',
        detected_category_label: 'Student KYC',
        detected_owner: 'unknown',
        confidence: 0,
        quality: 'acceptable',
        is_document: true,
        red_flags: [],
        notes: 'Response parsing failed - please select document type manually',
      };
      
      return new Response(
        JSON.stringify(fallbackResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map the detected type to our known types
    const detectedType = aiResult.detected_type?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'unknown';
    const owner = aiResult.owner || 'unknown';
    
    // Find matching document type info
    let typeInfo = DOCUMENT_TYPES[detectedType as keyof typeof DOCUMENT_TYPES];
    
    // If not found directly, check aliases
    if (!typeInfo) {
      for (const [key, info] of Object.entries(DOCUMENT_TYPES)) {
        if (info.aliases.some(alias => detectedType.includes(alias) || alias.includes(detectedType))) {
          typeInfo = info;
          break;
        }
      }
    }

    // Determine category based on detected type and owner
    let category = typeInfo?.category || 'student';
    if (owner === 'co_applicant' && !detectedType.includes('co_applicant')) {
      // If AI detected co-applicant but type doesn't have prefix, adjust category
      if (['pan_card', 'aadhaar', 'photo', 'bank_statement', 'salary_slip', 'itr'].includes(detectedType)) {
        category = 'financial_co_applicant';
      }
    }

    // Generate human-readable labels
    const typeLabels: Record<string, string> = {
      pan_card: 'PAN Card',
      aadhaar: 'Aadhaar Card',
      passport: 'Passport',
      photo: 'Photograph',
      mark_sheet: 'Mark Sheet',
      degree_certificate: 'Degree Certificate',
      offer_letter: 'Offer Letter',
      admission_letter: 'Admission Letter (I-20/CAS)',
      english_test: 'English Test Score',
      visa: 'Visa',
      bank_statement: 'Bank Statement',
      salary_slip: 'Salary Slip',
      itr: 'Income Tax Return',
      property_deed: 'Property Deed',
      encumbrance_certificate: 'Encumbrance Certificate',
      property_tax_receipt: 'Property Tax Receipt',
      fd_certificate: 'FD Certificate',
      driving_license: 'Driving License',
      voter_id: 'Voter ID',
      co_applicant_pan: 'Co-Applicant PAN',
      co_applicant_aadhaar: 'Co-Applicant Aadhaar',
      co_applicant_photo: 'Co-Applicant Photo',
      unknown: 'Unknown Document',
    };

    const result: ClassificationResult = {
      detected_type: detectedType,
      detected_type_label: typeLabels[detectedType] || detectedType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      detected_category: category,
      detected_category_label: CATEGORY_LABELS[category] || category,
      detected_owner: owner as ClassificationResult['detected_owner'],
      confidence: aiResult.confidence || 0,
      quality: aiResult.quality || 'acceptable',
      is_document: aiResult.is_document !== false,
      red_flags: aiResult.red_flags || [],
      notes: aiResult.notes || '',
    };

    console.log("Classification result:", JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in classify-document:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        detected_type: 'unknown',
        detected_type_label: 'Unknown Document',
        detected_category: 'student',
        detected_category_label: 'Student KYC',
        detected_owner: 'unknown',
        confidence: 0,
        quality: 'acceptable',
        is_document: true,
        red_flags: [],
        notes: 'Classification error - please select document type manually',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

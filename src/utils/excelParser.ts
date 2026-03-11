/**
 * Excel/CSV Parser Utility
 * 
 * Parses spreadsheet files and maps columns to lead data structure.
 * Supports drag-and-drop bulk upload for Partners.
 */

import * as XLSX from 'xlsx';

export interface ParsedLeadRow {
    rowNumber: number;
    isValid: boolean;
    errors: string[];
    warnings: string[];
    data: {
        // Student fields
        student_name: string;
        student_email: string;
        student_phone: string;
        student_dob?: string;
        student_gender?: string;

        // Study fields
        study_destination: string;
        university_name?: string;
        intake_month: number;
        intake_year: number;
        course_type?: string;

        // Loan fields
        loan_amount: number;
        loan_type: string;

        // Co-applicant fields
        co_applicant_name?: string;
        co_applicant_relationship?: string;
        co_applicant_phone?: string;
        co_applicant_salary?: number;
        co_applicant_occupation?: string;
    };
}

export interface ParseResult {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    warningRows: number;
    rows: ParsedLeadRow[];
    headers: string[];
}

// Standard column mappings (case-insensitive)
const COLUMN_MAPPINGS: Record<string, string> = {
    // Student
    'student name': 'student_name',
    'name': 'student_name',
    'full name': 'student_name',
    'student email': 'student_email',
    'email': 'student_email',
    'email id': 'student_email',
    'student phone': 'student_phone',
    'phone': 'student_phone',
    'mobile': 'student_phone',
    'mobile number': 'student_phone',
    'contact': 'student_phone',
    'dob': 'student_dob',
    'date of birth': 'student_dob',
    'birth date': 'student_dob',
    'gender': 'student_gender',

    // Study
    'country': 'study_destination',
    'destination': 'study_destination',
    'study destination': 'study_destination',
    'destination country': 'study_destination',
    'university': 'university_name',
    'university name': 'university_name',
    'college': 'university_name',
    'intake month': 'intake_month',
    'intake': 'intake_month',
    'month': 'intake_month',
    'intake year': 'intake_year',
    'year': 'intake_year',
    'course type': 'course_type',
    'course': 'course_type',
    'program': 'course_type',

    // Loan
    'loan amount': 'loan_amount',
    'amount': 'loan_amount',
    'requested amount': 'loan_amount',
    'loan type': 'loan_type',
    'type': 'loan_type',
    'secured/unsecured': 'loan_type',

    // Co-applicant
    'co-applicant name': 'co_applicant_name',
    'coapplicant name': 'co_applicant_name',
    'guarantor name': 'co_applicant_name',
    'parent name': 'co_applicant_name',
    'co-applicant relationship': 'co_applicant_relationship',
    'relationship': 'co_applicant_relationship',
    'relation': 'co_applicant_relationship',
    'co-applicant phone': 'co_applicant_phone',
    'guarantor phone': 'co_applicant_phone',
    'co-applicant salary': 'co_applicant_salary',
    'salary': 'co_applicant_salary',
    'income': 'co_applicant_salary',
    'monthly income': 'co_applicant_salary',
    'co-applicant occupation': 'co_applicant_occupation',
    'occupation': 'co_applicant_occupation',
};

// Month name to number mapping
const MONTH_MAP: Record<string, number> = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9, 'sept': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12,
};

/**
 * Parse Excel or CSV file to lead data
 */
export async function parseSpreadsheet(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convert to JSON
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                if (jsonData.length < 2) {
                    reject(new Error('File must have at least a header row and one data row'));
                    return;
                }

                // Get headers and map them
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rawHeaders = jsonData[0].map((h: any) => String(h || '').toLowerCase().trim());
                const mappedHeaders = rawHeaders.map((h) => COLUMN_MAPPINGS[h] || h);

                const rows: ParsedLeadRow[] = [];

                // Parse each data row
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    const parsed = parseRow(row, mappedHeaders, i + 1);
                    rows.push(parsed);
                }

                const validRows = rows.filter(r => r.isValid).length;
                const warningRows = rows.filter(r => r.warnings.length > 0 && r.isValid).length;

                resolve({
                    totalRows: rows.length,
                    validRows,
                    invalidRows: rows.length - validRows,
                    warningRows,
                    rows,
                    headers: rawHeaders,
                });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse a single row
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRow(row: any[], headers: string[], rowNumber: number): ParsedLeadRow {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Create data object from row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData: Record<string, any> = {};
    headers.forEach((header, index) => {
        rawData[header] = row[index];
    });

    // Required field validation
    const studentName = cleanString(rawData.student_name);
    if (!studentName) errors.push('Student Name is required');

    const studentPhone = cleanPhone(rawData.student_phone);
    if (!studentPhone) {
        errors.push('Phone is required');
    } else if (studentPhone.length !== 10) {
        errors.push('Phone must be 10 digits');
    }

    const loanAmount = parseAmount(rawData.loan_amount);
    if (!loanAmount || loanAmount < 100000) {
        errors.push('Loan Amount must be at least ₹1 Lakh');
    }

    const studyDestination = cleanString(rawData.study_destination) || 'USA';
    const intakeMonth = parseMonth(rawData.intake_month);
    const intakeYear = parseYear(rawData.intake_year);

    if (!intakeMonth) warnings.push('Intake month defaulted to January');
    if (!intakeYear) warnings.push('Intake year defaulted to 2026');

    // Email validation (optional but validated if present)
    const email = cleanString(rawData.student_email);
    if (email && !isValidEmail(email)) {
        warnings.push('Email format may be invalid');
    }

    return {
        rowNumber,
        isValid: errors.length === 0,
        errors,
        warnings,
        data: {
            student_name: studentName,
            student_email: email || '',
            student_phone: studentPhone,
            student_dob: cleanString(rawData.student_dob),
            student_gender: cleanString(rawData.student_gender),
            study_destination: studyDestination,
            university_name: cleanString(rawData.university_name),
            intake_month: intakeMonth || 1,
            intake_year: intakeYear || 2026,
            course_type: cleanString(rawData.course_type),
            loan_amount: loanAmount || 0,
            loan_type: cleanString(rawData.loan_type) || 'unsecured',
            co_applicant_name: cleanString(rawData.co_applicant_name),
            co_applicant_relationship: cleanString(rawData.co_applicant_relationship) || 'parent',
            co_applicant_phone: cleanPhone(rawData.co_applicant_phone),
            co_applicant_salary: parseAmount(rawData.co_applicant_salary),
            co_applicant_occupation: cleanString(rawData.co_applicant_occupation),
        },
    };
}

// Helper functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanString(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanPhone(value: any): string {
    if (!value) return '';
    return String(value).replace(/\D/g, '').slice(-10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAmount(value: any): number | undefined {
    if (!value) return undefined;
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? undefined : parsed;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMonth(value: any): number | undefined {
    if (!value) return undefined;

    // If already a number
    const num = parseInt(String(value), 10);
    if (!isNaN(num) && num >= 1 && num <= 12) return num;

    // If month name
    const str = String(value).toLowerCase().trim();
    return MONTH_MAP[str];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseYear(value: any): number | undefined {
    if (!value) return undefined;
    const num = parseInt(String(value), 10);
    if (!isNaN(num)) {
        // Handle two-digit years
        if (num >= 0 && num <= 99) return 2000 + num;
        if (num >= 2020 && num <= 2050) return num;
    }
    return undefined;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Generate a sample CSV template
 */
export function generateTemplate(): Blob {
    const headers = [
        'Student Name',
        'Phone',
        'Email',
        'Country',
        'University',
        'Intake Month',
        'Intake Year',
        'Loan Amount',
        'Loan Type',
        'Co-Applicant Name',
        'Relationship',
        'Co-Applicant Phone',
        'Monthly Income',
    ];

    const sampleRow = [
        'Priya Sharma',
        '9876543210',
        'priya@email.com',
        'USA',
        'Stanford University',
        'September',
        '2026',
        '4000000',
        'unsecured',
        'Rajesh Sharma',
        'parent',
        '9876543211',
        '150000',
    ];

    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    return new Blob([csv], { type: 'text/csv' });
}

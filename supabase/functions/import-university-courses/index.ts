import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Papa from 'https://esm.sh/papaparse@5.4.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UniversityRow {
  name: string;
  country?: string;
  city?: string;
}

interface CourseRow {
  university_name: string;
  degree: string;
  stream_name: string;
  program_name: string;
  study_level: string;
  course_intensity?: string;
  study_mode?: string;
  program_duration?: string;
  tuition_fees?: string;
  starting_month?: string;
  __row_number?: number; // Track row number for error reporting
}

interface ImportSummary {
  success: boolean;
  summary: {
    universitiesCreated: number;
    universitiesSkipped: number;
    coursesCreated: number;
    coursesFailed: number;
    totalProcessed: number;
  };
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  processingTime: number;
}

// Parse CSV content using PapaParse for proper handling of quotes, commas, and special characters
function parseCSV(csvContent: string): { courses: CourseRow[], errors: Array<{ row: number; message: string }> } {
  const parseErrors: Array<{ row: number; message: string }> = [];
  
  const result: any = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      const normalized = header.trim().toLowerCase();
      if (normalized.includes('university') || normalized.includes('institution')) return 'university_name';
      if (normalized.includes('degree') || normalized.includes('qualification')) return 'degree';
      if (normalized.includes('stream') || normalized.includes('field') || normalized.includes('discipline')) return 'stream_name';
      if (normalized.includes('program') || normalized.includes('course name') || normalized.includes('programme')) return 'program_name';
      if (normalized.includes('study level') || normalized.includes('level') || normalized.includes('program level')) return 'study_level';
      if (normalized.includes('intensity')) return 'course_intensity';
      if (normalized.includes('mode')) return 'study_mode';
      if (normalized.includes('duration')) return 'program_duration';
      if (normalized.includes('fees') || normalized.includes('tuition') || normalized.includes('cost')) return 'tuition_fees';
      if (normalized.includes('month') || normalized.includes('start')) return 'starting_month';
      return header;
    },
    transform: (value: string) => value?.trim() || '',
  });

  if (result.errors && result.errors.length > 0) {
    result.errors.forEach((error: any) => {
      parseErrors.push({
        row: error.row || 0,
        message: `CSV parsing error: ${error.message}`
      });
    });
  }

  const courses = ((result.data || []) as any[]).map((row, index) => ({
    university_name: row.university_name || '',
    degree: row.degree || '',
    stream_name: row.stream_name || '',
    program_name: row.program_name || '',
    study_level: row.study_level || '',
    course_intensity: row.course_intensity || null,
    study_mode: row.study_mode || null,
    program_duration: row.program_duration || null,
    tuition_fees: row.tuition_fees || null,
    starting_month: row.starting_month || null,
    __row_number: index + 2,
  }));

  return { courses, errors: parseErrors };
}

// Extract unique universities
function extractUniqueUniversities(courses: CourseRow[]): string[] {
  const uniqueNames = new Set<string>();
  courses.forEach(course => {
    if (course.university_name) {
      uniqueNames.add(course.university_name.trim());
    }
  });
  return Array.from(uniqueNames);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const options = JSON.parse(formData.get('options') as string || '{}');

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${file.name} (${file.size} bytes)`);

    // Read and parse CSV
    const csvContent = await file.text();
    const { courses, errors: parseErrors } = parseCSV(csvContent);
    
    console.log(`Parsed ${courses.length} courses from CSV`);

    const errors: ImportSummary['errors'] = [...parseErrors.map(e => ({
      row: e.row,
      field: 'csv_parsing',
      message: e.message
    }))];
    let universitiesCreated = 0;
    let universitiesSkipped = 0;
    let coursesCreated = 0;
    let coursesFailed = 0;

    // Step 1: Extract unique universities
    const uniqueUniversityNames = extractUniqueUniversities(courses);
    console.log(`Found ${uniqueUniversityNames.length} unique universities`);

    // Step 2: Check existing universities in batches to avoid URL length limits
    const existingUniversityMap = new Map<string, string>();
    const UNIVERSITY_BATCH_SIZE = 100; // Fetch 100 universities at a time
    
    for (let i = 0; i < uniqueUniversityNames.length; i += UNIVERSITY_BATCH_SIZE) {
      const batch = uniqueUniversityNames.slice(i, i + UNIVERSITY_BATCH_SIZE);
      console.log(`Fetching universities batch ${Math.floor(i/UNIVERSITY_BATCH_SIZE) + 1}/${Math.ceil(uniqueUniversityNames.length/UNIVERSITY_BATCH_SIZE)}`);
      
      const { data: batchUniversities, error: fetchError } = await supabase
        .from('universities')
        .select('id, name')
        .in('name', batch);

      if (fetchError) {
        throw new Error(`Failed to fetch universities batch: ${fetchError.message}`);
      }

      (batchUniversities || []).forEach(u => {
        existingUniversityMap.set(u.name.toLowerCase(), u.id);
      });
    }

    console.log(`${existingUniversityMap.size} universities already exist`);

    // Step 3: Create missing universities
    const newUniversities: UniversityRow[] = [];
    for (const name of uniqueUniversityNames) {
      if (!existingUniversityMap.has(name.toLowerCase())) {
        newUniversities.push({
          name: name,
          country: options.defaultCountry || 'Not Specified',
          city: options.defaultCity || 'Not Specified',
        });
      } else {
        universitiesSkipped++;
      }
    }

    if (newUniversities.length > 0 && !options.skipExistingUniversities) {
      console.log(`Creating ${newUniversities.length} new universities...`);
      
      const { data: createdUniversities, error: insertError } = await supabase
        .from('universities')
        .insert(newUniversities)
        .select('id, name');

      if (insertError) {
        console.error('Error creating universities:', insertError);
        errors.push({
          row: 0,
          field: 'universities',
          message: `Failed to create universities: ${insertError.message}`,
        });
      } else {
        universitiesCreated = createdUniversities?.length || 0;
        console.log(`Created ${universitiesCreated} new universities`);
        
        // Add new universities to map
        (createdUniversities || []).forEach(u => {
          existingUniversityMap.set(u.name.toLowerCase(), u.id);
        });
      }
    } else {
      universitiesSkipped = newUniversities.length;
    }

    // Step 4: Process courses in chunks
    const BATCH_SIZE = 500;
    const coursesToInsert: any[] = [];

    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const universityId = existingUniversityMap.get(course.university_name.toLowerCase());

      if (!universityId) {
        errors.push({
          row: i + 2, // +2 for header row and 1-indexed
          field: 'university_name',
          message: `University not found: ${course.university_name}`,
        });
        coursesFailed++;
        continue;
      }

      // Validate required fields
      if (!course.program_name || !course.study_level) {
        errors.push({
          row: i + 2,
          field: 'program_name/study_level',
          message: 'Missing required fields',
        });
        coursesFailed++;
        continue;
      }

      coursesToInsert.push({
        university_id: universityId,
        degree: course.degree,
        stream_name: course.stream_name,
        program_name: course.program_name,
        study_level: course.study_level,
        course_intensity: course.course_intensity || null,
        study_mode: course.study_mode || null,
        program_duration: course.program_duration || null,
        tuition_fees: course.tuition_fees || null,
        starting_month: course.starting_month || null,
        __row_number: course.__row_number,
      });
    }

    console.log(`Inserting ${coursesToInsert.length} courses with row-level error tracking...`);

    // Process courses with hybrid batch processing (fast bulk insert + fallback to individual)
    const SMALL_BATCH = 500; // Increased from 50 for better performance
    const MAX_PROCESSING_TIME = 55000; // 55 seconds (leave 5s buffer before 60s timeout)
    
    for (let i = 0; i < coursesToInsert.length; i += SMALL_BATCH) {
      // Check if we're approaching timeout
      if (Date.now() - startTime > MAX_PROCESSING_TIME) {
        console.log('⚠️ Approaching timeout, returning partial results');
        return new Response(
          JSON.stringify({
            success: true,
            partial: true,
            message: `Processed ${coursesCreated} of ${coursesToInsert.length} courses. Please re-run import to continue from row ${i + 1}.`,
            summary: {
              universitiesCreated,
              universitiesSkipped,
              coursesCreated,
              coursesFailed,
              coursesRemaining: coursesToInsert.length - i,
              totalProcessed: coursesCreated + coursesFailed,
            },
            errors,
            processingTime: Date.now() - startTime,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const batch = coursesToInsert.slice(i, i + SMALL_BATCH);
      console.log(`Processing batch ${Math.floor(i/SMALL_BATCH) + 1}/${Math.ceil(coursesToInsert.length/SMALL_BATCH)}`);
      
      // Use database function for batch insert with proper duplicate handling
      const { data: insertedCount, error: bulkError } = await supabase
        .rpc('batch_insert_courses_ignore_duplicates', {
          course_data: batch.map(c => ({
            university_id: c.university_id,
            degree: c.degree,
            stream_name: c.stream_name,
            program_name: c.program_name,
            study_level: c.study_level,
            course_intensity: c.course_intensity,
            study_mode: c.study_mode,
            program_duration: c.program_duration,
            tuition_fees: c.tuition_fees,
            starting_month: c.starting_month,
          }))
        });
      
      if (!bulkError) {
        // Batch succeeded - database function returns count of actual inserts
        const actualInserted = insertedCount || 0;
        coursesCreated += actualInserted;
        console.log(`✓ Batch processed: ${actualInserted} new courses inserted, ${batch.length - actualInserted} duplicates skipped`);
        continue; // Skip to next batch
      }
      
      // Bulk upsert failed - fall back to individual inserts for precise error tracking
      console.log(`Batch upsert failed (${bulkError.code}), processing ${batch.length} rows individually...`);
      
      for (const course of batch) {
        try {
          const { data, error: insertError } = await supabase
            .from('courses')
            .insert({
              university_id: course.university_id,
              degree: course.degree,
              stream_name: course.stream_name,
              program_name: course.program_name,
              study_level: course.study_level,
              course_intensity: course.course_intensity,
              study_mode: course.study_mode,
              program_duration: course.program_duration,
              tuition_fees: course.tuition_fees,
              starting_month: course.starting_month,
            })
            .select('id');

          if (insertError) {
            if (insertError.code === '23505') {
              if (options.skipDuplicateCourses) {
                coursesCreated++;
              } else {
                coursesFailed++;
                errors.push({
                  row: course.__row_number || 0,
                  field: 'unique_constraint',
                  message: `Duplicate: ${course.program_name} at ${course.university_id}`
                });
              }
            } else if (insertError.code === '23503') {
              coursesFailed++;
              errors.push({
                row: course.__row_number || 0,
                field: 'university_id',
                message: `Invalid university reference: ${insertError.message}`
              });
            } else if (insertError.code === '23502') {
              coursesFailed++;
              errors.push({
                row: course.__row_number || 0,
                field: 'required_field',
                message: `Missing required field: ${insertError.message}`
              });
            } else if (insertError.code === '22001') {
              coursesFailed++;
              errors.push({
                row: course.__row_number || 0,
                field: 'field_length',
                message: `Field too long: ${insertError.message}`
              });
            } else {
              coursesFailed++;
              errors.push({
                row: course.__row_number || 0,
                field: 'database',
                message: `Error (${insertError.code}): ${insertError.message}`
              });
            }
          } else {
            coursesCreated++;
          }
        } catch (err) {
          coursesFailed++;
          const errorMessage = err instanceof Error ? err.message : String(err);
          errors.push({
            row: course.__row_number || 0,
            field: 'exception',
            message: `Unexpected error: ${errorMessage}`
          });
        }
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`Import completed in ${processingTime}ms`);

    const result: ImportSummary = {
      success: true,
      summary: {
        universitiesCreated,
        universitiesSkipped,
        coursesCreated,
        coursesFailed,
        totalProcessed: courses.length,
      },
      errors,
      processingTime,
    };

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        processingTime: Date.now() - startTime,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

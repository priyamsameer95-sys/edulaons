import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Parse CSV content
function parseCSV(csvContent: string): CourseRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: CourseRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    rows.push({
      university_name: row['university_name'] || '',
      degree: row['degree'] || '',
      stream_name: row['stream_name'] || '',
      program_name: row['program_name'] || '',
      study_level: row['study_level'] || row['studylevel'] || '',
      course_intensity: row['course_intensity'] || row['courseintensity'],
      study_mode: row['study_mode'] || row['studymode'],
      program_duration: row['program_duration'] || row['programduration'],
      tuition_fees: row['tuition_fees'] || row['tutition_fees'] || row['tution_fees'],
      starting_month: row['starting_month'] || row['startingmonth'],
    });
  }

  return rows;
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
    const courses = parseCSV(csvContent);
    
    console.log(`Parsed ${courses.length} courses from CSV`);

    const errors: ImportSummary['errors'] = [];
    let universitiesCreated = 0;
    let universitiesSkipped = 0;
    let coursesCreated = 0;
    let coursesFailed = 0;

    // Step 1: Extract unique universities
    const uniqueUniversityNames = extractUniqueUniversities(courses);
    console.log(`Found ${uniqueUniversityNames.length} unique universities`);

    // Step 2: Check existing universities
    const { data: existingUniversities, error: fetchError } = await supabase
      .from('universities')
      .select('id, name')
      .in('name', uniqueUniversityNames);

    if (fetchError) {
      throw new Error(`Failed to fetch universities: ${fetchError.message}`);
    }

    const existingUniversityMap = new Map(
      (existingUniversities || []).map(u => [u.name.toLowerCase(), u.id])
    );

    console.log(`${existingUniversities?.length || 0} universities already exist`);

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
      });
    }

    console.log(`Inserting ${coursesToInsert.length} courses in batches of ${BATCH_SIZE}...`);

    // Insert courses in batches
    for (let i = 0; i < coursesToInsert.length; i += BATCH_SIZE) {
      const batch = coursesToInsert.slice(i, i + BATCH_SIZE);
      
      const { data, error: insertError } = await supabase
        .from('courses')
        .insert(batch)
        .select('id');

      if (insertError) {
        console.error(`Batch ${i / BATCH_SIZE + 1} error:`, insertError);
        
        // Handle duplicate key violations
        if (insertError.code === '23505') {
          console.log(`Skipping ${batch.length} duplicate courses in batch ${i / BATCH_SIZE + 1}`);
          coursesFailed += batch.length;
        } else {
          errors.push({
            row: i,
            field: 'batch',
            message: `Batch insert failed: ${insertError.message}`,
          });
          coursesFailed += batch.length;
        }
      } else {
        const inserted = data?.length || 0;
        coursesCreated += inserted;
        console.log(`Batch ${i / BATCH_SIZE + 1}: Inserted ${inserted} courses`);
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

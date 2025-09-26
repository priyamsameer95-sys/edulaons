-- Allow INSERT operations on universities table
CREATE POLICY "Allow public insert on universities" 
ON universities 
FOR INSERT 
WITH CHECK (true);

-- Allow INSERT operations on courses table  
CREATE POLICY "Allow public insert on courses"
ON courses
FOR INSERT 
WITH CHECK (true);
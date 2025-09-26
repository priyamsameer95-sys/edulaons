import { useState, useEffect, useMemo } from 'react';

interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  qs_rank: number | null;
  popular: boolean;
}

// Mock university data - this simulates processing the uploaded university files
const mockUniversityData: University[] = [
  // United States
  { id: '1', name: 'Massachusetts Institute of Technology (MIT)', country: 'United States', city: 'Cambridge', qs_rank: 1, popular: true },
  { id: '2', name: 'Stanford University', country: 'United States', city: 'Stanford', qs_rank: 3, popular: true },
  { id: '3', name: 'Harvard University', country: 'United States', city: 'Cambridge', qs_rank: 4, popular: true },
  { id: '4', name: 'California Institute of Technology (Caltech)', country: 'United States', city: 'Pasadena', qs_rank: 6, popular: true },
  { id: '5', name: 'University of Chicago', country: 'United States', city: 'Chicago', qs_rank: 10, popular: true },
  { id: '6', name: 'University of Pennsylvania', country: 'United States', city: 'Philadelphia', qs_rank: 12, popular: true },
  { id: '7', name: 'Yale University', country: 'United States', city: 'New Haven', qs_rank: 16, popular: true },
  { id: '8', name: 'Columbia University', country: 'United States', city: 'New York', qs_rank: 19, popular: true },
  
  // United Kingdom
  { id: '9', name: 'University of Cambridge', country: 'United Kingdom', city: 'Cambridge', qs_rank: 2, popular: true },
  { id: '10', name: 'University of Oxford', country: 'United Kingdom', city: 'Oxford', qs_rank: 5, popular: true },
  { id: '11', name: 'Imperial College London', country: 'United Kingdom', city: 'London', qs_rank: 7, popular: true },
  { id: '12', name: 'University College London (UCL)', country: 'United Kingdom', city: 'London', qs_rank: 8, popular: true },
  { id: '13', name: 'London School of Economics and Political Science (LSE)', country: 'United Kingdom', city: 'London', qs_rank: 45, popular: true },
  { id: '14', name: 'University of Edinburgh', country: 'United Kingdom', city: 'Edinburgh', qs_rank: 22, popular: true },
  { id: '15', name: "King's College London", country: 'United Kingdom', city: 'London', qs_rank: 40, popular: true },
  { id: '16', name: 'University of Manchester', country: 'United Kingdom', city: 'Manchester', qs_rank: 32, popular: true },
  
  // Canada
  { id: '17', name: 'University of Toronto', country: 'Canada', city: 'Toronto', qs_rank: 21, popular: true },
  { id: '18', name: 'McGill University', country: 'Canada', city: 'Montreal', qs_rank: 30, popular: true },
  { id: '19', name: 'University of British Columbia', country: 'Canada', city: 'Vancouver', qs_rank: 34, popular: true },
  { id: '20', name: 'University of Alberta', country: 'Canada', city: 'Edmonton', qs_rank: 111, popular: false },
  { id: '21', name: 'McMaster University', country: 'Canada', city: 'Hamilton', qs_rank: 152, popular: false },
  
  // Australia
  { id: '22', name: 'Australian National University (ANU)', country: 'Australia', city: 'Canberra', qs_rank: 30, popular: true },
  { id: '23', name: 'University of Melbourne', country: 'Australia', city: 'Melbourne', qs_rank: 13, popular: true },
  { id: '24', name: 'University of Sydney', country: 'Australia', city: 'Sydney', qs_rank: 18, popular: true },
  { id: '25', name: 'University of New South Wales (UNSW)', country: 'Australia', city: 'Sydney', qs_rank: 19, popular: true },
  { id: '26', name: 'University of Queensland', country: 'Australia', city: 'Brisbane', qs_rank: 43, popular: true },
  
  // Germany
  { id: '27', name: 'Technical University of Munich', country: 'Germany', city: 'Munich', qs_rank: 37, popular: true },
  { id: '28', name: 'Ludwig-Maximilians-Universität München', country: 'Germany', city: 'Munich', qs_rank: 54, popular: true },
  { id: '29', name: 'Heidelberg University', country: 'Germany', city: 'Heidelberg', qs_rank: 87, popular: false },
  { id: '30', name: 'Humboldt University of Berlin', country: 'Germany', city: 'Berlin', qs_rank: 120, popular: false },
  
  // France
  { id: '31', name: 'Université PSL', country: 'France', city: 'Paris', qs_rank: 24, popular: true },
  { id: '32', name: 'Institut Polytechnique de Paris', country: 'France', city: 'Paris', qs_rank: 48, popular: true },
  { id: '33', name: 'Sorbonne University', country: 'France', city: 'Paris', qs_rank: 59, popular: true },
  
  // Netherlands
  { id: '34', name: 'Delft University of Technology', country: 'Netherlands', city: 'Delft', qs_rank: 47, popular: true },
  { id: '35', name: 'University of Amsterdam', country: 'Netherlands', city: 'Amsterdam', qs_rank: 53, popular: true },
  { id: '36', name: 'Eindhoven University of Technology', country: 'Netherlands', city: 'Eindhoven', qs_rank: 124, popular: false },
  
  // Singapore
  { id: '37', name: 'National University of Singapore (NUS)', country: 'Singapore', city: 'Singapore', qs_rank: 8, popular: true },
  { id: '38', name: 'Nanyang Technological University (NTU)', country: 'Singapore', city: 'Singapore', qs_rank: 26, popular: true },
  
  // Ireland
  { id: '39', name: 'Trinity College Dublin', country: 'Ireland', city: 'Dublin', qs_rank: 98, popular: false },
  { id: '40', name: 'University College Dublin', country: 'Ireland', city: 'Dublin', qs_rank: 171, popular: false },
  
  // New Zealand
  { id: '41', name: 'University of Auckland', country: 'New Zealand', city: 'Auckland', qs_rank: 68, popular: false },
  { id: '42', name: 'University of Otago', country: 'New Zealand', city: 'Dunedin', qs_rank: 206, popular: false },
];

export const useUniversities = (country: string) => {
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);

  const filteredUniversities = useMemo(() => {
    if (!country) return [];
    
    return mockUniversityData
      .filter(uni => uni.country === country)
      .sort((a, b) => {
        // Popular universities first, then by QS rank (lower is better)
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        
        // Both popular or both not popular, sort by rank
        if (a.qs_rank && b.qs_rank) return a.qs_rank - b.qs_rank;
        if (a.qs_rank && !b.qs_rank) return -1;
        if (!a.qs_rank && b.qs_rank) return 1;
        
        // Both have no rank, sort alphabetically
        return a.name.localeCompare(b.name);
      });
  }, [country]);

  useEffect(() => {
    if (!country) {
      setUniversities([]);
      return;
    }

    setLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      setUniversities(filteredUniversities);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [country, filteredUniversities]);

  const searchUniversities = (query: string) => {
    if (!query.trim()) return universities;
    
    const searchTerm = query.toLowerCase().trim();
    return universities.filter(uni => 
      uni.name.toLowerCase().includes(searchTerm) ||
      uni.city.toLowerCase().includes(searchTerm)
    );
  };

  return {
    universities,
    loading,
    searchUniversities,
    totalCount: filteredUniversities.length
  };
};
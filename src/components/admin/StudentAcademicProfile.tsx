import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Award, MapPin, User } from "lucide-react";

interface Student {
  name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  nationality: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  tenth_percentage?: number | null;
  twelfth_percentage?: number | null;
  bachelors_percentage?: number | null;
  bachelors_cgpa?: number | null;
  highest_qualification?: string | null;
  gender?: string | null;
}

interface TestScore {
  test_type: string;
  score: string;
  test_date: string | null;
}

interface StudentAcademicProfileProps {
  student: Student;
  testScores: TestScore[];
}

const StudentAcademicProfile = ({ student, testScores }: StudentAcademicProfileProps) => {
  const formatQualification = (qual?: string | null) => {
    if (!qual) return 'Not Specified';
    return qual.charAt(0).toUpperCase() + qual.slice(1);
  };

  const getScoreBadge = (percentage?: number | null) => {
    if (!percentage) return { variant: 'outline' as const, label: 'N/A' };
    if (percentage >= 90) return { variant: 'default' as const, label: 'Excellent' };
    if (percentage >= 80) return { variant: 'secondary' as const, label: 'Very Good' };
    if (percentage >= 70) return { variant: 'outline' as const, label: 'Good' };
    if (percentage >= 60) return { variant: 'outline' as const, label: 'Average' };
    return { variant: 'destructive' as const, label: 'Below Average' };
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Full Name</label>
            <p className="font-medium">{student.name}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="font-medium">{student.email}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Phone</label>
            <p className="font-medium">{student.phone}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Date of Birth</label>
            <p className="font-medium">
              {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Nationality</label>
            <p className="font-medium">{student.nationality || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Gender</label>
            <p className="font-medium capitalize">{student.gender || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">City</label>
            <p className="font-medium">{student.city || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">State</label>
            <p className="font-medium">{student.state || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">PIN Code</label>
            <p className="font-medium">{student.postal_code || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Academic Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Academic Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Highest Qualification</label>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-medium">{formatQualification(student.highest_qualification)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">10th Grade</label>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-medium text-lg">
                  {student.tenth_percentage ? `${student.tenth_percentage}%` : 'N/A'}
                </p>
                {student.tenth_percentage && (
                  <Badge variant={getScoreBadge(student.tenth_percentage).variant} className="text-xs">
                    {getScoreBadge(student.tenth_percentage).label}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">12th Grade</label>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-medium text-lg">
                  {student.twelfth_percentage ? `${student.twelfth_percentage}%` : 'N/A'}
                </p>
                {student.twelfth_percentage && (
                  <Badge variant={getScoreBadge(student.twelfth_percentage).variant} className="text-xs">
                    {getScoreBadge(student.twelfth_percentage).label}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Bachelor's</label>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-medium text-lg">
                  {student.bachelors_percentage ? `${student.bachelors_percentage}%` : 
                   student.bachelors_cgpa ? `${student.bachelors_cgpa} CGPA` : 'N/A'}
                </p>
                {student.bachelors_percentage && (
                  <Badge variant={getScoreBadge(student.bachelors_percentage).variant} className="text-xs">
                    {getScoreBadge(student.bachelors_percentage).label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Scores */}
      {testScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Test Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {testScores.map((test, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{test.test_type}</span>
                    <Badge variant="secondary">{test.score}</Badge>
                  </div>
                  {test.test_date && (
                    <p className="text-xs text-muted-foreground">
                      Taken: {new Date(test.test_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentAcademicProfile;

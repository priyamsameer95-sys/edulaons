import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Plus, Trash2 } from "lucide-react";
import { TEST_TYPES } from "@/utils/leadCompletionSchema";
import { DatePickerWithYearSelect } from "@/components/ui/date-picker-with-year-select";
import { parseISO } from "date-fns";

interface AcademicTest {
    id?: string;
    test_type: string;
    score: string;
    test_date: string;
    expiry_date: string;
    isNew?: boolean;
    isDeleted?: boolean;
}

interface EditTestsTabProps {
    academicTests: AcademicTest[];
    addAcademicTest: () => void;
    updateAcademicTest: (index: number, field: keyof AcademicTest, value: string) => void;
    removeAcademicTest: (index: number) => void;
    validateTestScore: (testType: string, score: string) => boolean;
    getTestMaxScore: (testType: string) => number;
}

export const EditTestsTab = ({
    academicTests,
    addAcademicTest,
    updateAcademicTest,
    removeAcademicTest,
    validateTestScore,
    getTestMaxScore
}: EditTestsTabProps) => {
    // DEFENSIVE GUARD: Handle undefined academicTests
    const safeAcademicTests = academicTests ?? [];
    const activeTests = safeAcademicTests.filter(test => !test.isDeleted);

    return (
        <div className="space-y-4 mt-0">
            <Card>
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Standardized Tests
                    </CardTitle>
                    <Button onClick={addAcademicTest} variant="outline" size="sm" className="h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Add Test
                    </Button>
                </CardHeader>
                <CardContent>
                    {activeTests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No standardized tests recorded</p>
                            <Button onClick={addAcademicTest} variant="link" size="sm" className="mt-1 h-auto p-0">
                                Add a test score
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {safeAcademicTests.map((test, index) => {
                                if (test.isDeleted) return null;

                                const isValidScore = validateTestScore(test.test_type, test.score);
                                const maxScore = getTestMaxScore(test.test_type);

                                return (
                                    <div key={index} className="grid grid-cols-12 gap-3 items-start p-3 bg-muted/30 rounded-lg border">
                                        <div className="col-span-3 space-y-1.5">
                                            <Label className="text-xs">Test Type</Label>
                                            <Select
                                                value={test.test_type}
                                                onValueChange={(value) => updateAcademicTest(index, 'test_type', value)}
                                            >
                                                <SelectTrigger className="h-8">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TEST_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="col-span-2 space-y-1.5">
                                            <Label className="text-xs">
                                                Score <span className="text-muted-foreground font-normal">/ {maxScore}</span>
                                            </Label>
                                            <Input
                                                value={test.score}
                                                onChange={(e) => updateAcademicTest(index, 'score', e.target.value)}
                                                className={`h-8 ${!isValidScore ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                            />
                                        </div>

                                        <div className="col-span-3 space-y-1.5 flex flex-col">
                                            <Label className="text-xs">Test Date</Label>
                                            <DatePickerWithYearSelect
                                                date={test.test_date ? parseISO(test.test_date) : undefined}
                                                setDate={(date) => updateAcademicTest(index, 'test_date', date ? date.toISOString().split('T')[0] : "")}
                                                placeholder="Pick date"
                                                fromYear={2015}
                                                toYear={new Date().getFullYear()}
                                                className="h-8"
                                            />
                                        </div>

                                        <div className="col-span-3 space-y-1.5 flex flex-col">
                                            <Label className="text-xs">Expiry Date</Label>
                                            <DatePickerWithYearSelect
                                                date={test.expiry_date ? parseISO(test.expiry_date) : undefined}
                                                setDate={(date) => updateAcademicTest(index, 'expiry_date', date ? date.toISOString().split('T')[0] : "")}
                                                placeholder="Pick date"
                                                fromYear={new Date().getFullYear() - 5}
                                                toYear={new Date().getFullYear() + 10}
                                                className="h-8"
                                            />
                                        </div>

                                        <div className="col-span-1 pt-6 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => removeAcademicTest(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {!isValidScore && (
                                            <div className="col-span-12 text-[10px] text-destructive flex items-center gap-1">
                                                <span>Score must be between {TEST_TYPES.find(t => t.value === test.test_type)?.minScore || 0} and {maxScore}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

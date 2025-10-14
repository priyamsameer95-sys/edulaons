import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefactoredLead } from '@/types/refactored-lead';
import { subMonths, format, isAfter } from 'date-fns';

interface LeadPipelineChartProps {
  leads: RefactoredLead[];
}

const timeRanges = [
  { label: 'ALL', value: 'all' },
  { label: '1M', value: '1m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
];

export const LeadPipelineChart = ({ leads }: LeadPipelineChartProps) => {
  const [selectedRange, setSelectedRange] = useState('all');

  const chartData = useMemo(() => {
    const now = new Date();
    const filteredLeads = selectedRange === 'all' ? leads : leads.filter(lead => {
      const createdAt = new Date(lead.created_at);
      const monthsAgo = selectedRange === '1m' ? 1 : selectedRange === '6m' ? 6 : 12;
      return isAfter(createdAt, subMonths(now, monthsAgo));
    });

    // Group by month
    const monthlyData: Record<string, { new: number; in_progress: number; under_review: number; approved: number; rejected: number }> = {};
    
    filteredLeads.forEach(lead => {
      const month = format(new Date(lead.created_at), 'MMM yyyy');
      if (!monthlyData[month]) {
        monthlyData[month] = { new: 0, in_progress: 0, under_review: 0, approved: 0, rejected: 0 };
      }
      
      if (lead.status === 'contacted') monthlyData[month].new++;
      else if (lead.status === 'document_review') monthlyData[month].in_progress++;
      else if (lead.status === 'approved') monthlyData[month].approved++;
      else if (lead.status === 'rejected' || lead.status === 'withdrawn') monthlyData[month].rejected++;
    });

    return Object.entries(monthlyData)
      .map(([name, data]) => ({ name, ...data }))
      .slice(-6); // Last 6 months
  }, [leads, selectedRange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lead Pipeline</CardTitle>
          <div className="flex gap-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={selectedRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="new" fill="#3b82f6" name="New" />
              <Bar dataKey="in_progress" fill="#f59e0b" name="In Progress" />
              <Bar dataKey="under_review" fill="#8b5cf6" name="Under Review" />
              <Bar dataKey="approved" fill="#10b981" name="Approved" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

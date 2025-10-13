import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const timeRanges = [
  { label: 'ALL', value: 'all' },
  { label: '1M', value: '1m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
];

// Sample data - in real app, this would come from props/API
const generateData = (range: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return months.slice(0, range === '1m' ? 1 : range === '6m' ? 6 : 12).map((month) => ({
    month,
    new: Math.floor(Math.random() * 50) + 30,
    in_progress: Math.floor(Math.random() * 80) + 40,
    approved: Math.floor(Math.random() * 60) + 50,
    rejected: Math.floor(Math.random() * 30) + 10,
  }));
};

export const LeadPipelineChart = () => {
  const [selectedRange, setSelectedRange] = useState('6m');
  const data = generateData(selectedRange);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lead Status Pipeline</CardTitle>
          <div className="flex gap-1">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={selectedRange === range.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange(range.value)}
                className="h-8 px-3"
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
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar
                dataKey="new"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="New"
              />
              <Bar
                dataKey="in_progress"
                fill="hsl(var(--warning))"
                radius={[4, 4, 0, 0]}
                name="In Progress"
              />
              <Bar
                dataKey="approved"
                fill="hsl(var(--success))"
                radius={[4, 4, 0, 0]}
                name="Approved"
              />
              <Bar
                dataKey="rejected"
                fill="hsl(var(--destructive))"
                radius={[4, 4, 0, 0]}
                name="Rejected"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

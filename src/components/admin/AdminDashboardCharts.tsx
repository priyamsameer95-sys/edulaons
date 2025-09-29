import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface PartnerData {
  name: string;
  leads: number;
  approved: number;
}

interface TimelineData {
  date: string;
  leads: number;
}

const COLORS = {
  new: '#3b82f6',
  in_progress: '#f59e0b', 
  approved: '#10b981',
  rejected: '#ef4444'
};

const AdminDashboardCharts = () => {
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [partnerData, setPartnerData] = useState<PartnerData[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [filterPeriod, setFilterPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // Fetch status distribution
      const { data: statusCounts } = await supabase
        .from('leads_new')
        .select('status');

      const statusMap: Record<string, number> = {};
      statusCounts?.forEach(lead => {
        statusMap[lead.status] = (statusMap[lead.status] || 0) + 1;
      });

      const statusChartData: StatusData[] = Object.entries(statusMap).map(([status, count]) => ({
        name: status.replace('_', ' ').toUpperCase(),
        value: count,
        color: COLORS[status as keyof typeof COLORS] || '#6b7280'
      }));

      setStatusData(statusChartData);

      // Fetch partner performance
      const { data: partners } = await supabase
        .from('partners')
        .select(`
          name,
          leads_new!partner_id (
            status
          )
        `);

      const partnerChartData: PartnerData[] = partners?.map(partner => ({
        name: partner.name.length > 15 ? partner.name.substring(0, 15) + '...' : partner.name,
        leads: partner.leads_new.length,
        approved: partner.leads_new.filter(lead => lead.status === 'approved').length
      })).filter(p => p.leads > 0) || [];

      setPartnerData(partnerChartData);

      // Fetch timeline data
      const daysAgo = parseInt(filterPeriod);
      const { data: timelineLeads } = await supabase
        .from('leads_new')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString());

      const dateMap: Record<string, number> = {};
      timelineLeads?.forEach(lead => {
        const date = new Date(lead.created_at).toLocaleDateString();
        dateMap[date] = (dateMap[date] || 0) + 1;
      });

      const timelineChartData: TimelineData[] = Object.entries(dateMap)
        .map(([date, count]) => ({ date, leads: count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setTimelineData(timelineChartData);

    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [filterPeriod]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Lead Status Distribution */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Lead Status Distribution</CardTitle>
          <CardDescription>Current lead status breakdown</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ChartContainer
            config={{
              value: {
                label: "Leads",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {statusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Partner Performance */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Partner Performance</CardTitle>
          <CardDescription>Leads by partner organization</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ChartContainer
            config={{
              leads: {
                label: "Total Leads",
                color: "hsl(var(--primary))",
              },
              approved: {
                label: "Approved",
                color: "hsl(var(--success))",
              },
            }}
            className="h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partnerData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                />
                <YAxis />
                <Bar dataKey="leads" fill="hsl(var(--primary))" />
                <Bar dataKey="approved" fill="hsl(var(--success))" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Lead Timeline */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Lead Timeline</CardTitle>
            <CardDescription>Leads created over time</CardDescription>
          </div>
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7d</SelectItem>
              <SelectItem value="30">30d</SelectItem>
              <SelectItem value="90">90d</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="h-80">
          <ChartContainer
            config={{
              leads: {
                label: "New Leads",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardCharts;
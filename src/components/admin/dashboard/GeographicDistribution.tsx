import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface StateData {
  name: string;
  percentage: number;
  leads: number;
  color: string;
}

const stateData: StateData[] = [
  { name: 'Maharashtra', percentage: 75, leads: 342, color: 'bg-primary' },
  { name: 'Karnataka', percentage: 55, leads: 245, color: 'bg-primary/80' },
  { name: 'Delhi', percentage: 65, leads: 198, color: 'bg-primary/70' },
  { name: 'Tamil Nadu', percentage: 45, leads: 156, color: 'bg-primary/60' },
  { name: 'Gujarat', percentage: 35, leads: 123, color: 'bg-primary/50' },
  { name: 'West Bengal', percentage: 30, leads: 98, color: 'bg-primary/40' },
];

export const GeographicDistribution = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Leads by State
          </CardTitle>
          <Select defaultValue="india">
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="india">India</SelectItem>
              <SelectItem value="usa">USA</SelectItem>
              <SelectItem value="uk">UK</SelectItem>
              <SelectItem value="canada">Canada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Visual Map Placeholder */}
        <div className="mb-6 h-[200px] bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
          <div className="text-center space-y-2">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Interactive map visualization
            </p>
            <p className="text-xs text-muted-foreground">
              Showing distribution across India
            </p>
          </div>
        </div>

        {/* State List with Progress Bars */}
        <div className="space-y-3">
          {stateData.map((state) => (
            <div key={state.name} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{state.name}</span>
                <span className="text-sm text-muted-foreground">
                  {state.leads} leads
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${state.color} transition-all duration-500 group-hover:opacity-80`}
                    style={{ width: `${state.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground min-w-[40px] text-right">
                  {state.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">1,162</p>
            <p className="text-xs text-muted-foreground mt-1">Total Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">28</p>
            <p className="text-xs text-muted-foreground mt-1">States</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">156</p>
            <p className="text-xs text-muted-foreground mt-1">Cities</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Award, Building2 } from 'lucide-react';
export const TrustIndicators = () => {
  const stats = [{
    value: '10K+',
    label: 'Students Funded',
    icon: Award
  }, {
    value: '₹500Cr+',
    label: 'Loans Disbursed',
    icon: Building2
  }, {
    value: '98%',
    label: 'Satisfaction',
    icon: Shield
  }];
  const securityBadges = [{
    icon: Lock,
    text: 'SSL Secured'
  }, {
    icon: Shield,
    text: 'ISO Certified'
  }, {
    icon: Building2,
    text: 'RBI Registered Partners'
  }];
  return <div className="space-y-6 animate-fade-in">
      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
        const Icon = stat.icon;
        return <Card key={index} className={`premium-card text-center stagger-fade-${index % 4 + 1}`}>
              
            </Card>;
      })}
      </div>

      {/* Security Badges */}
      <div className="flex flex-wrap gap-3 justify-center">
        {securityBadges.map((badge, index) => {
        const Icon = badge.icon;
        return <Badge key={index} variant="outline" className="px-4 py-2 gap-2 hover-lift">
              <Icon className="h-4 w-4" />
              {badge.text}
            </Badge>;
      })}
      </div>
    </div>;
};
import { Heart, Sparkles, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PersonalImpactProps {
  studentsHelped: number;
  loansApproved: number;
  totalLoanAmount: number;
  compareToAverage?: number;
}

export const PersonalImpact = ({
  studentsHelped,
  loansApproved,
  totalLoanAmount,
  compareToAverage = 15,
}: PersonalImpactProps) => {
  const dreams = '🎓'.repeat(Math.min(Math.floor(studentsHelped / 10), 10));

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Your Impact This Month
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Impact Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Students Helped</span>
            </div>
            <p className="text-3xl font-bold text-primary">{studentsHelped}</p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Loans Approved</span>
            </div>
            <p className="text-3xl font-bold text-success">{loansApproved}</p>
          </div>
        </div>

        {/* Total Amount */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 via-primary/10 to-purple-500/10 border border-purple-500/20">
          <p className="text-sm text-muted-foreground mb-1">Total Loans Facilitated</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-primary bg-clip-text text-transparent">
            ₹{(totalLoanAmount / 10000000).toFixed(2)}Cr
          </p>
        </div>

        {/* Dreams Visualization */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium">Dreams Unlocked</span>
          </div>
          <p className="text-2xl leading-relaxed mb-2">{dreams || '🎓'}</p>
          <p className="text-xs text-muted-foreground">
            Each 🎓 represents 10 students you've helped
          </p>
        </div>

        {/* Comparison */}
        {compareToAverage !== 0 && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
            <TrendingUp className={`h-4 w-4 ${compareToAverage > 0 ? 'text-success' : 'text-muted-foreground'}`} />
            <p className="text-sm">
              You're{' '}
              <span className={`font-bold ${compareToAverage > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                {Math.abs(compareToAverage)}%
              </span>{' '}
              {compareToAverage > 0 ? 'above' : 'below'} average this month!
            </p>
          </div>
        )}

        {/* Motivational Message */}
        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10">
          <p className="text-sm font-medium text-foreground mb-1">
            "You're making a real difference! 💫"
          </p>
          <p className="text-xs text-muted-foreground">
            Every loan approved changes a life forever
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle } from 'lucide-react';

interface Activity {
  id: number;
  name: string;
  city: string;
  amount: string;
  action: string;
}

const activities: Activity[] = [
  { id: 1, name: 'Rahul', city: 'Mumbai', amount: '₹25L', action: 'got approved' },
  { id: 2, name: 'Priya', city: 'Delhi', amount: '₹30L', action: 'submitted application' },
  { id: 3, name: 'Arjun', city: 'Bangalore', amount: '₹20L', action: 'got approved' },
  { id: 4, name: 'Sneha', city: 'Pune', amount: '₹35L', action: 'got approved' },
  { id: 5, name: 'Rohan', city: 'Chennai', amount: '₹28L', action: 'submitted application' },
];

export const SocialProof = () => {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentActivity((prev) => (prev + 1) % activities.length);
        setIsVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const activity = activities[currentActivity];

  return (
    <div className={`fixed bottom-4 left-4 w-80 z-50 transition-all duration-300 hidden lg:block ${
      isVisible ? 'animate-slide-in-right opacity-100' : 'opacity-0 translate-x-[-20px]'
    }`}>
      <Card className="premium-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                {activity.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {activity.name} from {activity.city}
              </p>
              <p className="text-xs text-muted-foreground">
                Just {activity.action} for {activity.amount}
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

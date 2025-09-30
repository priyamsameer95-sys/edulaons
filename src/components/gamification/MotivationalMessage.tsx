import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

const motivationalMessages = [
  { emoji: '💪', message: "You're crushing it today! Keep the momentum going!" },
  { emoji: '🌟', message: "Your dedication is inspiring. Every lead processed changes a life!" },
  { emoji: '🚀', message: "Sky's the limit! You're making dreams come true!" },
  { emoji: '🎯', message: "Focused and fabulous! Your accuracy is impressive!" },
  { emoji: '⚡', message: "Lightning fast! Your efficiency is off the charts!" },
  { emoji: '🏆', message: "Champion mindset! You're leading by example!" },
  { emoji: '💎', message: "You're a gem! This team is lucky to have you!" },
  { emoji: '🔥', message: "On fire! Nothing can stop you now!" },
  { emoji: '✨', message: "Making magic happen, one approval at a time!" },
  { emoji: '🌈', message: "Bringing hope and opportunity to students everywhere!" },
];

export const MotivationalMessage = () => {
  const [message, setMessage] = useState(motivationalMessages[0]);

  useEffect(() => {
    // Randomly select a message on mount
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    setMessage(randomMessage);

    // Change message every 30 seconds
    const interval = setInterval(() => {
      const newMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      setMessage(newMessage);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 border-primary/20">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
      
      <div className="relative p-4 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary animate-pulse flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            <span className="text-2xl mr-2">{message.emoji}</span>
            {message.message}
          </p>
        </div>
      </div>
    </Card>
  );
};

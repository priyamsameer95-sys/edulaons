import { useState, useEffect } from 'react';

interface GamificationData {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  streak: number;
  unlockedBadges: number;
  totalBadges: number;
  dailyGoals: Array<{
    id: string;
    title: string;
    description: string;
    current: number;
    target: number;
    xpReward: number;
    completed: boolean;
  }>;
  achievements: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

export const useGamification = (kpis: {
  totalLeads: number;
  sanctioned: number;
  totalPartners: number;
}) => {
  const [gamificationData, setGamificationData] = useState<GamificationData>({
    level: 1,
    currentXP: 0,
    xpToNextLevel: 1000,
    streak: 0,
    unlockedBadges: 0,
    totalBadges: 15,
    dailyGoals: [],
    achievements: [],
  });

  useEffect(() => {
    // Calculate level based on total activity
    const totalActivity = kpis.totalLeads + (kpis.sanctioned * 2) + (kpis.totalPartners * 5);
    const level = Math.min(Math.floor(totalActivity / 50) + 1, 20);
    const currentXP = totalActivity % 50;
    const xpToNextLevel = 50 + (level * 10);

    // Calculate streak (simplified - would normally check login history)
    const streak = Math.floor(kpis.totalLeads / 10) || 1;

    // Daily goals based on current activity
    const dailyGoals = [
      {
        id: 'approve-leads',
        title: 'Approve 5 Leads',
        description: 'Review and approve 5 leads today',
        current: kpis.sanctioned % 5,
        target: 5,
        xpReward: 50,
        completed: kpis.sanctioned % 5 === 0 && kpis.sanctioned > 0,
      },
      {
        id: 'review-documents',
        title: 'Review 10 Documents',
        description: 'Check and verify 10 documents',
        current: Math.min(kpis.totalLeads % 10, 10),
        target: 10,
        xpReward: 30,
        completed: kpis.totalLeads % 10 === 0 && kpis.totalLeads > 0,
      },
      {
        id: 'fast-response',
        title: 'Quick Response Time',
        description: 'Respond to all leads within 2 hours',
        current: 3,
        target: 5,
        xpReward: 75,
        completed: false,
      },
    ];

    // Achievements based on milestones
    const achievements = [
      {
        id: 'first-lead',
        icon: '🎯',
        title: 'First Lead',
        description: 'Process your first lead',
        unlocked: kpis.totalLeads >= 1,
        unlockedAt: kpis.totalLeads >= 1 ? new Date().toISOString() : undefined,
        rarity: 'common' as const,
      },
      {
        id: 'century',
        icon: '💯',
        title: 'Century Club',
        description: 'Reach 100 total leads',
        unlocked: kpis.totalLeads >= 100,
        unlockedAt: kpis.totalLeads >= 100 ? new Date().toISOString() : undefined,
        rarity: 'rare' as const,
      },
      {
        id: 'speed-demon',
        icon: '⚡',
        title: 'Speed Demon',
        description: 'Approve 10 leads in a single day',
        unlocked: kpis.sanctioned >= 10,
        unlockedAt: kpis.sanctioned >= 10 ? new Date().toISOString() : undefined,
        rarity: 'rare' as const,
      },
      {
        id: 'growth-master',
        icon: '📈',
        title: 'Growth Master',
        description: 'Onboard 10+ partners',
        unlocked: kpis.totalPartners >= 10,
        unlockedAt: kpis.totalPartners >= 10 ? new Date().toISOString() : undefined,
        rarity: 'epic' as const,
      },
      {
        id: 'accuracy-king',
        icon: '🎯',
        title: 'Accuracy King',
        description: 'Maintain 95% approval rate with 50+ leads',
        unlocked: kpis.totalLeads >= 50 && (kpis.sanctioned / kpis.totalLeads) >= 0.95,
        unlockedAt: kpis.totalLeads >= 50 && (kpis.sanctioned / kpis.totalLeads) >= 0.95 ? new Date().toISOString() : undefined,
        rarity: 'epic' as const,
      },
      {
        id: 'legendary',
        icon: '👑',
        title: 'Legendary Admin',
        description: 'Reach Level 10',
        unlocked: level >= 10,
        unlockedAt: level >= 10 ? new Date().toISOString() : undefined,
        rarity: 'legendary' as const,
      },
      {
        id: 'streak-master',
        icon: '🔥',
        title: 'Streak Master',
        description: 'Maintain a 30-day streak',
        unlocked: streak >= 30,
        unlockedAt: streak >= 30 ? new Date().toISOString() : undefined,
        rarity: 'legendary' as const,
      },
      {
        id: 'team-player',
        icon: '🤝',
        title: 'Team Player',
        description: 'Collaborate with 5+ partners',
        unlocked: kpis.totalPartners >= 5,
        rarity: 'common' as const,
      },
      {
        id: 'document-master',
        icon: '📄',
        title: 'Document Master',
        description: 'Review 500+ documents',
        unlocked: kpis.totalLeads >= 100,
        rarity: 'rare' as const,
      },
      {
        id: 'efficiency-expert',
        icon: '⚙️',
        title: 'Efficiency Expert',
        description: 'Process 20 leads in one session',
        unlocked: false,
        rarity: 'epic' as const,
      },
      {
        id: 'early-bird',
        icon: '🌅',
        title: 'Early Bird',
        description: 'Log in before 8 AM for 7 days straight',
        unlocked: false,
        rarity: 'common' as const,
      },
      {
        id: 'night-owl',
        icon: '🦉',
        title: 'Night Owl',
        description: 'Process leads after 10 PM',
        unlocked: false,
        rarity: 'common' as const,
      },
      {
        id: 'perfect-week',
        icon: '⭐',
        title: 'Perfect Week',
        description: 'Complete all daily goals for 7 days',
        unlocked: false,
        rarity: 'epic' as const,
      },
      {
        id: 'mentor',
        icon: '🎓',
        title: 'Mentor',
        description: 'Help onboard 3 new partners',
        unlocked: kpis.totalPartners >= 3,
        rarity: 'rare' as const,
      },
      {
        id: 'innovator',
        icon: '💡',
        title: 'Innovator',
        description: 'Suggest and implement a process improvement',
        unlocked: false,
        rarity: 'legendary' as const,
      },
    ];

    const unlockedBadges = achievements.filter(a => a.unlocked).length;

    setGamificationData({
      level,
      currentXP,
      xpToNextLevel,
      streak,
      unlockedBadges,
      totalBadges: achievements.length,
      dailyGoals,
      achievements,
    });
  }, [kpis]);

  return gamificationData;
};

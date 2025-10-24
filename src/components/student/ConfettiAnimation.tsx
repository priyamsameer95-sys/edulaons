import { useEffect, useState } from 'react';

interface Confetti {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
}

export const ConfettiAnimation = () => {
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  useEffect(() => {
    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
    ];

    const pieces: Confetti[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setConfetti(pieces);

    // Clean up after animation
    const timer = setTimeout(() => {
      setConfetti([]);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-sm animate-fall"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

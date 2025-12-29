import { useState, useEffect } from 'react';
import { Quote, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Testimonial {
  quote: string;
  name: string;
  meta: string;
  rating: number;
  initials: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoRotateInterval?: number;
  className?: string;
}

export function TestimonialCarousel({
  testimonials,
  autoRotateInterval = 5000,
  className,
}: TestimonialCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, autoRotateInterval);
    
    return () => clearInterval(interval);
  }, [testimonials.length, autoRotateInterval]);

  const currentTestimonial = testimonials[activeIndex];

  if (!currentTestimonial) return null;

  return (
    <div className={cn(
      "bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 relative overflow-hidden",
      className
    )}>
      <Quote className="w-6 h-6 text-white/30 mb-3" />
      
      <div key={activeIndex} className="animate-fade-in">
        <p className="text-white/95 italic leading-relaxed mb-4">
          "{currentTestimonial.quote}"
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
              {currentTestimonial.initials}
            </div>
            <div>
              <div className="font-medium text-sm">{currentTestimonial.name}</div>
              <div className="text-xs text-white/60">{currentTestimonial.meta}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  "w-3.5 h-3.5",
                  i < currentTestimonial.rating 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-white/30'
                )} 
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Carousel Dots */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-4 pt-3 border-t border-white/10">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === activeIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/40 hover:bg-white/60'
              )}
              aria-label={`View testimonial ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

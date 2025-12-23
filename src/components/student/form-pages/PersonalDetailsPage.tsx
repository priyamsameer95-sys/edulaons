import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Calendar, MapPin, Shield, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentApplicationData } from '@/types/student-application';

interface PersonalDetailsPageProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
}

const genderOptions = [
  { value: 'male', label: 'Male', icon: '♂️' },
  { value: 'female', label: 'Female', icon: '♀️' },
  { value: 'other', label: 'Other', icon: '⚧️' },
];

const PersonalDetailsPage = ({ data, onUpdate, onNext }: PersonalDetailsPageProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  // Auto-lookup city/state from PIN
  useEffect(() => {
    const pin = data.postalCode;
    if (pin && pin.length === 6 && !data.city) {
      setPinLoading(true);
      const timer = setTimeout(() => {
        const cityMap: Record<string, { city: string; state: string }> = {
          '110': { city: 'New Delhi', state: 'Delhi' },
          '400': { city: 'Mumbai', state: 'Maharashtra' },
          '560': { city: 'Bangalore', state: 'Karnataka' },
          '600': { city: 'Chennai', state: 'Tamil Nadu' },
          '700': { city: 'Kolkata', state: 'West Bengal' },
          '500': { city: 'Hyderabad', state: 'Telangana' },
          '380': { city: 'Ahmedabad', state: 'Gujarat' },
          '411': { city: 'Pune', state: 'Maharashtra' },
        };
        const match = cityMap[pin.substring(0, 3)];
        if (match) onUpdate({ city: match.city, state: match.state });
        setPinLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [data.postalCode]);

  const formatPhone = (val: string) => {
    const nums = val.replace(/\D/g, '');
    if (nums.length <= 5) return nums;
    return `${nums.slice(0, 5)} ${nums.slice(5, 10)}`;
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name': return !value || value.trim().length < 2 ? 'Please enter your full name' : '';
      case 'phone': return value.replace(/\D/g, '').length !== 10 ? 'Enter valid 10-digit number' : '';
      case 'email': return value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Enter valid email' : '';
      case 'dateOfBirth': {
        if (!value) return 'Date of birth is required';
        const age = Math.floor((Date.now() - new Date(value).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age < 16 || age > 50 ? 'Age must be 16-50' : '';
      }
      case 'postalCode': return !/^\d{6}$/.test(value) ? 'Enter 6-digit PIN' : '';
      default: return '';
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {
      name: validateField('name', data.name || ''),
      phone: validateField('phone', data.phone || ''),
      email: validateField('email', data.email || ''),
      dateOfBirth: validateField('dateOfBirth', data.dateOfBirth || ''),
      postalCode: validateField('postalCode', data.postalCode || ''),
      gender: !data.gender ? 'Select gender' : '',
      city: !data.city?.trim() ? 'City is required' : '',
    };
    setErrors(newErrors);
    setTouched({ name: true, phone: true, email: true, dateOfBirth: true, postalCode: true, gender: true, city: true });
    return !Object.values(newErrors).some(e => e);
  };

  const handleContinue = async () => {
    setIsValidating(true);
    await new Promise(r => setTimeout(r, 200));
    if (validateAll()) onNext();
    setIsValidating(false);
  };

  const isValid = (field: string) => touched[field] && !errors[field];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3"
        >
          <Sparkles className="w-4 h-4" />
          Takes ~2 minutes
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          👋 Let's get started
        </h1>
        <p className="text-muted-foreground text-sm">Your data is encrypted & secure</p>
      </div>

      {/* Form */}
      <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/50 shadow-xl p-5 sm:p-7 space-y-5">
        
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" /> Full Name *
          </label>
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-background/50 transition-all",
              errors.name && touched.name ? "border-destructive/50" : isValid('name') ? "border-green-500/50" : "border-border focus-within:border-primary"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
              data.name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {data.name ? getInitials(data.name) : '👤'}
            </div>
            <input
              ref={nameRef}
              type="text"
              placeholder="Enter your full name"
              value={data.name || ''}
              onChange={e => onUpdate({ name: e.target.value })}
              onBlur={e => handleBlur('name', e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
            />
            <AnimatePresence>
              {isValid('name') && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {errors.name && touched.name && <p className="text-xs text-destructive ml-1">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" /> WhatsApp Number *
          </label>
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl border-2 bg-background/50 transition-all",
              errors.phone && touched.phone ? "border-destructive/50" : isValid('phone') ? "border-green-500/50" : "border-border focus-within:border-primary"
            )}
          >
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-lg text-sm shrink-0">
              <span>🇮🇳</span>
              <span className="text-muted-foreground">+91</span>
            </div>
            <input
              type="tel"
              placeholder="98765 43210"
              value={formatPhone(data.phone || '')}
              onChange={e => onUpdate({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              onBlur={e => handleBlur('phone', e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
            />
            {isValid('phone') && (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground ml-1">You'll get OTP on this number</p>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" /> Email
          </label>
          <div
            className={cn(
              "flex items-center px-4 py-3 rounded-xl border-2 bg-background/50 transition-all",
              errors.email && touched.email ? "border-destructive/50" : isValid('email') ? "border-green-500/50" : "border-border focus-within:border-primary"
            )}
          >
            <input
              type="email"
              placeholder="you@example.com"
              value={data.email || ''}
              onChange={e => onUpdate({ email: e.target.value })}
              onBlur={e => handleBlur('email', e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
            />
            {isValid('email') && (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* DOB & Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" /> Date of Birth *
            </label>
            <div className={cn(
              "px-4 py-3 rounded-xl border-2 bg-background/50",
              errors.dateOfBirth && touched.dateOfBirth ? "border-destructive/50" : isValid('dateOfBirth') ? "border-green-500/50" : "border-border"
            )}>
              <input
                type="date"
                value={data.dateOfBirth || ''}
                onChange={e => onUpdate({ dateOfBirth: e.target.value })}
                onBlur={e => handleBlur('dateOfBirth', e.target.value)}
                max={new Date(Date.now() - 16 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full bg-transparent outline-none text-foreground"
              />
            </div>
            {data.dateOfBirth && !errors.dateOfBirth && (
              <p className="text-xs text-muted-foreground ml-1">
                Age: {Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Gender *</label>
            <div className="flex gap-2">
              {genderOptions.map(g => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => { onUpdate({ gender: g.value }); setErrors(p => ({ ...p, gender: '' })); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-3 rounded-xl border-2 font-medium text-sm transition-all",
                    data.gender === g.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  <span>{g.icon}</span>
                  <span className="hidden sm:inline">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" /> Location *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className={cn(
              "px-4 py-3 rounded-xl border-2 bg-background/50",
              errors.postalCode && touched.postalCode ? "border-destructive/50" : isValid('postalCode') ? "border-green-500/50" : "border-border"
            )}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="PIN"
                maxLength={6}
                value={data.postalCode || ''}
                onChange={e => onUpdate({ postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                onBlur={e => handleBlur('postalCode', e.target.value)}
                className="w-full bg-transparent outline-none text-center text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border bg-muted/20">
              {pinLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : data.city ? (
                <>
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm text-foreground truncate">{data.city}, {data.state}</span>
                </>
              ) : (
                <input
                  type="text"
                  placeholder="City"
                  value={data.city || ''}
                  onChange={e => onUpdate({ city: e.target.value })}
                  className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50 text-sm"
                />
              )}
            </div>
          </div>
        </div>

        {/* Continue */}
        <motion.button
          onClick={handleContinue}
          disabled={isValidating}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full h-14 mt-4 rounded-xl font-semibold text-base bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
        >
          {isValidating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Continue
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
            </>
          )}
        </motion.button>
      </div>

      {/* Trust */}
      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>256-bit encrypted • Your data is never sold</span>
      </div>
    </motion.div>
  );
};

export default PersonalDetailsPage;

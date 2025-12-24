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
      className="w-full max-w-xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium mb-4"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Takes ~2 minutes
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Let's get started
        </h1>
        <p className="text-muted-foreground text-sm">Your data is encrypted & secure</p>
      </div>

      {/* Form */}
      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
        
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" /> Full Name <span className="text-destructive">*</span>
          </label>
          <div
            className={cn(
              "flex items-center gap-3 h-12 px-4 rounded-lg border bg-background transition-colors",
              errors.name && touched.name 
                ? "border-destructive" 
                : isValid('name') 
                ? "border-emerald-500" 
                : "border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            )}
          >
            <input
              ref={nameRef}
              type="text"
              placeholder="Enter your full name"
              value={data.name || ''}
              onChange={e => onUpdate({ name: e.target.value })}
              onBlur={e => handleBlur('name', e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            <AnimatePresence>
              {isValid('name') && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {errors.name && touched.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" /> WhatsApp Number <span className="text-destructive">*</span>
          </label>
          <div
            className={cn(
              "flex items-center gap-2 h-12 px-4 rounded-lg border bg-background transition-colors",
              errors.phone && touched.phone 
                ? "border-destructive" 
                : isValid('phone') 
                ? "border-emerald-500" 
                : "border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            )}
          >
            <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
              <span>🇮🇳</span>
              <span>+91</span>
            </div>
            <div className="w-px h-5 bg-border" />
            <input
              type="tel"
              placeholder="98765 43210"
              value={formatPhone(data.phone || '')}
              onChange={e => onUpdate({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              onBlur={e => handleBlur('phone', e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            {isValid('phone') && (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">You'll receive OTP on this number</p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" /> Email <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div
            className={cn(
              "flex items-center h-12 px-4 rounded-lg border bg-background transition-colors",
              errors.email && touched.email 
                ? "border-destructive" 
                : isValid('email') 
                ? "border-emerald-500" 
                : "border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            )}
          >
            <input
              type="email"
              placeholder="you@example.com"
              value={data.email || ''}
              onChange={e => onUpdate({ email: e.target.value })}
              onBlur={e => handleBlur('email', e.target.value)}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            {isValid('email') && (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* DOB & Gender Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" /> Date of Birth <span className="text-destructive">*</span>
            </label>
            <div className={cn(
              "h-12 px-4 rounded-lg border bg-background flex items-center",
              errors.dateOfBirth && touched.dateOfBirth 
                ? "border-destructive" 
                : isValid('dateOfBirth') 
                ? "border-emerald-500" 
                : "border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
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
              <p className="text-xs text-muted-foreground">
                Age: {Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
              </p>
            )}
            {errors.dateOfBirth && touched.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Gender <span className="text-destructive">*</span></label>
            <div className="flex gap-2">
              {genderOptions.map(g => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => { onUpdate({ gender: g.value }); setErrors(p => ({ ...p, gender: '' })); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-12 rounded-lg border text-sm font-medium transition-all",
                    data.gender === g.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:border-muted-foreground/50 text-foreground"
                  )}
                >
                  <span>{g.icon}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
            {errors.gender && touched.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" /> Location <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div className={cn(
              "h-12 px-4 rounded-lg border bg-background flex items-center",
              errors.postalCode && touched.postalCode 
                ? "border-destructive" 
                : isValid('postalCode') 
                ? "border-emerald-500" 
                : "border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            )}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="PIN"
                maxLength={6}
                value={data.postalCode || ''}
                onChange={e => onUpdate({ postalCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                onBlur={e => handleBlur('postalCode', e.target.value)}
                className="w-full bg-transparent outline-none text-center text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="col-span-2 h-12 flex items-center gap-2 px-4 rounded-lg border border-input bg-muted/50">
              {pinLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : data.city ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-foreground truncate">{data.city}, {data.state}</span>
                </>
              ) : (
                <input
                  type="text"
                  placeholder="City"
                  value={data.city || ''}
                  onChange={e => onUpdate({ city: e.target.value })}
                  className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
                />
              )}
            </div>
          </div>
          {errors.postalCode && touched.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
        </div>

        {/* Continue Button */}
        <motion.button
          onClick={handleContinue}
          disabled={isValidating}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full h-12 mt-2 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Continue
              <motion.span animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>→</motion.span>
            </>
          )}
        </motion.button>
      </div>

      {/* Trust footer */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="w-3.5 h-3.5" />
        <span>256-bit encryption • Your data is never sold</span>
      </div>
    </motion.div>
  );
};

export default PersonalDetailsPage;

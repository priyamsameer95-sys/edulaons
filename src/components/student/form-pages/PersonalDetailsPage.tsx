import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentApplicationData } from '@/types/student-application';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/input';
import { DatePickerWithYearSelect } from '@/components/ui/date-picker-with-year-select';
import { INDIAN_STATES, UNION_TERRITORIES } from '@/constants/indianStates';
import { Label } from '@/components/ui/label';

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
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 100);
  }, []);

  const formatPhone = (val: string) => {
    const nums = val.replace(/\D/g, '');
    if (nums.length <= 5) return nums;
    return `${nums.slice(0, 5)} ${nums.slice(5, 10)}`;
  };

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
      case 'state': return !value ? 'Please select your state' : '';
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
      gender: !data.gender ? 'Select gender' : '',
      state: validateField('state', data.state || ''),
    };
    setErrors(newErrors);
    setTouched({ name: true, phone: true, email: true, dateOfBirth: true, gender: true, state: true });
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
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3 h-3" /> Step 1 of 3
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Personal Details</h1>
        <p className="text-muted-foreground mt-2">Let's get to know you better.</p>
      </div>

      {/* Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl shadow-blue-900/5 p-6 sm:p-8 space-y-6">

        {/* Name */}
        <div className="space-y-1">
          <FloatingLabelInput
            id="name"
            label="Full Name (as per passport)"
            ref={nameRef}
            value={data.name || ''}
            onChange={e => onUpdate({ name: e.target.value })}
            onBlur={e => handleBlur('name', e.target.value)}
            className={cn(
              errors.name && touched.name ? "border-destructive focus-visible:ring-destructive" :
                isValid('name') ? "border-green-500 focus-visible:ring-green-500" : ""
            )}
          />
          {errors.name && touched.name && <p className="text-xs text-destructive pl-1">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          {/* Custom wrapper for Phone to handle +91 prefix while mimicking FloatingLabel style */}
          <div className="relative">
            <div className="absolute left-3 top-4 z-10 flex items-center gap-2 text-muted-foreground border-r pr-2 h-6 pointer-events-none">
              <span className="text-sm font-medium">🇮🇳 +91</span>
            </div>
            <input
              id="phone"
              type="tel"
              value={formatPhone(data.phone || '')}
              onChange={e => onUpdate({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              onBlur={e => handleBlur('phone', e.target.value)}
              placeholder=" "
              className={cn(
                "flex h-14 w-full rounded-md border border-input bg-background pl-24 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-out hover:border-primary/50 peer pt-4 pb-1",
                errors.phone && touched.phone ? "border-destructive focus-visible:ring-destructive" :
                  isValid('phone') ? "border-green-500 focus-visible:ring-green-500" : ""
              )}
            />
            <label
              htmlFor="phone"
              className="absolute left-24 top-1 z-10 origin-[0] -translate-y-0 transform text-xs text-muted-foreground duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary"
            >
              WhatsApp Number
            </label>
          </div>
          {errors.phone && touched.phone && <p className="text-xs text-destructive pl-1">{errors.phone}</p>}
          {!errors.phone && <p className="text-[10px] text-muted-foreground pl-1">OTP will be sent to this number</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <FloatingLabelInput
            id="email"
            type="email"
            label="Email Address (Optional)"
            value={data.email || ''}
            onChange={e => onUpdate({ email: e.target.value })}
            onBlur={e => handleBlur('email', e.target.value)}
            className={cn(
              errors.email && touched.email ? "border-destructive focus-visible:ring-destructive" :
                isValid('email') ? "border-green-500 focus-visible:ring-green-500" : ""
            )}
          />
          {errors.email && touched.email && <p className="text-xs text-destructive pl-1">{errors.email}</p>}
        </div>

        {/* DOB & Gender Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1 flex flex-col pt-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 ml-1">Date of Birth</Label>
            <DatePickerWithYearSelect
              date={data.dateOfBirth ? new Date(data.dateOfBirth) : undefined}
              setDate={(date) => {
                const val = date ? date.toISOString().split('T')[0] : '';
                onUpdate({ dateOfBirth: val });
                handleBlur('dateOfBirth', val);
              }}
              placeholder="Select Date of Birth"
              fromYear={1960}
              toYear={new Date().getFullYear()}
              className="h-14 px-3"
            />
            {errors.dateOfBirth && touched.dateOfBirth && <p className="text-xs text-destructive pl-1">{errors.dateOfBirth}</p>}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <div className="flex gap-2">
                {genderOptions.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => { onUpdate({ gender: g.value }); setErrors(p => ({ ...p, gender: '' })); }}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-1 h-14 rounded-lg border text-xs font-medium transition-all active:scale-95",
                      data.gender === g.value
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/20"
                        : "border-input bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="text-base">{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {errors.gender && touched.gender && <p className="text-xs text-destructive pl-1">{errors.gender}</p>}
          </div>
        </div>

        {/* State */}
        <div className="space-y-1">
          <Select
            value={data.state || ''}
            onValueChange={(value) => {
              onUpdate({ state: value });
              setTouched(prev => ({ ...prev, state: true }));
              setErrors(prev => ({ ...prev, state: '' }));
            }}
          >
            <SelectTrigger
              className={cn(
                "h-14 bg-background pt-4 pb-1 relative",
                errors.state && touched.state ? "border-destructive focus:ring-destructive" :
                  isValid('state') ? "border-green-500 focus:ring-green-500" : ""
              )}
            >
              {data.state ? (
                <span className="text-sm text-foreground">{data.state}</span>
              ) : <span className="text-transparent">.</span>}
              <label className={cn(
                "absolute left-3 top-1 z-10 origin-[0] transform duration-300 pointer-events-none text-muted-foreground",
                data.state ? "text-xs -translate-y-0" : "text-sm translate-y-3"
              )}>
                State / Union Territory
              </label>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectGroup>
                <SelectLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5">States</SelectLabel>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state} className="cursor-pointer">
                    {state}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-xs text-muted-foreground font-semibold px-2 py-1.5 mt-2">Union Territories</SelectLabel>
                {UNION_TERRITORIES.map((ut) => (
                  <SelectItem key={ut} value={ut} className="cursor-pointer">
                    {ut}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.state && touched.state && <p className="text-xs text-destructive pl-1">{errors.state}</p>}
        </div>


        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={isValidating}
          size="lg"
          className="w-full h-14 text-base font-semibold shadow-lg shadow-primary/20"
        >
          {isValidating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>

    </motion.div>
  );
};

export default PersonalDetailsPage;

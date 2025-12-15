import { LoadingButton } from '@/components/ui/loading-button';
import { useState, useRef, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, Copy, CheckCircle, Eye, EyeOff, AlertCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  parseApiError, 
  normalizeEmail, 
  isValidEmail, 
  isEmpty,
  SUCCESS_COPY,
  ERROR_COPY,
  getToastVariant
} from '@/utils/apiErrors';

interface CreatePartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartnerCreated: () => void;
}

interface PartnerForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  partnerCode: string;
}

interface FieldErrors {
  [key: string]: string | null;
}

interface TouchedFields {
  [key: string]: boolean;
}

// Memoized FieldWrapper - moved outside component to prevent recreation
interface FieldWrapperProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
  field: string;
  helperText?: string;
  error: string | null | undefined;
  isTouched: boolean | undefined;
  isValid: boolean;
}

const FieldWrapper = memo(({ 
  children, 
  label, 
  required, 
  field,
  helperText,
  error,
  isTouched,
  isValid,
}: FieldWrapperProps) => {
  const showError = isTouched && error;

  return (
    <div className="space-y-1">
      <Label htmlFor={field} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
        {isValid && <CheckCircle className="h-3.5 w-3.5 text-success" />}
      </Label>
      {children}
      {showError && (
        <p className="text-xs text-destructive flex items-center gap-1" role="alert">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {helperText && !showError && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
});

const CreatePartnerModal = ({ open, onOpenChange, onPartnerCreated }: CreatePartnerModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PartnerForm>({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    partnerCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [createdPartner, setCreatedPartner] = useState<{ 
    code: string; 
    url: string; 
    email: string; 
    password: string; 
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [topLevelError, setTopLevelError] = useState<string | null>(null);
  
  // Prevent double-submit
  const submitRef = useRef(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    setErrors(prev => ({ ...prev, password: null }));
  };

  const generatePartnerCode = () => {
    const code = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    setFormData(prev => ({ ...prev, partnerCode: code }));
    setErrors(prev => ({ ...prev, partnerCode: null }));
  };

  // Field validation
  const validateField = (field: keyof PartnerForm, value: string): string | null => {
    switch (field) {
      case 'name':
        if (isEmpty(value)) return 'This field cannot be empty.';
        if (value.length < 2) return 'Name must be at least 2 characters.';
        if (value.length > 100) return 'Name must be less than 100 characters.';
        return null;
      case 'email':
        if (isEmpty(value)) return 'This field cannot be empty.';
        if (!isValidEmail(value)) return 'Please enter a valid email address.';
        return null;
      case 'password':
        if (isEmpty(value)) return 'This field cannot be empty.';
        if (value.length < 8) return 'Password must be at least 8 characters.';
        return null;
      case 'partnerCode':
        if (isEmpty(value)) return 'This field cannot be empty.';
        if (!/^[a-z0-9]+$/.test(value)) return 'Partner code must contain only lowercase letters and numbers.';
        if (value.length < 3) return 'Partner code must be at least 3 characters.';
        return null;
      case 'phone':
        if (value && !/^\+?[\d\s-]{10,15}$/.test(value.replace(/\s/g, ''))) {
          return 'Please enter a valid phone number.';
        }
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = useCallback((field: keyof PartnerForm, value: string) => {
    let processedValue = value;
    
    // Normalize email
    if (field === 'email') {
      processedValue = value.toLowerCase().trim();
    }
    
    // Force lowercase for partner code
    if (field === 'partnerCode') {
      processedValue = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Batch clear errors - only update if there's something to clear
    setErrors(prev => prev[field] ? { ...prev, [field]: null } : prev);
    setTopLevelError(prev => prev ? null : prev);
  }, []);

  const handleBlur = (field: keyof PartnerForm) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAllFields = (): boolean => {
    const requiredFields: (keyof PartnerForm)[] = ['name', 'email', 'password', 'partnerCode'];
    const newErrors: FieldErrors = {};
    const newTouched: TouchedFields = {};
    let hasErrors = false;

    requiredFields.forEach(field => {
      newTouched[field] = true;
      const error = validateField(field, formData[field]);
      newErrors[field] = error;
      if (error) hasErrors = true;
    });

    // Also validate optional phone if provided
    if (formData.phone) {
      const phoneError = validateField('phone', formData.phone);
      newErrors.phone = phoneError;
      if (phoneError) hasErrors = true;
    }

    setTouched(newTouched);
    setErrors(newErrors);

    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double-submit
    if (submitRef.current || loading) return;
    
    // Clear previous top-level error
    setTopLevelError(null);
    
    // Validate all fields first
    if (!validateAllFields()) {
      return;
    }

    submitRef.current = true;
    setLoading(true);
    
    try {
      // Normalize email before sending
      const normalizedEmail = normalizeEmail(formData.email);
      
      const response = await supabase.functions.invoke('create-partner-with-auth', {
        body: {
          name: formData.name.trim(),
          email: normalizedEmail,
          password: formData.password,
          phone: formData.phone?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          partnerCode: formData.partnerCode,
        }
      });

      const { data, error } = response;
      
      // Handle function invocation errors
      if (error) {
        console.error('[CreatePartner] Function error:', error, 'Data:', data);
        
        // The actual error message is often in the data object for non-2xx responses
        let errorMessage = 'Something went wrong';
        
        if (data && typeof data === 'object' && 'error' in data) {
          errorMessage = (data as { error: string }).error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        const apiError = parseApiError(errorMessage);
        setTopLevelError(apiError.message);
        
        // Set field-specific error if applicable
        if (apiError.field) {
          setErrors(prev => ({ ...prev, [apiError.field!]: apiError.message }));
        }
        
        toast({
          title: 'Failed to Create Partner',
          description: apiError.message,
          variant: getToastVariant(apiError.type),
        });
        return;
      }

      // Handle errors in response data
      if (!data || data.error) {
        const errorMessage = data?.error || 'Failed to create partner';
        console.error('[CreatePartner] API error:', errorMessage);
        const apiError = parseApiError(errorMessage);
        setTopLevelError(apiError.message);
        
        if (apiError.field) {
          setErrors(prev => ({ ...prev, [apiError.field!]: apiError.message }));
        }
        
        toast({
          title: 'Failed to Create Partner',
          description: apiError.message,
          variant: getToastVariant(apiError.type),
        });
        return;
      }

      // Validate response structure
      if (!data.success || !data.partner) {
        console.error('[CreatePartner] Invalid response:', data);
        setTopLevelError(ERROR_COPY.SERVER_ERROR);
        toast({
          title: 'Failed to Create Partner',
          description: ERROR_COPY.SERVER_ERROR,
          variant: 'destructive',
        });
        return;
      }

      // SUCCESS - Only show green success after backend confirms
      const partnerUrl = data.partner.dashboard_url;
      
      setCreatedPartner({
        code: formData.partnerCode,
        url: partnerUrl,
        email: normalizedEmail,
        password: formData.password,
        name: formData.name.trim(),
      });

      toast({
        title: 'Success',
        description: SUCCESS_COPY.PARTNER_CREATED,
      });

      onPartnerCreated();
    } catch (error: unknown) {
      console.error('[CreatePartner] Exception:', error);
      const apiError = parseApiError(error);
      setTopLevelError(apiError.message);
      
      toast({
        title: 'Failed to Create Partner',
        description: apiError.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      submitRef.current = false;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      partnerCode: '',
    });
    setCreatedPartner(null);
    setCopied(false);
    setShowPassword(false);
    setErrors({});
    setTouched({});
    setTopLevelError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };


  // Success view
  if (createdPartner) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Partner Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Partner account created with login credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Dashboard URL:</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input value={createdPartner.url} readOnly className="flex-1" />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => copyToClipboard(createdPartner.url)}
                  className="px-3"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <Alert className="border-success/30 bg-success-light">
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Login Credentials:</p>
                  <div className="grid gap-2">
                    <div>
                      <Label className="text-xs">Email:</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{createdPartner.email}</code>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(createdPartner.email)}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Password:</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                          {showPassword ? createdPartner.password : '••••••••••••'}
                        </code>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-6 px-2"
                        >
                          {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(createdPartner.password)}
                          className="h-6 px-2"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Separator />

            <div className="text-center space-y-2">
              <Badge variant="outline" className="text-sm">
                Partner Code: {createdPartner.code}
              </Badge>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setCreatedPartner(null);
              }}
            >
              Create Another
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Partner
          </DialogTitle>
          <DialogDescription>
            Add a new partner organization with login credentials and dashboard access
          </DialogDescription>
        </DialogHeader>

        {/* Top-level error banner (Red) */}
        {topLevelError && (
          <Alert variant="destructive" className="border-destructive bg-destructive-light">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {topLevelError}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldWrapper 
                label="Organization Name" 
                required 
                field="name"
                error={errors.name}
                isTouched={touched.name}
                isValid={!!touched.name && !errors.name && !!formData.name}
              >
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="e.g., CashKaro Education"
                  disabled={loading}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  className={cn(
                    touched.name && errors.name && 'border-destructive focus-visible:ring-destructive',
                    touched.name && !errors.name && formData.name && 'border-success'
                  )}
                />
              </FieldWrapper>
            </div>

            <FieldWrapper 
              label="Contact Email" 
              required 
              field="email"
              error={errors.email}
              isTouched={touched.email}
              isValid={!!touched.email && !errors.email && !!formData.email}
            >
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="partner@example.com"
                disabled={loading}
                aria-required="true"
                aria-invalid={!!errors.email}
                className={cn(
                  touched.email && errors.email && 'border-destructive focus-visible:ring-destructive',
                  touched.email && !errors.email && formData.email && 'border-success'
                )}
              />
            </FieldWrapper>

            <FieldWrapper 
              label="Login Password" 
              required 
              field="password"
              error={errors.password}
              isTouched={touched.password}
              isValid={!!touched.password && !errors.password && !!formData.password}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Enter secure password"
                    disabled={loading}
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    className={cn(
                      touched.password && errors.password && 'border-destructive focus-visible:ring-destructive',
                      touched.password && !errors.password && formData.password && 'border-success'
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  disabled={loading}
                >
                  Generate
                </Button>
              </div>
            </FieldWrapper>

            <FieldWrapper 
              label="Phone Number" 
              field="phone" 
              helperText="Optional"
              error={errors.phone}
              isTouched={touched.phone}
              isValid={!!touched.phone && !errors.phone && !!formData.phone}
            >
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="+91 98765 43210"
                disabled={loading}
                className={cn(
                  touched.phone && errors.phone && 'border-destructive focus-visible:ring-destructive',
                  touched.phone && !errors.phone && formData.phone && 'border-success'
                )}
              />
            </FieldWrapper>

            <div className="col-span-2">
              <FieldWrapper 
                label="Partner Code" 
                required 
                field="partnerCode"
                helperText={`Dashboard URL: /partner/${formData.partnerCode || 'code'}`}
                error={errors.partnerCode}
                isTouched={touched.partnerCode}
                isValid={!!touched.partnerCode && !errors.partnerCode && !!formData.partnerCode}
              >
                <div className="flex gap-2">
                  <Input
                    id="partnerCode"
                    value={formData.partnerCode}
                    onChange={(e) => handleInputChange('partnerCode', e.target.value)}
                    onBlur={() => handleBlur('partnerCode')}
                    placeholder="e.g., cashkaro"
                    disabled={loading}
                    aria-required="true"
                    aria-invalid={!!errors.partnerCode}
                    className={cn(
                      touched.partnerCode && errors.partnerCode && 'border-destructive focus-visible:ring-destructive',
                      touched.partnerCode && !errors.partnerCode && formData.partnerCode && 'border-success'
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePartnerCode}
                    disabled={!formData.name || loading}
                  >
                    Generate
                  </Button>
                </div>
              </FieldWrapper>
            </div>

            <div className="col-span-2">
              <FieldWrapper 
                label="Address" 
                field="address" 
                helperText="Optional"
                error={errors.address}
                isTouched={touched.address}
                isValid={!!touched.address && !errors.address && !!formData.address}
              >
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Business address"
                  rows={2}
                  disabled={loading}
                />
              </FieldWrapper>
            </div>
          </div>

          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              This will create a partner account with login credentials that can access their dedicated dashboard.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <LoadingButton 
              type="submit" 
              loading={loading} 
              loadingText="Creating Partner..."
              disabled={loading}
            >
              Create Partner with Login
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePartnerModal;

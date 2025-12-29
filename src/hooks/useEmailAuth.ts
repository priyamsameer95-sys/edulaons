import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface EmailAuthFormData {
  email: string;
  password: string;
}

export interface SignUpFormData extends EmailAuthFormData {
  confirmPassword: string;
  name?: string;
  phone?: string;
}

export interface UseEmailAuthOptions {
  onSignInSuccess?: () => void;
  onSignUpSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useEmailAuth(options: UseEmailAuthOptions = {}) {
  const { signIn, signUp, user, appUser, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EmailAuthFormData>({
    email: '',
    password: '',
  });
  const [signUpData, setSignUpData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSignUpInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
        options.onError?.(new Error(error.message));
      } else {
        options.onSignInSuccess?.();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      options.onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, signIn, toast, options]);

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    
    if (signUpData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await signUp(signUpData.email, signUpData.password);
      
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message || "Could not create account",
          variant: "destructive",
        });
        options.onError?.(new Error(error.message));
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to verify your account",
        });
        options.onSignUpSuccess?.();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      options.onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [signUpData, signUp, toast, options]);

  const resetForm = useCallback(() => {
    setFormData({ email: '', password: '' });
    setSignUpData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
    });
  }, []);

  return {
    // Auth state
    user,
    appUser,
    loading,
    isSubmitting,
    
    // Form state
    formData,
    signUpData,
    
    // Handlers
    handleInputChange,
    handleSignUpInputChange,
    handleSignIn,
    handleSignUp,
    resetForm,
    
    // Setters for custom form handling
    setFormData,
    setSignUpData,
  };
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, User, Phone, Shield, ArrowLeft, Camera, Upload, X, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

interface LoginPageProps {
  onBack?: () => void;
}

type Screen = 'login' | 'register' | 'otp';

// ─── Inline Photo Uploader (works on dark backgrounds) ───────────────────────

interface PhotoUploaderProps {
  value: string;
  onChange: (dataUrl: string) => void;
  name: string;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ value, onChange, name }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const isPhoto = value?.startsWith('data:image');
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const processFile = (file: File) => {
    setError('');
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > max) { h = (h * max) / w; w = max; } }
        else { if (h > max) { w = (w * max) / h; h = max; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        onChange(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  // Global paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) { processFile(file); break; }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-gray-300">
        Profile Photo <span className="text-red-400">*</span>
        <span className="text-gray-500 text-xs ml-1">(required)</span>
      </Label>

      <div className="flex items-center gap-4">
        {/* Avatar circle */}
        <div
          className="relative flex-shrink-0 cursor-pointer group"
          style={{ width: 80, height: 80 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div
            className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center transition-all"
            style={{
              background: isPhoto ? 'transparent' : 'rgba(255,255,255,0.08)',
              border: dragging
                ? '2px dashed #facc15'
                : isPhoto
                ? '2px solid rgba(250,204,21,0.6)'
                : '2px dashed rgba(255,255,255,0.25)',
            }}
          >
            {isPhoto ? (
              <img src={value} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Camera className="w-6 h-6 text-gray-400" />
                <span className="text-gray-500 text-[9px] font-medium text-center leading-tight px-1">
                  {initials || 'PHOTO'}
                </span>
              </div>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <Camera className="w-5 h-5 text-white" />
          </div>

          {/* Remove button */}
          {isPhoto && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(''); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#ef4444', border: '2px solid #0f1729' }}
            >
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          )}

          {/* Checkmark when photo added */}
          {isPhoto && (
            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#10b981', border: '2px solid #0f1729' }}>
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full justify-center transition-all"
            style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15', border: '1px solid rgba(250,204,21,0.3)' }}
          >
            <Upload className="w-3.5 h-3.5" />
            {isPhoto ? 'Change Photo' : 'Upload Photo'}
          </button>
          <p className="text-gray-500 text-[10px] text-center">
            Or drag & drop / <kbd className="px-1 py-0.5 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}>Ctrl+V</kbd> to paste
          </p>
          <p className="text-gray-600 text-[10px] text-center">JPG · PNG · WEBP · Max 5MB</p>
        </div>
      </div>

      {isPhoto && (
        <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#10b981' }}>
          <CheckCircle className="w-3.5 h-3.5" /> Photo uploaded successfully
        </p>
      )}
      {error && <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
      />
    </div>
  );
};

// ─── Main LoginPage ───────────────────────────────────────────────────────────

export const LoginPage: React.FC<LoginPageProps> = ({ onBack }) => {
  const [screen, setScreen] = useState<Screen>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'client' as 'client' | 'advocate' | 'paralegal' | 'accountant' | 'reception',
    password: '',
    confirmPassword: '',
    photoDataUrl: '',
  });

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpEmail, setOtpEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authApi.login(loginEmail, loginPassword);
      localStorage.setItem('nlf_token', result.token);
      localStorage.setItem('nanyuki_user', JSON.stringify(result.user));
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Photo is mandatory for all staff (non-client roles) and strongly encouraged for clients
    if (!registerData.photoDataUrl) {
      setError('A profile photo is required to complete registration.');
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.register({
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        role: registerData.role,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword,
        avatar: registerData.photoDataUrl,
      });
      setOtpEmail(result.email);
      setScreen('otp');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authApi.verifyOtp(otpEmail, otpValue);
      localStorage.setItem('nlf_token', result.token);
      localStorage.setItem('nanyuki_user', JSON.stringify(result.user));
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.resendOtp(otpEmail);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1729] via-[#1a2440] to-[#0f1729] p-4">
      <div className="w-full max-w-md">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <CardTitle className="text-white text-xl">
              {screen === 'login' && 'Welcome Back'}
              {screen === 'register' && 'Create Account'}
              {screen === 'otp' && 'Verify Email'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {screen === 'login' && 'Sign in to your account'}
              {screen === 'register' && 'Fill in your details to get started'}
              {screen === 'otp' && 'Enter the 6-digit code sent to your email'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm font-medium" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}

            {/* ── LOGIN ── */}
            {screen === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 font-semibold" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
                <p className="text-center text-sm text-gray-400">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setScreen('register'); setError(''); }} className="text-yellow-400 hover:text-yellow-300 font-medium">
                    Register
                  </button>
                </p>
              </form>
            )}

            {/* ── REGISTER ── */}
            {screen === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">

                {/* Photo — FIRST, prominent */}
                <PhotoUploader
                  value={registerData.photoDataUrl}
                  onChange={dataUrl => setRegisterData({ ...registerData, photoDataUrl: dataUrl })}
                  name={registerData.name}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Full Name <span className="text-red-400">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={registerData.name}
                        onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300">Phone <span className="text-red-400">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="phone"
                        placeholder="+254 700 000 000"
                        value={registerData.phone}
                        onChange={e => setRegisterData({ ...registerData, phone: e.target.value })}
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email <span className="text-red-400">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-300">Role <span className="text-red-400">*</span></Label>
                  <select
                    id="role"
                    value={registerData.role}
                    onChange={e => setRegisterData({ ...registerData, role: e.target.value as any })}
                    className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white"
                    required
                  >
                    <option value="client">Client</option>
                    <option value="advocate">Advocate</option>
                    <option value="paralegal">Paralegal</option>
                    <option value="accountant">Accountant</option>
                    <option value="reception">Reception</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">Password <span className="text-red-400">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={registerData.password}
                        onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                        className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-gray-300">Confirm Password <span className="text-red-400">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={registerData.confirmPassword}
                        onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 font-semibold"
                  disabled={loading || !registerData.photoDataUrl}
                >
                  {loading ? 'Creating Account...' : !registerData.photoDataUrl ? 'Upload Photo to Continue' : 'Create Account'}
                </Button>

                <p className="text-center text-sm text-gray-400">
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setScreen('login'); setError(''); }} className="text-yellow-400 hover:text-yellow-300 font-medium">
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {/* ── OTP ── */}
            {screen === 'otp' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <Shield className="w-12 h-12 mx-auto text-yellow-400" />
                  <p className="text-gray-300 text-sm">Enter the 6-digit code sent to</p>
                  <p className="text-white font-semibold text-sm">{otpEmail}</p>
                </div>

                <div className="flex justify-center space-x-3">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={el => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(index, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(index, e)}
                      className="w-14 h-14 text-center text-2xl font-bold bg-white/5 border-white/20 text-white"
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || loading}
                    className="text-yellow-400 hover:text-yellow-300 disabled:text-gray-500"
                    variant="ghost"
                  >
                    Resend OTP {resendCooldown > 0 && `(${resendCooldown}s)`}
                  </Button>
                  <Button
                    onClick={handleOtpSubmit}
                    disabled={loading}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 font-semibold"
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

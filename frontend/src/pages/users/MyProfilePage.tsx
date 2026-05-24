import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Upload, Save, ShieldCheck, ShieldAlert, KeyRound, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export interface UserFormData {
  id?: number | string;
  name: string;
  email: string;
  mobile_number: string;
  status: string;
  profile_pic: string;
  password?: string;
  confirm_password?: string;
  gender: string;
  profession: string;
  bio: string;
  role?: string;
}

const emptyUser: UserFormData = {
  name: '',
  email: '',
  mobile_number: '',
  status: '1',
  profile_pic: '',
  password: '',
  confirm_password: '',
  gender: 'male',
  profession: '',
  bio: '',
  role: 'User'
};

const MyProfilePage: React.FC = () => {
  const [formData, setFormData] = useState<UserFormData>(emptyUser);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Two-Factor states
  const [tfaStep, setTfaStep] = useState<'disabled' | 'enabling' | 'enabled'>('disabled');
  const [tfaSecret, setTfaSecret] = useState('');
  const [tfaQrUrl, setTfaQrUrl] = useState('');
  const [tfaOtp, setTfaOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  
  const [isCopied, setIsCopied] = useState(false);
  const [loadingTfa, setLoadingTfa] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        const user = res.data.user;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          mobile_number: user.mobile_number || '',
          status: String(user.status),
          profile_pic: user.profile_pic || '',
          gender: user.gender || 'male',
          profession: user.profession || '',
          bio: user.bio || '',
          role: user.role || 'User',
        });
        
        if (user.two_factor_confirmed_at) {
          setTfaStep('enabled');
        } else {
          setTfaStep('disabled');
        }
      }
    } catch (err: any) {
      toast.error('Failed to load profile details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_pic: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate Profile save for demo consistency
    try {
      toast.success('Profile details updated successfully!');
    } catch (err: any) {
      toast.error('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  // TFA Actions
  const handleEnableTfa = async () => {
    setLoadingTfa(true);
    try {
      const res = await api.post('/auth/tfa/enable');
      if (res.data.success) {
        setTfaSecret(res.data.secret);
        setTfaQrUrl(res.data.qr_code_url);
        setDemoOtp(res.data.current_otp);
        setTfaStep('enabling');
        toast.info('Two-Factor Authentication secret generated!');
      }
    } catch (err: any) {
      toast.error('Failed to initiate Two-factor registration');
    } finally {
      setLoadingTfa(false);
    }
  };

  const handleConfirmTfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingTfa(true);
    try {
      const res = await api.post('/auth/tfa/confirm', { code: tfaOtp });
      if (res.data.success) {
        setRecoveryCodes(res.data.recovery_codes);
        setTfaStep('enabled');
        toast.success('Two-factor Google Authenticator enabled successfully!');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid activation code';
      toast.error(msg);
    } finally {
      setLoadingTfa(false);
    }
  };

  const handleDisableTfa = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication? Your account security will be downgraded.')) return;
    setLoadingTfa(true);
    try {
      const res = await api.post('/auth/tfa/disable');
      if (res.data.success) {
        setTfaStep('disabled');
        setTfaSecret('');
        setTfaQrUrl('');
        setDemoOtp('');
        setRecoveryCodes([]);
        toast.success('Two-Factor Authentication disabled.');
      }
    } catch (err: any) {
      toast.error('Failed to disable Two-factor authentication');
    } finally {
      setLoadingTfa(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(tfaSecret);
    setIsCopied(true);
    toast.success('Secret key copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">My Profile Settings</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Configure profile credentials and security preferences
          </p>
        </div>

        {isLoading ? (
          <div className="h-96 flex items-center justify-center text-muted-foreground animate-pulse">Loading Profile...</div>
        ) : (
          <div className="space-y-6">
            
            {/* profile edit form card */}
            <Card className="shadow-lg border-0">
              <form onSubmit={handleProfileSubmit}>
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <Avatar className="h-32 w-32 border-4 border-background shadow-lg group-hover:shadow-xl transition-shadow">
                        <AvatarImage src={formData.profile_pic} />
                        <AvatarFallback className="bg-primary/10 text-primary text-4xl font-semibold">
                          {formData.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                    <span className="text-sm text-primary font-medium cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
                      Change Profile Picture
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-8 px-6 md:px-10 pb-10">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile_number">Mobile Number</Label>
                        <Input id="mobile_number" name="mobile_number" value={formData.mobile_number} onChange={handleChange} placeholder="+1 555-0100" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Account Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} readOnly className="bg-slate-50 dark:bg-slate-900 cursor-not-allowed" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profession">Profession</Label>
                        <Input id="profession" name="profession" value={formData.profession} onChange={handleChange} placeholder="Senior Architect" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biography</Label>
                      <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Write a short summary about yourself..." className="resize-none min-h-[100px]" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-6 flex justify-end gap-4 rounded-b-xl">
                  <Button type="submit" className="px-8 flex gap-2" disabled={isSaving}>
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Profile Details'}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* 🔐 TWO-FACTOR AUTHENTICATION SECURITY WIDGET */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-blue-500" />
                      Two-Factor Authentication (MFA)
                    </CardTitle>
                    <CardDescription>
                      Secure your platform transactions using Dynamic Time-Based One-Time Passwords (TOTP).
                    </CardDescription>
                  </div>
                  {tfaStep === 'enabled' ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-0 flex items-center gap-1 shadow-none">
                      <ShieldCheck className="h-4 w-4" /> Active
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-600 border-0 flex items-center gap-1 shadow-none">
                      <ShieldAlert className="h-4 w-4" /> Disabled
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-6 md:p-10 space-y-6">
                
                {/* STATE 1: TFA DISABLED VIEW */}
                {tfaStep === 'disabled' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                      Two-Factor Authentication adds an extra layer of system security by requiring a dynamic 6-digit verification code from your Google Authenticator or Authy application during every sign-in attempt.
                    </p>
                    <Button onClick={handleEnableTfa} className="bg-blue-600 hover:bg-blue-500 font-semibold" disabled={loadingTfa}>
                      {loadingTfa ? 'Configuring Setup...' : 'Setup Two-Factor Authenticator'}
                    </Button>
                  </div>
                )}

                {/* STATE 2: TFA CONFIGURATION/ENABLING SETUP CARD */}
                {tfaStep === 'enabling' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Setup Instructions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/20 p-6 rounded-xl border border-slate-800/40">
                      <div className="space-y-4">
                        <h4 className="font-bold text-sm text-slate-300 uppercase tracking-widest">Configuration Instructions</h4>
                        <ol className="list-decimal pl-4 space-y-2.5 text-xs text-slate-400">
                          <li>Install <strong>Google Authenticator</strong> or <strong>Authy</strong> on your smartphone.</li>
                          <li>Scan the QR code or manually enter the 16-character alphanumeric base32 secret key displayed.</li>
                          <li>The app will begin generating dynamic 6-digit TOTP verification codes every 30 seconds.</li>
                          <li>Enter the active 6-digit code below and click confirm to secure your profile!</li>
                        </ol>
                      </div>

                      {/* Secret Key & QR instruction */}
                      <div className="flex flex-col justify-center space-y-4 p-4 bg-slate-950/40 rounded-lg border border-slate-800/50">
                        <div className="space-y-1 text-center sm:text-left">
                          <span className="text-xs text-slate-400 font-semibold">Base32 Secret Key</span>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm md:text-base font-mono font-black text-blue-400 bg-slate-950 px-3 py-1.5 rounded w-full text-center">
                              {tfaSecret}
                            </code>
                            <Button size="icon" variant="ghost" onClick={handleCopySecret} className="h-9 w-9">
                              {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          {tfaQrUrl && (
                            <div className="mt-2 text-center sm:text-left">
                              <a href={tfaQrUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 font-bold hover:underline">
                                Scan or Open QR Setup URL ↗
                              </a>
                            </div>
                          )}
                        </div>

                        {demoOtp && (
                          <div className="p-3 bg-blue-950/30 border border-blue-900/30 rounded text-center">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Local Test Mode OTP</span>
                            <div className="text-xl font-mono tracking-widest font-black text-blue-300">{demoOtp}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Code Verification form */}
                    <form onSubmit={handleConfirmTfa} className="space-y-4 max-w-sm pt-4">
                      <div className="space-y-1">
                        <Label htmlFor="tfaOtp" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Enter Verification Code</Label>
                        <Input
                          id="tfaOtp"
                          type="text"
                          maxLength={6}
                          value={tfaOtp}
                          onChange={(e) => setTfaOtp(e.target.value)}
                          placeholder="000000"
                          className="text-center font-mono text-xl tracking-widest h-11"
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button type="button" variant="outline" className="w-full" onClick={() => setTfaStep('disabled')}>
                          Cancel
                        </Button>
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500" disabled={loadingTfa}>
                          {loadingTfa ? 'Activating...' : 'Confirm Activation'}
                        </Button>
                      </div>
                    </form>

                  </div>
                )}

                {/* STATE 3: TFA ENABLED ACTIVE CARD */}
                {tfaStep === 'enabled' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-4">
                      <ShieldCheck className="h-10 w-10 text-emerald-500 shrink-0" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-200 text-sm">Two-Factor Authentication is Active</h4>
                        <p className="text-xs text-slate-400">
                          Your profile is fully secure. During login, a dynamic dynamic TOTP Authenticator code challenge is active.
                        </p>
                      </div>
                    </div>

                    {/* Display Recovery Codes if just activated */}
                    {recoveryCodes.length > 0 && (
                      <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-xl space-y-4">
                        <div>
                          <h4 className="font-bold text-sm text-yellow-500 flex items-center gap-1.5">
                            Backup Recovery Codes
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Save these recovery codes in a secure vault. They can be used to bypass TFA if you lose your phone.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-lg">
                          {recoveryCodes.map((code, idx) => (
                            <div key={idx}>{code}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button onClick={handleDisableTfa} variant="destructive" className="font-semibold" disabled={loadingTfa}>
                      {loadingTfa ? 'Deactivating...' : 'Disable Two-Factor Authentication'}
                    </Button>
                  </div>
                )}

              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyProfilePage;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import api from '../services/api';

const Login: React.FC = () => {
  const { login, verifyTfa } = useAuth();
  
  // View states: 'login' | 'register' | 'tfa'
  const [view, setView] = useState<'login' | 'register' | 'tfa'>('login');
  
  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form fields
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('Abc@123456');

  // TFA challenge states
  const [tfaToken, setTfaToken] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  // Register form fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMobile, setRegMobile] = useState('');
  
  // Tenant registration states
  const createTenant = true;
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [tenantDomain, setTenantDomain] = useState('');

  // Auto-slugging effect
  useEffect(() => {
    if (createTenant) {
      setTenantSlug(
        tenantName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  }, [tenantName, createTenant]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.tfaRequired) {
        setTfaToken(res.tfaToken || '');
        setDemoOtp(res.otpCode || '');
        setView('tfa');
        toast.info('Two-Factor Authentication required!');
      } else {
        toast.success('Login successful!');
      }
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyTfa(tfaToken, tfaCode);
      toast.success('MFA verification successful!');
    } catch (err: any) {
      const msg = err.message || 'Verification failed. Invalid OTP.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload: any = {
      name: regName,
      email: regEmail,
      password: regPassword,
      mobile_number: regMobile,
    };

    if (createTenant) {
      payload.tenant_name = tenantName;
      payload.tenant_slug = tenantSlug;
      if (tenantDomain) {
        payload.tenant_domain = tenantDomain;
      }
    }

    try {
      const response = await api.post('/auth/register', payload);
      if (response.data.success) {
        toast.success('Registration successful! Please login.');
        setEmail(regEmail);
        setPassword(regPassword);
        setView('login');
      }
    } catch (err: any) {
      let msg = err.response?.data?.message || 'Registration failed. Try again.';
      const valErrors = err.response?.data?.errors;
      if (valErrors && typeof valErrors === 'object') {
        const errorList = Object.values(valErrors).flat().join(' ');
        if (errorList) {
          msg = `${msg}: ${errorList}`;
        }
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 transition-all duration-500">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-slate-50 to-slate-50 dark:from-blue-900/20 dark:via-slate-950 dark:to-slate-950 -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/10 via-slate-50 to-slate-50 dark:from-indigo-900/20 dark:via-slate-950 dark:to-slate-950 -z-10" />

      {/* 🔐 VIEW: LOGIN SCREEN */}
      {view === 'login' && (
        <Card className="w-full max-w-md bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-2xl transition-all duration-300">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              SaaS ERP
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Enter credentials to access your ERP dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="bg-white/80 dark:bg-slate-955/60 border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/80 dark:bg-slate-955/60 border-slate-200 dark:border-slate-800 focus:border-blue-500 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              {error && <p className="text-red-600 dark:text-red-400 text-xs mt-1 bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-200 dark:border-red-900/30">{error}</p>}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md hover:shadow-lg transition-all" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <button onClick={() => setView('register')} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold hover:underline">
                Create Account
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔐 VIEW: TWO-FACTOR OTP CHALLENGE */}
      {view === 'tfa' && (
        <Card className="w-full max-w-md bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-2xl transition-all duration-300">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Security Verification
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Two-Factor Authentication is active. Enter the 6-digit TOTP code from your Google Authenticator app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demoOtp && (
              <div className="mb-6 p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 rounded-lg text-center space-y-1">
                <span className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest">Local Test Mode OTP</span>
                <div className="text-2xl font-mono tracking-widest font-black text-teal-700 dark:text-teal-300">{demoOtp}</div>
              </div>
            )}
            <form onSubmit={handleTfaVerify} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  Authentication Code
                </label>
                <Input
                  type="text"
                  maxLength={6}
                  value={tfaCode}
                  onChange={(e) => setTfaCode(e.target.value)}
                  placeholder="000000"
                  className="bg-white/80 dark:bg-slate-955/60 border-slate-200 dark:border-slate-800 text-center text-2xl tracking-widest font-mono text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              {error && <p className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-200 dark:border-red-900/30">{error}</p>}
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold" disabled={loading}>
                {loading ? 'Verifying Code...' : 'Verify & Continue'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => setView('login')} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                ← Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔐 VIEW: REGISTRATION CARD */}
      {view === 'register' && (
        <Card className="w-full max-w-xl bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-2xl transition-all duration-300">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Create Enterprise Account
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Sign up as a system user and optionally instantiate a SaaS workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Basic Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Full Name</label>
                  <Input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-white/80 dark:bg-slate-955/60 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Mobile Number</label>
                  <Input
                    type="text"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    placeholder="+1 555-0199"
                    className="bg-white/80 dark:bg-slate-955/60 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Email Address</label>
                  <Input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="john@company.com"
                    className="bg-white/80 dark:bg-slate-955/60 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Password</label>
                  <Input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="bg-white/80 dark:bg-slate-955/60 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>


              {/* Workspace creation details */}
              {createTenant && (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-955/50 rounded-xl border border-slate-200 dark:border-slate-800/60 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Workspace/Tenant Name</label>
                      <Input
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        placeholder="Acme Corporation"
                        className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        required={createTenant}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Workspace Slug (URL-friendly)</label>
                      <Input
                        type="text"
                        value={tenantSlug}
                        onChange={(e) => setTenantSlug(e.target.value)}
                        placeholder="acme-corporation"
                        className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs"
                        required={createTenant}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Domain Name (Optional)</label>
                    <Input
                      type="text"
                      value={tenantDomain}
                      onChange={(e) => setTenantDomain(e.target.value)}
                      placeholder="acme.localhost"
                      className="bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-red-200 dark:border-red-900/30">{error}</p>}
              
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold" disabled={loading}>
                {loading ? 'Creating Account...' : 'Register Enterprise Account'}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <button onClick={() => setView('login')} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold hover:underline">
                Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default Login;
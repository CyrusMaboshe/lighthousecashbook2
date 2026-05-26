
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDeviceInfo } from '@/hooks/use-mobile';
import { DollarSign, Eye, EyeOff, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const { isMobile } = useDeviceInfo();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const success = await login(email.trim(), password);
      if (success) {
        onLoginSuccess?.();
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mobile-first design
  if (isMobile) {
    return (
      <div className="mobile-app-container">
        {/* Mobile Header */}
        <div className="mobile-header">
          <div className="text-center">
            <div className="mobile-logo-icon mx-auto mb-4">
              <DollarSign className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Lighthouse Media</h1>
            <p className="text-slate-600 text-sm mt-1">Financial Management System</p>
          </div>
        </div>

        {/* Mobile Login Form */}
        <div className="mobile-content">
          <form onSubmit={handleLogin} className="mobile-form mobile-fade-in">
            {/* Email Input */}
            <div className="mobile-form-group">
              <label className="mobile-form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="mobile-form-input"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="mobile-form-group">
              <label className="mobile-form-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mobile-form-input pr-12"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 p-2"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mobile-btn mobile-btn-primary w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="mobile-spinner w-5 h-5"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Desktop design
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md bg-white shadow-xl border border-slate-200">
        <CardHeader className="text-center pb-6 px-6 pt-8">
          {/* Clean Professional Logo */}
          <div className="mx-auto mb-6 md:mb-4">
            <div className="w-20 h-20 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg mobile-icon-wrapper">
              <DollarSign className="w-10 h-10 md:w-8 md:h-8 text-white" />
            </div>
          </div>

          <CardTitle className="text-3xl md:text-2xl font-bold text-slate-800 mobile-header-title">
            Lighthouse Cash Book
          </CardTitle>
          <p className="text-slate-600 mt-2 text-sm font-medium">Financial Management System</p>
          <p className="text-slate-600 mt-4 md:mt-2 text-lg md:text-base font-semibold mobile-header-subtitle animate-scale-in animation-delay-150">
            Sign in to your account
          </p>
          <p className="text-slate-500 mt-3 md:mt-2 font-bold italic text-base md:text-sm animate-scale-in animation-delay-300">
            Lighthouse media the future is here
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Clean Email Input */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-base md:text-sm font-semibold text-slate-700 mobile-balance-label">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-14 md:h-11 mobile-input bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-base font-medium transition-all duration-200"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            {/* Clean Password Input with Show/Hide */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-base md:text-sm font-semibold text-slate-700 mobile-balance-label">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-14 md:h-11 mobile-input bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-base font-medium transition-all duration-200 pr-12"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors duration-200 p-1"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Clean Professional Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 md:h-12 mobile-button bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg md:text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-xs text-slate-500">
              Legacy login form - Use main Lighthouse Media Cashbook login for all users
            </p>
          </div>


        </CardContent>
      </Card>
    </div>
  );
}

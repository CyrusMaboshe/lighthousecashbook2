import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { useToast } from '@/hooks/use-toast';
import { PiggyBank, Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';
import { TransactionLoadingScreen } from '@/components/loading/TransactionLoadingScreen';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import './glass-ui/GlassTheme.css';

// No props needed - auth state is detected automatically via hooks in parent

export function UnifiedLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccessState, setLoginSuccessState] = useState(false);

  // Authentication hooks
  const { login: existingLogin } = useAuth();
  const { signIn: companySignIn } = useMultiTenantAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const handleUnifiedLogin = async (e: React.FormEvent) => {
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
      console.log('🔄 Unified login attempt:', { email: email.trim() });

      // Clear any existing sessions first
      localStorage.removeItem('mt_user_session');
      localStorage.removeItem('mt_session_expiry');
      sessionStorage.removeItem('mt_user_session');
      localStorage.removeItem('lighthouse-current-user');
      localStorage.removeItem('lighthouse-session-expiry');

      // Try existing system first
      const existingSuccess = await existingLogin(email.trim(), password);

      if (existingSuccess) {
        toast({
          title: "Login Successful",
          description: "Successfully logged into your account.",
        });
        setLoginSuccessState(true);
        // Auth state change will be detected automatically by parent via hooks
        return;
      }

      // Try company/multi-tenant login
      const companySuccess = await companySignIn(email.trim(), password);

      if (companySuccess) {
        toast({
          title: "Login Successful",
          description: "Successfully logged into your company account.",
        });
        setLoginSuccessState(true);
        // Auth state change will be detected automatically by parent via hooks
        return;
      }

      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });

      setPassword('');
    } catch (error) {
      console.error('Unified login error:', error);
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loginSuccessState) {
    return <TransactionLoadingScreen message="Establishing Secure Connection..." />;
  }

  return (
    <div className={cn(
      "min-h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-blue-500/30",
      isLight ? "bg-[#F8FAFC]" : "bg-[#050505]"
    )}>
      {/* Dynamic Background Elements */}
      <div className={cn("absolute inset-0 transition-colors duration-500", isLight ? "bg-[#F8FAFC]" : "bg-[#050505]")} />
      <div className={cn(
        "absolute top-[-10%] right-[-5%] w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] rounded-full blur-[120px] sm:blur-[160px] pointer-events-none mix-blend-screen animate-pulse",
        isLight ? "bg-blue-600/10" : "bg-blue-600/10"
      )} />
      <div className={cn(
        "absolute bottom-[-10%] left-[-5%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full blur-[100px] sm:blur-[140px] pointer-events-none mix-blend-screen animate-pulse",
        isLight ? "bg-emerald-600/10" : "bg-emerald-600/10"
      )} style={{ animationDelay: '2s' }} />

      {/* Floating glass particles - hidden on very small screens for better performance */}
      <div className={cn("hidden sm:block absolute top-[20%] left-[15%] w-32 h-32 rounded-full blur-2xl animate-bounce", isLight ? "bg-slate-400/5" : "bg-white/5")} style={{ animationDuration: '8s' }} />
      <div className={cn("hidden sm:block absolute bottom-[25%] right-[20%] w-48 h-48 rounded-full blur-3xl animate-bounce", isLight ? "bg-slate-400/5" : "bg-white/5")} style={{ animationDuration: '10s', animationDelay: '1s' }} />

      {/* Main Container */}
      <div className="w-full max-w-[440px] px-4 sm:px-6 py-8 relative z-10 flex flex-col justify-center min-h-[100dvh] sm:min-h-0">

        {/* Header Section */}
        <div className="flex flex-col items-center mb-8 sm:mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="relative group">
            <div className={cn("absolute inset-0 rounded-[28px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500", isLight ? "bg-blue-600" : "bg-blue-500")} />
            <div className={cn(
              "w-20 h-20 sm:w-24 sm:h-24 rounded-[28px] sm:rounded-[32px] flex items-center justify-center mb-5 sm:mb-6 shadow-2xl border backdrop-blur-xl relative z-10 transform sm:group-hover:scale-105 transition-all duration-500",
              isLight ? "bg-white border-slate-200" : "bg-gradient-to-br from-slate-800/90 to-slate-900/95 border-white/10"
            )}>
              <PiggyBank className={cn("w-10 h-10 sm:w-12 sm:h-12 drop-shadow-lg", isLight ? "text-blue-600" : "text-blue-400")} />
            </div>
          </div>
          <h1 className={cn(
            "text-3xl sm:text-4xl font-black tracking-tighter mb-2",
            isLight ? "text-slate-900" : "text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
          )}>
            Smart Savings
          </h1>
          <div className="flex items-center gap-3">
            <div className={cn("h-px w-6 sm:w-8", isLight ? "bg-slate-300" : "bg-gradient-to-r from-transparent to-slate-600")} />
            <p className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]", isLight ? "text-slate-400" : "text-slate-500")}>Financial Intelligence Platform</p>
            <div className={cn("h-px w-6 sm:w-8", isLight ? "bg-slate-300" : "bg-gradient-to-l from-transparent to-slate-600")} />
          </div>
        </div>

        {/* Login Card */}
        <div className={cn(
          "relative overflow-hidden group rounded-[28px] sm:rounded-[32px] shadow-2xl border transition-all duration-500",
          isLight ? "bg-white border-slate-200" : "glass-card border-white/10 bg-white/[0.02]"
        )}>
          {/* Inner border glow */}
          <div className={cn("absolute inset-x-0 top-0 h-[1px]", isLight ? "bg-slate-100" : "bg-gradient-to-r from-transparent via-white/20 to-transparent")} />

          <div className="p-6 sm:p-8 relative z-10">
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
              <h2 className={cn("text-xl sm:text-2xl font-bold mb-1.5 tracking-tight", isLight ? "text-slate-900" : "text-white")}>Welcome back</h2>
              <p className={cn("text-sm sm:text-[15px]", isLight ? "text-slate-500" : "text-slate-400")}>Enter your credentials to access your vault</p>
            </div>

            <form onSubmit={handleUnifiedLogin} className="space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <label className={cn("text-[10px] font-bold ml-1.5 uppercase tracking-widest flex items-center gap-2", isLight ? "text-slate-600" : "text-slate-400")}>
                  <Mail className={cn("w-3.5 h-3.5", isLight ? "text-blue-600" : "text-blue-400")} />
                  Email Identity
                </label>
                <div className="relative group/input">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="id@lighthouse.com"
                    autoComplete="email"
                    className={cn(
                      "w-full rounded-[20px] py-3.5 sm:py-4 px-4 sm:px-5 text-[15px] sm:text-base border transition-all duration-300 backdrop-blur-md focus:outline-none focus:ring-2",
                      isLight 
                        ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/20 focus:border-blue-500/40" 
                        : "bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600 focus:ring-blue-500/40 focus:border-blue-500/40 hover:bg-white/[0.06]"
                    )}
                    required
                  />
                  <div className={cn("absolute inset-0 rounded-[20px] opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity duration-300", isLight ? "bg-blue-600/5" : "bg-blue-500/5")} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={cn("text-[10px] font-bold ml-1.5 uppercase tracking-widest flex items-center gap-2", isLight ? "text-slate-600" : "text-slate-400")}>
                  <Lock className={cn("w-3.5 h-3.5", isLight ? "text-emerald-600" : "text-emerald-400")} />
                  Security Key
                </label>
                <div className="relative group/input">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn(
                      "w-full rounded-[20px] py-3.5 sm:py-4 px-4 sm:px-5 text-[15px] sm:text-base border transition-all duration-300 backdrop-blur-md focus:outline-none focus:ring-2",
                      isLight 
                        ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-emerald-500/20 focus:border-emerald-500/40" 
                        : "bg-white/[0.04] border-white/10 text-white placeholder:text-slate-600 focus:ring-emerald-500/40 focus:border-emerald-500/40 hover:bg-white/[0.06]"
                    )}
                    required
                  />
                  <div className={cn("absolute inset-0 rounded-[20px] opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity duration-300", isLight ? "bg-emerald-600/5" : "bg-emerald-500/5")} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group mt-6 sm:mt-8 h-12 sm:h-14 overflow-hidden rounded-[20px] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98]" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent transition-opacity duration-300" />

                <div className="relative z-10 flex items-center justify-center gap-2.5 text-white font-bold tracking-tight text-[15px] sm:text-base">
                  {loading ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-[2.5px] border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Authorize Session</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Status Footer */}
            <div className={cn("mt-8 pt-6 border-t flex items-center justify-between", isLight ? "border-slate-100" : "border-white/5")}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className={cn("text-[9px] sm:text-[10px] font-bold uppercase tracking-widest", isLight ? "text-slate-500" : "text-slate-400")}>System Online</span>
              </div>
              <p className={cn("text-[9px] sm:text-[10px] font-bold uppercase tracking-tight", isLight ? "text-slate-400" : "text-slate-500")}>V2.4.0 • STABLE</p>
            </div>
          </div>
        </div>

        {/* Global Footer */}
        <div className="mt-8 sm:mt-10 text-center animate-in fade-in duration-1000 delay-500 pb-4">
          <p className={cn("text-[8px] sm:text-[9px] uppercase tracking-[0.3em] sm:tracking-[0.4em] font-bold mb-1.5", isLight ? "text-slate-400" : "text-slate-600")}>
            Official Financial Intelligence System
          </p>
          <p className={cn("text-[9px] sm:text-[10px] font-semibold", isLight ? "text-slate-400" : "text-slate-500/80")}>
            &copy; {new Date().getFullYear()} Smart Finance Platform
          </p>
        </div>
      </div>
    </div>
  );
}

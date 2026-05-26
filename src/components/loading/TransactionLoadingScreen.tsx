import React from 'react';
import { AnimatedProfilePicture } from '@/components/profile/AnimatedProfilePicture';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface TransactionLoadingScreenProps {
  message?: string;
}

export function TransactionLoadingScreen({
  message = "Loading transactions..."
}: TransactionLoadingScreenProps) {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center relative overflow-hidden font-sans",
      isLight ? "bg-[#F8FAFC]" : "bg-[#050505]"
    )}>
      {/* Background Effects */}
      <div className={cn(
        "absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-700",
        isLight ? "bg-blue-600/10 opacity-60" : "bg-blue-600/10"
      )} />
      <div className={cn(
        "absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-opacity duration-700",
        isLight ? "bg-indigo-600/10 opacity-60" : "bg-indigo-600/10"
      )} />

      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className={cn(
          "backdrop-blur-2xl border rounded-[40px] p-10 shadow-2xl flex flex-col items-center",
          isLight ? "bg-white border-slate-200" : "bg-white/[0.03] border-white/10"
        )}>
          {/* Animated Profile Picture Area */}
          <div className="relative mb-8">
            <div className={cn("absolute inset-0 blur-3xl rounded-full transition-opacity duration-700", isLight ? "bg-blue-600/10" : "bg-blue-500/20")} />
            <div className={cn(
              "relative z-10 p-1.5 bg-gradient-to-br rounded-full border transition-all duration-700",
              isLight ? "from-white to-slate-100 border-slate-200 shadow-lg shadow-slate-200" : "from-white/10 to-transparent border-white/20"
            )}>
              <AnimatedProfilePicture
                src={currentUser?.profile_picture_url}
                size="xl"
                isLoading={true}
                showZappingEffect={true}
              />
            </div>

            {/* Spinning decorative rings */}
            <div className={cn("absolute -inset-4 border rounded-full animate-[spin_8s_linear_infinite]", isLight ? "border-slate-200" : "border-white/5")} />
            <div className={cn("absolute -inset-8 border rounded-full animate-[spin_12s_linear_infinite_reverse]", isLight ? "border-slate-100" : "border-white/[0.02]")} />
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-3 mb-10">
            <div className="flex flex-col gap-1">
              <span className={cn("text-[10px] uppercase tracking-[0.4em] font-black", isLight ? "text-blue-600" : "text-blue-400")}>Authorized Access</span>
              <h2 className={cn("text-3xl font-black tracking-tight", isLight ? "text-slate-900" : "text-white")}>
                Welcome, {currentUser?.username || 'Admin'}
              </h2>
              <div className="flex flex-col items-center mt-1">
                <span className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>{currentUser?.email}</span>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider mt-1 transition-colors duration-700",
                  isLight ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                )}>
                  {currentUser?.role === 'admin' ? 'System Administrator' : 'Authorized User'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className={cn("text-sm font-medium italic transition-colors duration-700", isLight ? "text-slate-600" : "text-slate-400")}>
                {message}
              </p>
            </div>
          </div>

          {/* Premium Progress Bar */}
          <div className={cn("w-full h-1.5 rounded-full overflow-hidden border relative", isLight ? "bg-slate-100 border-slate-200" : "bg-white/[0.05] border-white/5")}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}>
              <div className="absolute inset-0 bg-white/20 blur-sm" />
            </div>
          </div>

          <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-6", isLight ? "text-slate-400" : "text-slate-600")}>
            Synchronizing Secure Vault...
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <div className={cn("h-px w-4", isLight ? "bg-slate-200" : "bg-slate-800")} />
          <p className={cn("text-[9px] font-black uppercase tracking-[0.3em]", isLight ? "text-slate-400" : "text-slate-700")}>Lighthouse Financial Intelligence</p>
          <div className={cn("h-px w-4", isLight ? "bg-slate-200" : "bg-slate-800")} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes loading {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(400%); width: 30%; }
        }
      `}} />
    </div >
  );
}

// Logout Loading Screen
export function LogoutLoadingScreen() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center relative overflow-hidden font-sans",
      isLight ? "bg-[#F8FAFC]" : "bg-[#050505]"
    )}>
      {/* Background Effects */}
      <div className={cn(
        "absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-700",
        isLight ? "bg-rose-500/10 opacity-60" : "bg-rose-600/10"
      )} />
      <div className={cn(
        "absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-opacity duration-700",
        isLight ? "bg-orange-500/10 opacity-60" : "bg-orange-600/10"
      )} />

      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className={cn(
          "backdrop-blur-2xl border rounded-[40px] p-10 shadow-2xl flex flex-col items-center",
          isLight ? "bg-white border-slate-200" : "bg-white/[0.03] border-white/10"
        )}>
          {/* Animated Profile Picture Area */}
          <div className="relative mb-8">
            <div className={cn("absolute inset-0 blur-3xl rounded-full transition-opacity duration-700", isLight ? "bg-rose-600/10" : "bg-rose-500/20")} />
            <div className={cn(
              "relative z-10 p-1.5 bg-gradient-to-br rounded-full border transition-all duration-700",
              isLight ? "from-white to-slate-100 border-slate-200 shadow-lg shadow-slate-200" : "from-white/10 to-transparent border-white/20"
            )}>
              <AnimatedProfilePicture
                src={currentUser?.profile_picture_url}
                size="xl"
                isLoading={true}
                showZappingEffect={true}
              />
            </div>
          </div>

          {/* Logout Message */}
          <div className="text-center space-y-3 mb-10">
            <div className="flex flex-col gap-1">
              <span className={cn("text-[10px] uppercase tracking-[0.4em] font-black", isLight ? "text-rose-600" : "text-rose-400")}>Terminating Session</span>
              <h2 className={cn("text-3xl font-black tracking-tight", isLight ? "text-slate-900" : "text-white")}>
                Goodbye, {currentUser?.username || 'User'}
              </h2>
            </div>
            <p className={cn("text-sm font-medium italic transition-colors duration-700", isLight ? "text-slate-500" : "text-slate-400")}>
              Logging you out safely...
            </p>
          </div>

          {/* Logout Effect */}
          <div className={cn(
            "w-full py-4 px-6 rounded-2xl border text-center relative overflow-hidden group",
            isLight ? "bg-rose-50 border-rose-100" : "bg-rose-500/5 border-rose-500/10"
          )}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className={cn("text-sm font-black tracking-[0.2em] relative z-10", isLight ? "text-rose-600" : "text-rose-500")}>
              ⚡ SESSION TERMINATED ⚡
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

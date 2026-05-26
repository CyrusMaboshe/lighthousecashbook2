
import React, { Component } from 'react';
import { CardContent } from '@/components/ui/card';
import { Settings, AlertTriangle, ShieldCheck, Activity, Calendar, Eye, Database, UserPlus, Lock, Zap, Layout, ArrowRightCircle, Shield, Cpu, Binary, Fingerprint, Receipt, Globe, Key } from 'lucide-react';
import { MonthYearSelector } from '@/components/admin/MonthYearSelector';
import { BalanceVisibilityControl } from '@/components/admin/BalanceVisibilityControl';
import { SettingsStatusDisplay } from '@/components/admin/SettingsStatusDisplay';
import { SystemBalanceOverrides } from '@/components/admin/SystemBalanceOverrides';
import { TestUserCreator } from '@/components/TestUserCreator';
import { UniversalPasswordChange } from '@/components/auth/UniversalPasswordChange';
import { useAuth } from '@/hooks/useAuth';
import { AppleControlList, AppleControlItem } from './glass-ui/AppleControlList';
import { cn } from '@/lib/utils';


// Error boundary component for individual settings sections
class SettingsErrorBoundary extends Component<
  { children: React.ReactNode; componentName: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; componentName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.componentName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card p-6 border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Collision: {this.props.componentName}</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AdminSettings() {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="glass-card overflow-hidden p-8 md:p-12 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-slate-700 to-slate-900 p-4 border border-white/20 shadow-2xl shadow-slate-900/40">
                <Settings className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">System Core</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  {isAdmin ? 'Master Administrative Overrides & Configuration' : 'Agent Profile & Secure Settings'}
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card bg-white/[0.03] border-white/5 px-6 py-4 flex flex-col items-end min-w-[200px]">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Authorization Tier</span>
            <span className="text-xl font-black text-white tracking-tighter uppercase italic">{isAdmin ? 'LEVEL 1 ADMIN' : 'LEVEL 2 AGENT'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Navigation Matrix */}
        <div className="xl:col-span-1 space-y-3">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Configuration Nodes</span>
          <InstructionCard icon={Cpu} label="System Engine" desc="Core processing & status" />
          <InstructionCard icon={Calendar} label="Temporal Lock" desc="Month/Year constraints" />
          <InstructionCard icon={Eye} label="Stealth Mode" desc="Balance obfuscation utility" />
          <InstructionCard icon={Lock} label="Security Core" desc="Encryption & passwords" />
        </div>

        {/* Settings Buffer */}
        <div className="xl:col-span-3 space-y-6">
          <AppleControlList className="max-w-none bg-transparent p-0 grid grid-cols-1 gap-6">
            {isAdmin && (
              <>
                <SettingsGroup icon={Activity} label="REAL-TIME SYSTEM STATUS" color="emerald">
                  <SettingsErrorBoundary componentName="System Status">
                    <SettingsStatusDisplay />
                  </SettingsErrorBoundary>
                </SettingsGroup>

                <SettingsGroup icon={Calendar} label="TEMPORAL PERIOD SYNCHRONIZATION" color="blue">
                  <SettingsErrorBoundary componentName="Month/Year Selector">
                    <MonthYearSelector />
                  </SettingsErrorBoundary>
                </SettingsGroup>

                <SettingsGroup icon={Eye} label="BALANCE OBFUSCATION PROTOCOLS" color="indigo">
                  <SettingsErrorBoundary componentName="Balance Visibility Control">
                    <BalanceVisibilityControl />
                  </SettingsErrorBoundary>
                </SettingsGroup>

                <SettingsGroup icon={Binary} label="IMMUTABLE LEDGER OVERRIDES" color="rose">
                  <div className="p-4 bg-rose-500/[0.02] border border-rose-500/10 rounded-2xl mb-4">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest leading-relaxed">
                      ⚠️ WARNING: Manual ledger overrides bypass standard verification logic. All alterations are logged with biometric signatures.
                    </p>
                  </div>
                  <SettingsErrorBoundary componentName="System Balance Overrides">
                    <SystemBalanceOverrides />
                  </SettingsErrorBoundary>
                </SettingsGroup>

                <SettingsGroup icon={UserPlus} label="SYNTHETIC AGENT PROVISIONING" color="purple">
                  <SettingsErrorBoundary componentName="Test User Creator">
                    <TestUserCreator />
                  </SettingsErrorBoundary>
                </SettingsGroup>
              </>
            )}

            <SettingsGroup icon={Key} label="AGENT CREDENTIAL STABILITY" color="slate">
              <SettingsErrorBoundary componentName="Password Change">
                <div className="max-w-xl">
                  <UniversalPasswordChange />
                </div>
              </SettingsErrorBoundary>
            </SettingsGroup>
          </AppleControlList>
        </div>
      </div>
    </div>
  );
}

function SettingsGroup({ icon: Icon, label, children, color }: any) {
  const colors: any = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    slate: "text-slate-400 bg-slate-500/10 border-slate-500/20"
  };
  return (
    <div className="glass-card overflow-hidden border-white/5 shadow-2xl transition-all duration-500 hover:border-white/10 group">
      <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{label}</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
      </div>
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}

function InstructionCard({ icon: Icon, label, desc }: any) {
  return (
    <div className="glass-card p-4 border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all cursor-default group">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
        <div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors leading-none mb-1">{label}</div>
          <div className="text-[9px] font-bold text-slate-700 uppercase tracking-tighter leading-none">{desc}</div>
        </div>
      </div>
    </div>
  );
}

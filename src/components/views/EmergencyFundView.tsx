import { EmergencyFundManagement } from '@/components/emergency-fund/EmergencyFundManagement';
import { ShieldAlert, ShieldCheck, Activity, Zap, Cpu, ArrowRightCircle } from 'lucide-react';

export function EmergencyFundView() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="glass-card overflow-hidden p-8 md:p-12 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-rose-500 to-orange-600 p-4 border border-white/20 shadow-2xl shadow-rose-500/40">
                                <ShieldAlert className="w-full h-full text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Vortex Buffer</h1>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                                    Critical Contingency Liquidity Reserve
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="glass-card bg-white/[0.03] border-white/5 px-6 py-4 flex flex-col items-end min-w-[200px]">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Authorization Matrix</span>
                            <span className="text-xl font-black text-white tracking-tighter uppercase italic">CRITICAL RESERVE</span>
                        </div>
                    </div>
                </div>
            </div>
            <EmergencyFundManagement />
        </div>
    );
}

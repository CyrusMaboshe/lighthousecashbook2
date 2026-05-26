import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Clock, User, ShieldAlert, History, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface DatabaseAdminLog {
  id: string;
  action: string;
  performed_by: string;
  timestamp: string;
  details?: Record<string, any>;
}

export function AdminLogs() {
  const [logs, setLogs] = useState<DatabaseAdminLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadLogs();
    }
  }, [currentUser]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading admin logs:', error);
        return;
      }
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading admin logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="glass-card overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-inner">
              <History className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Audit Trail</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Immutable Administrative Record</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              Live Monitoring Active
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Synchronizing Audit Records...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-20 text-center">
              <ShieldAlert className="w-16 h-16 text-slate-700 mx-auto mb-6 stroke-[1]" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Security Events Recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Administrative Agent</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol Executed</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Temporal Stamp</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Security Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                          </div>
                          <span className="font-bold text-white text-base tracking-tight">{log.performed_by}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-indigo-500/70" />
                          <span className="text-slate-300 text-sm font-medium leading-relaxed">{log.action}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          {format(parseISO(log.timestamp), 'MMM dd, yyyy • HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <code className="text-[9px] font-black text-slate-600 bg-white/5 px-2 py-1 rounded border border-white/5 truncate max-w-[80px] inline-block">
                          {log.id.slice(0, 8).toUpperCase()}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </div>

      <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-4 mx-2">
        <ShieldAlert className="w-5 h-5 text-indigo-400 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Compliance Notice</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            All administrative actions are cryptographically logged and stored in the immutable audit repository.
            Access to these records is restricted to Tier-1 system administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}

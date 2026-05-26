import { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Search, Filter, User, Clock, Activity, RefreshCcw, Layout, ArrowRightCircle } from 'lucide-react';
import { UserLog } from '@/types/auth';
import { getAllUserLogs, getUserLogs, getUserLogsByActionType, USER_ACTION_TYPES } from '@/services/userLogService';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export function UserLogs() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const { currentUser } = useAuth();
  const channelRef = useRef<any>(null);

  const uniqueUsers = Array.from(new Set(logs.map(log => log.username))).sort();

  useEffect(() => {
    if (currentUser) {
      loadLogs();
      setupRealtimeSubscription();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedActionType, selectedUser]);

  const setupRealtimeSubscription = () => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`user-logs-changes-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_logs'
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const loadLogs = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      let data: UserLog[] = [];

      if (currentUser.role === 'admin') {
        if (selectedActionType === 'all') {
          data = await getAllUserLogs(500);
        } else {
          data = await getUserLogsByActionType(selectedActionType as any);
        }
      } else {
        if (!currentUser.id) {
          setLogs([]);
          return;
        }

        if (selectedActionType === 'all') {
          data = await getUserLogs(currentUser.id, 200);
        } else {
          const allUserLogs = await getUserLogs(currentUser.id, 200);
          data = allUserLogs.filter(log => log.action_type === selectedActionType);
        }
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Error loading user logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedActionType !== 'all') {
      filtered = filtered.filter(log => log.action_type === selectedActionType);
    }

    if (isAdmin && selectedUser !== 'all') {
      filtered = filtered.filter(log => log.username === selectedUser);
    }

    setFilteredLogs(filtered);
  };

  const handleRefresh = () => {
    loadLogs();
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case USER_ACTION_TYPES.LOGIN:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case USER_ACTION_TYPES.LOGOUT:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case USER_ACTION_TYPES.TRANSACTION_CREATE:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case USER_ACTION_TYPES.TRANSACTION_UPDATE:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case USER_ACTION_TYPES.TRANSACTION_DELETE:
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      case USER_ACTION_TYPES.PROFILE_UPDATE:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case USER_ACTION_TYPES.VIEW_CHANGE:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case USER_ACTION_TYPES.EXPORT_PDF:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case USER_ACTION_TYPES.CASHVAULT_DEPOSIT:
      case USER_ACTION_TYPES.CASHVAULT_WITHDRAWAL:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const componentTitle = isAdmin ? 'Global Activity Hub' : 'Personal Activity Feed';
  const componentDescription = isAdmin
    ? 'Real-time monitoring of all system-wide operations'
    : 'Chronological record of your administrative interactions';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="glass-card overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 shadow-inner">
              <Activity className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">{componentTitle}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">{componentDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} className="h-12 px-6 rounded-xl glass-btn-primary bg-white/[0.05] border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest">
              <RefreshCcw className={cn("w-3.5 h-3.5 mr-2", loading && "animate-spin")} />
              Sync Feed
            </Button>
          </div>
        </div>

        <div className="p-8 bg-white/[0.02] border-b border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
              <Input
                placeholder="Search by identity or action detail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input h-14 pl-12"
              />
            </div>

            <Select value={selectedActionType} onValueChange={setSelectedActionType}>
              <SelectTrigger className="glass-input h-14">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <SelectValue placeholder="Protocol Type" />
                </div>
              </SelectTrigger>
              <SelectContent className="glass-select-content">
                <SelectItem value="all">All Protocols</SelectItem>
                {Object.values(USER_ACTION_TYPES).sort().map((type) => (
                  <SelectItem key={type} value={type}>{formatActionType(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="glass-input h-14">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <SelectValue placeholder="Target User" />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-select-content">
                  <SelectItem value="all">All Personnel</SelectItem>
                  {uniqueUsers.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <CardContent className="p-0">
          {loading && logs.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Activity Stream...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-20 text-center">
              <Layout className="w-16 h-16 text-slate-800 mx-auto mb-4 stroke-[1]" />
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No matching records found in the current buffer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5">
                    {isAdmin && <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Personnel</th>}
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Action Description</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Temporal Stamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.03] transition-colors group">
                      {isAdmin && (
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                              <User className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="font-bold text-white text-base tracking-tight">{log.username}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm inline-block",
                          getActionTypeColor(log.action_type)
                        )}>
                          {formatActionType(log.action_type)}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                          <ArrowRightCircle className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-slate-300 text-sm font-medium leading-relaxed max-w-sm" title={log.action_description}>
                            {log.action_description}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] font-black uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          {format(parseISO(log.timestamp), 'MMM dd • HH:mm:ss')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-6 bg-white/[0.01] border-t border-white/5 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
                <span>Buffer Content: {filteredLogs.length} Records</span>
                {isAdmin ? <span>Unique Agents: {uniqueUsers.length}</span> : <span>Verified History</span>}
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}

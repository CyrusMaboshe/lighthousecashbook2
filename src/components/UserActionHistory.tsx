import { useState, useEffect, useRef } from 'react';
import { format, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { History, Clock, Activity, Filter, TrendingUp } from 'lucide-react';
import { UserLog } from '@/types/auth';
import { getUserLogs, getUserLogsByDateRange, USER_ACTION_TYPES } from '@/services/userLogService';
import { supabase } from '@/integrations/supabase/client';

interface UserActionHistoryProps {
  className?: string;
}

export function UserActionHistory({ className }: UserActionHistoryProps) {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7days');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const { currentUser } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadUserLogs();
      setupRealtimeSubscription();
    }

    return () => {
      if (channelRef.current) {
        console.log('🧹 Cleaning up user action history real-time subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser, selectedPeriod, selectedActionType]);

  const setupRealtimeSubscription = () => {
    if (!currentUser?.id) return;

    console.log('🔄 Setting up real-time subscription for user action history');

    const channel = supabase
      .channel(`user-action-history-changes-${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_logs',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('📡 User action history real-time update:', payload);

          // Reload logs when any change occurs for this user
          loadUserLogs();
        }
      )
      .subscribe((status) => {
        console.log('📡 User action history subscription status:', status);
      });

    channelRef.current = channel;
  };

  const loadUserLogs = async () => {
    if (!currentUser?.id) {
      console.warn('❌ Cannot load user logs: currentUser or currentUser.id is null', { currentUser });
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Loading user action history for user:', currentUser.username, 'ID:', currentUser.id);
      let data: UserLog[] = [];

      // Calculate date range based on selected period
      const now = new Date();
      let startDate: Date;

      switch (selectedPeriod) {
        case '1day':
          startDate = startOfDay(now);
          break;
        case '7days':
          startDate = startOfDay(subDays(now, 7));
          break;
        case '30days':
          startDate = startOfDay(subDays(now, 30));
          break;
        case '90days':
          startDate = startOfDay(subDays(now, 90));
          break;
        default:
          startDate = startOfDay(subDays(now, 7));
      }

      const endDate = endOfDay(now);

      if (selectedPeriod === 'all') {
        console.log('📅 Fetching all user logs for user:', currentUser.username);
        data = await getUserLogs(currentUser.id, 200);
      } else {
        console.log('📅 Fetching user logs for date range:', startDate.toISOString(), 'to', endDate.toISOString());
        data = await getUserLogsByDateRange(
          startDate.toISOString(),
          endDate.toISOString(),
          currentUser.id,
          200
        );
      }

      // Filter by action type if selected
      if (selectedActionType !== 'all') {
        const originalCount = data.length;
        data = data.filter(log => log.action_type === selectedActionType);
        console.log('🔍 Filtered by action type:', selectedActionType, '- Before:', originalCount, 'After:', data.length);
      }

      console.log('✅ User action history loaded for', currentUser.username, ':', data?.length || 0, 'records');
      setLogs(data || []);
    } catch (error) {
      console.error('❌ Error loading user action history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case USER_ACTION_TYPES.LOGIN:
        return 'text-green-600 bg-green-50';
      case USER_ACTION_TYPES.LOGOUT:
        return 'text-red-600 bg-red-50';
      case USER_ACTION_TYPES.TRANSACTION_CREATE:
        return 'text-blue-600 bg-blue-50';
      case USER_ACTION_TYPES.TRANSACTION_UPDATE:
        return 'text-yellow-600 bg-yellow-50';
      case USER_ACTION_TYPES.TRANSACTION_DELETE:
        return 'text-red-600 bg-red-50';
      case USER_ACTION_TYPES.PROFILE_UPDATE:
        return 'text-purple-600 bg-purple-50';
      case USER_ACTION_TYPES.VIEW_CHANGE:
        return 'text-gray-600 bg-gray-50';
      case USER_ACTION_TYPES.EXPORT_PDF:
        return 'text-indigo-600 bg-indigo-50';
      case USER_ACTION_TYPES.ANALYTICS_VIEW:
        return 'text-teal-600 bg-teal-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getActionStats = () => {
    const stats = {
      total: logs.length,
      transactions: logs.filter(log => log.action_type.includes('transaction')).length,
      logins: logs.filter(log => log.action_type === USER_ACTION_TYPES.LOGIN).length,
      profileUpdates: logs.filter(log => log.action_type === USER_ACTION_TYPES.PROFILE_UPDATE).length,
    };
    return stats;
  };

  const stats = getActionStats();

  if (loading) {
    return (
      <Card className={`bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <CardTitle className="text-xl font-semibold text-slate-800">
              My Action History
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-500">Loading your action history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <CardTitle className="text-xl font-semibold text-slate-800">
              My Action History
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadUserLogs} variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-48">
              <Clock className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1day">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedActionType} onValueChange={setSelectedActionType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.values(USER_ACTION_TYPES).map((actionType) => (
                <SelectItem key={actionType} value={actionType}>
                  {formatActionType(actionType)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-600 text-sm font-medium">Total Actions</div>
            <div className="text-blue-800 text-xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-green-600 text-sm font-medium">Transactions</div>
            <div className="text-green-800 text-xl font-bold">{stats.transactions}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-purple-600 text-sm font-medium">Logins</div>
            <div className="text-purple-800 text-xl font-bold">{stats.logins}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-orange-600 text-sm font-medium">Profile Updates</div>
            <div className="text-orange-800 text-xl font-bold">{stats.profileUpdates}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">
              {selectedPeriod === 'all'
                ? "No actions recorded yet. Start using the app to see your activity history!"
                : `No actions found for the selected period (${selectedPeriod}). Try selecting a different time range.`
              }
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Your actions like login, transactions, and navigation will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-lg hover:bg-slate-100/50 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionTypeColor(log.action_type)}`}>
                    {formatActionType(log.action_type)}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm font-medium">
                    {log.action_description}
                  </p>
                </div>
                
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <Clock className="w-3 h-3" />
                    {format(parseISO(log.timestamp), 'MMM dd, HH:mm')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

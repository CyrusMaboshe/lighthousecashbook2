// Campaign Admin Logs - Admin activity logs for campaigns

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar, User, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface AdminLog {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'login' | 'export';
  details?: string;
}

interface CampaignAdminLogsProps {
  campaignId: string;
}

export function CampaignAdminLogs({ campaignId }: CampaignAdminLogsProps) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAdminLogs();
  }, [campaignId]);

  useEffect(() => {
    const filtered = logs.filter(log =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

  const loadAdminLogs = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockLogs: AdminLog[] = [
        {
          id: '1',
          action: 'User Created',
          description: 'Created new campaign user: sarah_assistant',
          user: 'john_photographer',
          timestamp: new Date().toISOString(),
          type: 'create'
        },
        {
          id: '2',
          action: 'Transaction Added',
          description: 'Added wedding photography transaction for $2,500',
          user: 'john_photographer',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'create'
        },
        {
          id: '3',
          action: 'Settings Updated',
          description: 'Updated campaign notification settings',
          user: 'john_photographer',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'update'
        },
        {
          id: '4',
          action: 'Data Exported',
          description: 'Exported transaction data to PDF',
          user: 'sarah_assistant',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          type: 'export'
        },
        {
          id: '5',
          action: 'User Login',
          description: 'User logged into campaign dashboard',
          user: 'mike_editor',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          type: 'login'
        }
      ];

      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading admin logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'export': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'login': return '🔐';
      case 'export': return '📄';
      default: return '📝';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Logs</h1>
        <p className="text-gray-600">Track all administrative activities in this campaign</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter(log => 
                    new Date(log.timestamp).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-purple-600">
                  {new Set(logs.map(log => log.user)).size}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Activity</p>
                <p className="text-sm font-bold text-orange-600">
                  {logs.length > 0 ? format(new Date(logs[0].timestamp), 'HH:mm') : 'N/A'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="text-2xl">{getTypeIcon(log.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{log.action}</h3>
                    <Badge className={getTypeColor(log.type)}>
                      {log.type}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2">{log.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {log.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

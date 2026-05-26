import { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { Bell, Plus, X, AlertTriangle, Info, Calendar, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationForm } from '@/components/NotificationForm';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'serious' | 'not-serious' | 'moderate' | 'very-urgent' | 'very-serious' | 'appointment' | 'todo' | 'future-plans' | 'schedule';
  createdBy: string;
  createdAt: string;
  isOld?: boolean;
}

export function EnhancedNotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { currentUser, isAdmin, logAdminAction } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const saved = localStorage.getItem('lighthouse-notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed.sort((a: Notification, b: Notification) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    }
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'createdBy' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      createdBy: currentUser?.username || 'Unknown',
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    localStorage.setItem('lighthouse-notifications', JSON.stringify(updated));

    if (isAdmin) {
      logAdminAction(`Created ${notificationData.priority} notification: ${notificationData.title}`);
    }

    toast({
      title: "Notification Created",
      description: "New notification has been added successfully.",
    });

    setShowForm(false);
  };

  const markAsOld = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, isOld: true } : n
    );
    setNotifications(updated);
    localStorage.setItem('lighthouse-notifications', JSON.stringify(updated));

    toast({
      title: "Notification Archived",
      description: "Notification moved to old notifications.",
    });
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('lighthouse-notifications', JSON.stringify(updated));

    if (isAdmin) {
      logAdminAction(`Deleted notification ID: ${id}`);
    }

    toast({
      title: "Notification Deleted",
      description: "Notification has been removed successfully.",
    });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'very-urgent':
      case 'very-serious':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'serious':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'todo':
        return <Target className="w-4 h-4 text-green-500" />;
      case 'schedule':
        return <Clock className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'very-urgent':
      case 'very-serious':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'serious':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'appointment':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'todo':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'schedule':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const newNotifications = notifications.filter(n => !n.isOld);
  const oldNotifications = notifications.filter(n => n.isOld);

  const NotificationCard = ({ notification, showArchive = false }: { notification: Notification; showArchive?: boolean }) => {
    const formatNotificationDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        if (isValid(date)) {
          return format(date, 'MMM dd, yyyy HH:mm');
        }
        return 'Invalid date';
      } catch (error) {
        console.error('Date formatting error:', error, 'for date:', dateString);
        return 'Invalid date';
      }
    };

    return (
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getPriorityIcon(notification.priority)}
              <h3 className="font-semibold text-slate-800">{notification.title}</h3>
              <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                {notification.priority.replace('-', ' ')}
              </Badge>
            </div>
            <p className="text-slate-600 mb-2">{notification.message}</p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>By: {notification.createdBy}</span>
              <span>{formatNotificationDate(notification.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showArchive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsOld(notification.id)}
                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
              >
                Archive
              </Button>
            )}
            {isAdmin && (
              <ConfirmationDialog
                title="Delete Notification"
                description="Are you sure you want to delete this notification? This action cannot be undone."
                onConfirm={() => deleteNotification(notification.id)}
                confirmText="Delete"
                variant="destructive"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </ConfirmationDialog>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          {isAdmin && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Notification
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" className="flex items-center gap-2">
              New Notifications
              {newNotifications.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {newNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="old" className="flex items-center gap-2">
              Old Notifications
              {oldNotifications.length > 0 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  {oldNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="mt-4">
            {newNotifications.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {newNotifications.map(notification => (
                  <NotificationCard 
                    key={notification.id} 
                    notification={notification} 
                    showArchive={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No new notifications</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="old" className="mt-4">
            {oldNotifications.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {oldNotifications.map(notification => (
                  <NotificationCard 
                    key={notification.id} 
                    notification={notification} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No old notifications</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {showForm && (
        <NotificationForm
          onSubmit={addNotification}
          onCancel={() => setShowForm(false)}
        />
      )}
    </Card>
  );
}

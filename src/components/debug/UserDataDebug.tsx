import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export function UserDataDebug() {
  const { currentUser, refreshUserData } = useAuth();

  const handleRefresh = async () => {
    console.log('Manual refresh triggered');
    await refreshUserData();
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-white/90 backdrop-blur-sm shadow-lg border border-white/20 z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          User Data Debug
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>ID:</strong> {currentUser?.id || 'None'}
        </div>
        <div>
          <strong>Username:</strong> {currentUser?.username || 'None'}
        </div>
        <div>
          <strong>Profile Picture URL:</strong>
          <div className="break-all text-gray-600 mt-1">
            {currentUser?.profile_picture_url || 'None'}
          </div>
        </div>
        <div>
          <strong>LocalStorage:</strong>
          <div className="break-all text-gray-600 mt-1">
            {localStorage.getItem('lighthouse-current-user') ? 'Present' : 'Missing'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

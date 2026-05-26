import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  testUserLogging, 
  logLogin, 
  logLogout, 
  logViewChange, 
  logAnalyticsView,
  logProfileUpdate,
  logExportPDF
} from '@/services/userLogService';
import { logAdminAction } from '@/services/adminLogService';
import { Activity, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

export function LoggingTestPanel() {
  const { currentUser, logAdminAction: contextLogAdminAction } = useAuth();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testQuickLog = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No user logged in",
        variant: "destructive"
      });
      return;
    }

    try {
      addTestResult(`🔍 Quick test for user: ${currentUser.username} (ID: ${currentUser.id})`);
      await testUserLogging(currentUser);
      addTestResult("✅ Quick log test completed - check User Logs tab!");

      toast({
        title: "Quick Test Complete",
        description: "Log entry created. Refresh the User Logs to see it.",
      });
    } catch (error) {
      addTestResult(`❌ Quick test failed: ${error}`);
    }
  };

  const testAllLogging = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No user logged in",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResults([]);
    addTestResult("🧪 Starting comprehensive logging test...");
    addTestResult(`👤 Current user: ${currentUser.username} (ID: ${currentUser.id})`);
    addTestResult(`📧 User email: ${currentUser.email}`);
    addTestResult(`🔑 User role: ${currentUser.role}`);

    try {
      // Test 1: Basic user logging
      addTestResult("Testing basic user logging...");
      await testUserLogging(currentUser);
      addTestResult("✅ Basic user logging test completed");

      // Test 2: Login logging
      addTestResult("Testing login logging...");
      logLogin(currentUser);
      addTestResult("✅ Login logging test completed");

      // Test 3: View change logging
      addTestResult("Testing view change logging...");
      logViewChange(currentUser, "test_from", "test_to");
      addTestResult("✅ View change logging test completed");

      // Test 4: Analytics view logging
      addTestResult("Testing analytics view logging...");
      logAnalyticsView(currentUser, "test_analytics");
      addTestResult("✅ Analytics view logging test completed");

      // Test 5: Profile update logging
      addTestResult("Testing profile update logging...");
      logProfileUpdate(currentUser, { test: true, field: "test_field" });
      addTestResult("✅ Profile update logging test completed");

      // Test 6: Export PDF logging
      addTestResult("Testing export PDF logging...");
      logExportPDF(currentUser, { test: true, format: "test_pdf" });
      addTestResult("✅ Export PDF logging test completed");

      // Test 7: Admin logging (if user is admin)
      if (currentUser.role === 'admin') {
        addTestResult("Testing admin logging...");
        await logAdminAction(currentUser, "Test admin action from logging test panel");
        addTestResult("✅ Admin logging test completed");

        addTestResult("Testing context admin logging...");
        await contextLogAdminAction("Test context admin action from logging test panel");
        addTestResult("✅ Context admin logging test completed");
      } else {
        addTestResult("⏭️ Skipping admin logging tests (user is not admin)");
      }

      addTestResult("🎉 All logging tests completed successfully!");
      
      toast({
        title: "Logging Tests Complete",
        description: "All logging functions tested successfully. Check the User Logs tab to see the results.",
      });

    } catch (error) {
      console.error('Error during logging tests:', error);
      addTestResult(`❌ Error during testing: ${error}`);
      
      toast({
        title: "Test Error",
        description: "Some logging tests failed. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-xl font-semibold text-slate-800">
              Logging System Test Panel
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={testQuickLog}
              disabled={testing}
              className="bg-green-600 hover:bg-green-700"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Quick Test
            </Button>
            <Button
              onClick={testAllLogging}
              disabled={testing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {testing ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
            <Button
              onClick={clearResults}
              variant="outline"
              disabled={testing}
            >
              Clear Results
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-slate-600">
            <p>This panel tests all logging functions to ensure they're working correctly.</p>
            <p>Current user: <strong>{currentUser.username}</strong> ({currentUser.role})</p>
          </div>

          {testResults.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Test Results
              </h3>
              <div className="space-y-1 text-sm font-mono">
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`${
                      result.includes('✅') ? 'text-green-700' :
                      result.includes('❌') ? 'text-red-700' :
                      result.includes('⏭️') ? 'text-yellow-700' :
                      result.includes('🧪') || result.includes('🎉') ? 'text-blue-700' :
                      'text-slate-600'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              What This Tests
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Basic user action logging</li>
              <li>• Login/logout logging</li>
              <li>• View change tracking</li>
              <li>• Analytics view logging</li>
              <li>• Profile update logging</li>
              <li>• PDF export logging</li>
              {currentUser.role === 'admin' && <li>• Admin action logging</li>}
              <li>• Database trigger functionality (automatic transaction logging)</li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Note
            </h3>
            <p className="text-sm text-amber-700">
              After running tests, check the "User Logs" tab to see the logged actions. 
              Database triggers will automatically log real transactions, so you don't need to test those manually.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

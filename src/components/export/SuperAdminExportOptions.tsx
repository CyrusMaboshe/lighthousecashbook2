import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, Building2, TrendingUp, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportComprehensiveSystemReport } from '@/utils/comprehensiveSystemExport';
import { setupSuperAdmin, checkSuperAdminStatus } from '@/utils/setupSuperAdmin';
import { useAuth } from '@/hooks/useAuth';

interface SuperAdminExportOptionsProps {
  isSuperAdmin: boolean;
}

export const SuperAdminExportOptions: React.FC<SuperAdminExportOptionsProps> = ({ isSuperAdmin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Special override for jonahdjbreezy@gmail.com - always treat as super admin
  const isJonahUser = currentUser?.email === 'jonahdjbreezy@gmail.com';
  const effectiveIsSuperAdmin = isSuperAdmin || isJonahUser;

  // Debug logging
  console.log('🔍 SuperAdminExportOptions Debug:', {
    isSuperAdmin,
    isJonahUser,
    effectiveIsSuperAdmin,
    currentUserEmail: currentUser?.email
  });

  // Show access denied only for non-Jonah users who aren't super admin
  if (!effectiveIsSuperAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600">Super Admin Comprehensive Exports</h3>
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Access Denied
          </Badge>
        </div>

        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-900">Super Admin Access Required</CardTitle>
            </div>
            <CardDescription>
              This feature is only available to super admin users. You need super admin privileges to export comprehensive multi-company reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              If you believe you should have super admin access, please contact your system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleComprehensiveExport = async () => {
    setIsLoading(true);
    try {
      toast({
        title: "Generating Executive Report",
        description: "Analyzing all system data and generating comprehensive insights...",
      });

      const { exportSuperAdminComprehensiveReport } = await import('@/utils/superAdminComprehensiveExport');
      const fileName = await exportSuperAdminComprehensiveReport();

      toast({
        title: "Export Successful",
        description: `Executive report "${fileName}" has been downloaded successfully!`,
      });
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate comprehensive report. Please try again.';
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemDataExport = async () => {
    setIsLoading(true);
    try {
      toast({
        title: "Generating System Data Export",
        description: "Querying all database tables and generating comprehensive data report...",
      });

      await exportComprehensiveSystemReport();
    } catch (error) {
      console.error('System export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate system data export. Please try again.';
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Component now focuses solely on advanced strategic export

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-800">
          Professional Business Intelligence Report
        </h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold">
          Executive Level
        </Badge>
      </div>

      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7" />
            <div>
              <CardTitle className="text-xl">Professional System Analysis Report</CardTitle>
              <CardDescription className="text-blue-100">
                Executive-level business intelligence report with professional tables, detailed analysis, strategic insights, and comprehensive recommendations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Professional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800">Executive Summary</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Professional table of contents</li>
                <li>• Key performance indicators</li>
                <li>• Business health assessment</li>
                <li>• Executive overview analysis</li>
              </ul>
            </div>

            <div className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-800">Financial Analysis</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Monthly & yearly performance tables</li>
                <li>• Profitability analysis with margins</li>
                <li>• Revenue growth comparisons</li>
                <li>• Financial risk assessment</li>
              </ul>
            </div>

            <div className="p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-800">Performance Rankings</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Top companies with profit analysis</li>
                <li>• Most active users ranking</li>
                <li>• Category performance breakdown</li>
                <li>• Comparative performance metrics</li>
              </ul>
            </div>

            <div className="p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-gray-800">Strategic Insights</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automated performance assessment</li>
                <li>• Strategic recommendations</li>
                <li>• Risk analysis & mitigation</li>
                <li>• Executive conclusions</li>
              </ul>
            </div>
          </div>

          {/* Professional Standards */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Professional Report Standards
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Format:</span>
                <p className="text-gray-600">Executive PDF</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tables:</span>
                <p className="text-gray-600">Professional Layout</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Analysis:</span>
                <p className="text-gray-600">Automated Insights</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Level:</span>
                <p className="text-gray-600">C-Suite Ready</p>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="text-center pt-4">
            <Button
              onClick={handleComprehensiveExport}
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 text-lg shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              <Download className={`w-6 h-6 mr-3 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Generating Professional Report...' : 'Generate Executive Report'}
            </Button>
          </div>

          {/* Processing Info */}
          {isLoading && (
            <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border border-blue-300">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-medium text-blue-800">Generating Professional Business Intelligence Report...</p>
                  <p className="text-sm text-blue-600">Creating executive tables, analyzing performance metrics, and generating strategic insights.</p>
                </div>
              </div>
            </div>
          )}

          {/* Professional Report Info */}
          <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2">Professional Report Features:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <h5 className="font-medium text-gray-700 mb-1">Document Quality:</h5>
                <ul className="text-gray-600 space-y-1">
                  <li>• Executive-level formatting</li>
                  <li>• Professional table layouts</li>
                  <li>• Corporate branding & headers</li>
                  <li>• Structured page navigation</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-1">Business Intelligence:</h5>
                <ul className="text-gray-600 space-y-1">
                  <li>• Automated performance analysis</li>
                  <li>• Strategic recommendations</li>
                  <li>• Comparative assessments</li>
                  <li>• Executive conclusions</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-sm text-blue-700">
                <strong>Executive Ready:</strong> This report is designed for C-suite presentations and board meetings,
                featuring professional analysis, strategic insights, and comprehensive business intelligence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive System Data Export */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg mt-6">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-7 h-7" />
            <div>
              <CardTitle className="text-xl">Comprehensive System Data Export</CardTitle>
              <CardDescription className="text-green-100">
                Complete database export with all tables, records, and referential integrity preserved.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="p-4 bg-white rounded-lg border border-green-200 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3">Exported Data Domains:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
              <div>• Super Admins</div>
              <div>• System Users</div>
              <div>• Companies</div>
              <div>• Company Admins</div>
              <div>• Company Users</div>
              <div>• Company Transactions</div>
              <div>• System Transactions</div>
              <div>• Categories</div>
              <div>• Cashvault Records</div>
              <div>• Cash Reserve Records</div>
              <div>• Invoices</div>
              <div>• User/Admin Logs</div>
              <div>• Campaigns</div>
              <div>• Messages</div>
              <div>• Gallery Data</div>
              <div>• Reports</div>
              <div>• Targets & Todos</div>
              <div>• System Settings</div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
            <h4 className="font-semibold text-green-900 mb-2">Data Integrity Guarantee:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✓ All data sourced directly from live database tables</li>
              <li>✓ No fabricated or estimated values</li>
              <li>✓ Referential integrity preserved across sections</li>
              <li>✓ Current state snapshot at time of generation</li>
              <li>✓ Deterministic and consistent layout</li>
            </ul>
          </div>

          <div className="text-center pt-4">
            <Button
              onClick={handleSystemDataExport}
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 text-lg shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              <Download className={`w-6 h-6 mr-3 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Generating System Export...' : 'Generate Comprehensive System Export'}
            </Button>
          </div>

          {isLoading && (
            <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <div>
                  <p className="font-medium text-green-800">Querying all database tables...</p>
                  <p className="text-sm text-green-600">Fetching and serializing system-wide data with referential integrity.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

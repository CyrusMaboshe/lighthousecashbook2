
import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function MonthYearSelector() {
  const [isUpdating, setIsUpdating] = useState(false);

  let systemSettings, updateSystemSettings, logAdminAction, toast;

  try {
    const authHook = useAuth();
    const toastHook = useToast();

    systemSettings = authHook.systemSettings;
    updateSystemSettings = authHook.updateSystemSettings;
    logAdminAction = authHook.logAdminAction;
    toast = toastHook.toast;
  } catch (error) {
    console.error('Error in MonthYearSelector hooks:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <Calendar className="w-4 h-4" />
          <span className="font-medium">Month/Year Selector Error</span>
        </div>
        <p className="text-sm text-red-700">
          Failed to load month/year controls. Please refresh the page.
        </p>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  // Extended years range from 5 years ago to 2090
  const years = Array.from({ length: 2090 - (currentYear - 5) + 1 }, (_, i) => currentYear - 5 + i);

  const handleMonthChange = async (month: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      updateSystemSettings({ currentVisibleMonth: parseInt(month) });
      
      await logAdminAction(`Updated system settings: Visible month changed to ${monthNames[parseInt(month)]} ${systemSettings.currentVisibleYear}`);
      
      toast({
        title: "Visible Month Updated",
        description: `Users can now only see ${monthNames[parseInt(month)]} ${systemSettings.currentVisibleYear} transactions.`,
      });
    } catch (error) {
      console.error('Error updating visible month:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleYearChange = async (year: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      updateSystemSettings({ currentVisibleYear: parseInt(year) });
      
      await logAdminAction(`Updated system settings: Visible year changed to ${year}`);
      
      toast({
        title: "Visible Year Updated",
        description: `Users can now only see ${year} transactions.`,
      });
    } catch (error) {
      console.error('Error updating visible year:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg space-y-4">
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-slate-600" />
        <div>
          <h4 className="font-medium text-slate-800">User Month Access</h4>
          <p className="text-sm text-slate-600">
            Set which month regular users can view
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-700">Visible Month</Label>
          <Select 
            value={systemSettings.currentVisibleMonth.toString()} 
            onValueChange={handleMonthChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-slate-700">Visible Year</Label>
          <Select 
            value={systemSettings.currentVisibleYear.toString()} 
            onValueChange={handleYearChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}


import { SystemSettings } from '@/types/auth';

export const getDefaultSystemSettings = (): SystemSettings => ({
  currentVisibleYear: new Date().getFullYear(),
  currentVisibleMonth: new Date().getMonth(),
  showFullBalanceToUsers: false, // DEFAULT: Users see only their own transactions
  maxPictureCount: 100,
  defaultAmounts: [25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500]
});

export const loadSystemSettings = (): SystemSettings => {
  const storedSettings = localStorage.getItem('lighthouse-system-settings');
  const currentDefaults = getDefaultSystemSettings(); // This always returns current month/year

  if (storedSettings) {
    try {
      const parsedSettings = JSON.parse(storedSettings);

      // Always start with current month/year on app initialization, but preserve other settings
      return {
        ...currentDefaults, // This ensures current month/year
        ...parsedSettings,
        // Override with current month/year to ensure fresh start
        currentVisibleYear: currentDefaults.currentVisibleYear,
        currentVisibleMonth: currentDefaults.currentVisibleMonth,
        showFullBalanceToUsers: parsedSettings.showFullBalanceToUsers === true ? true : false
      };
    } catch (error) {
      console.error('Error parsing stored settings:', error);
      return currentDefaults;
    }
  }
  return currentDefaults;
};

export const saveSystemSettings = (settings: SystemSettings): void => {
  localStorage.setItem('lighthouse-system-settings', JSON.stringify(settings));
};

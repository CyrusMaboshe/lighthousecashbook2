import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserPreferences {
  showBalances: boolean;
  hideHomepageBalance: boolean;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  loading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    showBalances: true,
    hideHomepageBalance: false
  });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load preferences from Supabase
  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Loading preferences for user:', currentUser.username);

        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No preferences found, create default ones
            console.log('No preferences found, creating defaults');
            await createDefaultPreferences();
          } else {
            console.error('Error loading preferences:', error);
          }
        } else if (data) {
          console.log('Loaded preferences from Supabase:', data);
          setPreferences({
            showBalances: data.show_balances ?? true,
            hideHomepageBalance: data.hide_homepage_balance ?? false
          });
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser?.id]);

  // Create default preferences in database
  const createDefaultPreferences = async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: currentUser.id,
          username: currentUser.username,
          show_balances: true,
          hide_homepage_balance: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default preferences:', error);
      } else {
        console.log('Created default preferences:', data);
        setPreferences({
          showBalances: true,
          hideHomepageBalance: false
        });
      }
    } catch (error) {
      console.error('Failed to create default preferences:', error);
    }
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!currentUser?.id) {
      console.warn('Cannot update preferences: no current user');
      return;
    }

    const updatedPrefs = { ...preferences, ...newPrefs };
    console.log('Updating preferences for user:', currentUser.username, updatedPrefs);
    console.log('User ID:', currentUser.id);
    console.log('User object:', currentUser);

    // Optimistically update local state
    setPreferences(updatedPrefs);

    try {
      const dataToUpsert = {
        user_id: currentUser.id,
        username: currentUser.username,
        show_balances: updatedPrefs.showBalances,
        hide_homepage_balance: updatedPrefs.hideHomepageBalance
      };

      console.log('Attempting to upsert:', dataToUpsert);

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(dataToUpsert, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error hint:', error.hint);
        console.error('Error details:', error.details);
        // Revert on error
        setPreferences(preferences);
        throw error;
      } else {
        console.log('Preferences saved successfully:', data);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreferences, loading }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}


import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { hashPassword } from '@/utils/passwordUtils';

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Profile picture management functions
export const uploadProfilePicture = async (file: File, userId: string): Promise<string> => {
  try {
    console.log('Uploading profile picture for user:', userId);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });

    // First, try uploading to Supabase storage
    try {
      // Generate unique filename with timestamp to avoid conflicts
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `user-${userId}-${timestamp}.${fileExt}`;

      console.log('Attempting storage upload with filename:', fileName);

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.warn('Storage upload failed, trying base64 fallback:', uploadError);
        throw uploadError; // This will trigger the fallback
      }

      console.log('Storage upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('Generated public URL:', publicUrl);

      // Update user record with profile picture URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user profile picture URL:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log('Profile picture uploaded successfully via storage:', publicUrl);
      return publicUrl;

    } catch (storageError) {
      // Fallback to base64 storage in database
      console.log('Storage upload failed, using base64 fallback');

      // Convert file to base64
      const base64Data = await fileToBase64(file);
      console.log('File converted to base64, length:', base64Data.length);

      // Update user record with base64 data
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: base64Data })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user profile picture with base64:', updateError);
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log('Profile picture uploaded successfully via base64 fallback');
      return base64Data;
    }

  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    throw error;
  }
};

export const deleteProfilePicture = async (userId: string): Promise<void> => {
  try {
    console.log('Deleting profile picture for user:', userId);

    // Get current user data to find the profile picture
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user data:', fetchError);
      throw fetchError;
    }

    // If user has a profile picture, try to delete it from storage (if it's not base64)
    if (userData?.profile_picture_url && !userData.profile_picture_url.startsWith('data:')) {
      try {
        // Extract filename from URL - try to find the actual filename
        const url = userData.profile_picture_url;
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];

        console.log('Attempting to delete file from storage:', fileName);

        const { error: deleteError } = await supabase.storage
          .from('profile-pictures')
          .remove([fileName]);

        if (deleteError) {
          console.warn('Error deleting profile picture from storage (continuing anyway):', deleteError);
        } else {
          console.log('File deleted from storage successfully');
        }
      } catch (storageError) {
        console.warn('Storage deletion failed (continuing anyway):', storageError);
      }
    }

    // Update user record to remove profile picture URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture_url: null })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile picture URL:', updateError);
      throw updateError;
    }

    console.log('Profile picture deleted successfully');
  } catch (error) {
    console.error('Error in deleteProfilePicture:', error);
    throw error;
  }
};

// Update user profile (username, email)
export const updateUserProfile = async (
  userId: string,
  updates: {
    username?: string;
    email?: string;
  },
  currentUserId: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Permission check: users can only update their own profile unless they're admin
    if (!isAdmin && userId !== currentUserId) {
      return {
        success: false,
        error: 'You do not have permission to update this profile'
      };
    }

    console.log('Updating user profile:', { userId, updates });

    // Validate inputs
    if (updates.username && updates.username.trim().length < 3) {
      return {
        success: false,
        error: 'Username must be at least 3 characters long'
      };
    }

    if (updates.email && !updates.email.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      };
    }

    // Prepare update object
    const updateData: any = {};
    if (updates.username) updateData.username = updates.username.trim();
    if (updates.email) updateData.email = updates.email.toLowerCase().trim();

    // Check if email is already taken by another user
    if (updates.email) {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking email uniqueness:', checkError);
        return {
          success: false,
          error: 'Failed to validate email'
        };
      }

      if (existingUser) {
        return {
          success: false,
          error: 'This email is already in use by another account'
        };
      }
    }

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return {
        success: false,
        error: `Failed to update profile: ${updateError.message}`
      };
    }

    console.log('User profile updated successfully');
    return { success: true };

  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

export const updateUserPassword = async (
  userId: string,
  newPasswordPlain: string,
  currentUserId: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!isAdmin && userId !== currentUserId) {
      return { success: false, error: 'You do not have permission to update this password' };
    }

    if (newPasswordPlain.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    const hashedPassword = await hashPassword(newPasswordPlain);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user password:', updateError);
      return { success: false, error: `Failed to update password: ${updateError.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateUserPassword:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

export const createUserInDatabase = async (
  email: string,
  username: string,
  hashedPassword: string,
  role: 'admin' | 'user'
) => {
  try {
    console.log('Creating user in database:', { email, username, role });

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email,
        username: username,
        password_hash: hashedPassword,
        role: role,
        is_admin: role === 'admin',
        is_active: true
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating user in database:', error);
      return null;
    }

    console.log('User created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createUserInDatabase:', error);
    return null;
  }
};

export const findUserByEmail = async (email: string) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('❌ Supabase query error:', error);
      return null;
    }

    return users && users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Error in findUserByEmail:', error);
    return null;
  }
};

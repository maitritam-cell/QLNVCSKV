import { supabase } from '../lib/supabase';
import { UserAccount } from '../types';

export async function loginWithCloudIdentifier(
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('account-login', {
      body: { identifier, password }
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Không thể kết nối máy chủ xác thực.'
      };
    }

    if (data?.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    }

    if (data?.user) {
      return { success: true, user: data.user as UserAccount };
    }

    return {
      success: false,
      error: data?.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.'
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Lỗi kết nối hệ thống xác thực Cloud.' };
  }
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function signOutCloud(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCloudSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

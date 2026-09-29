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


export interface CloudAdminSetupInput {
  token: string;
  username: string;
  email: string;
  password: string;
  name: string;
  rank?: string;
  title?: string;
  phone?: string;
}

export async function signUpFirstCloudAdmin(input: CloudAdminSetupInput) {
  const signedUp = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: { full_name: input.name.trim() }
    }
  });

  if (signedUp.error) {
    return { success: false, error: signedUp.error.message };
  }

  if (!signedUp.data.session) {
    return {
      success: true,
      pending: true,
      message: 'Tài khoản đã được tạo. Hãy xác nhận email rồi mở lại ứng dụng để hoàn tất khởi tạo quản trị Cloud.'
    };
  }

  const claimed = await supabase.functions.invoke('claim-admin', {
    body: {
      token: input.token,
      username: input.username.trim(),
      name: input.name.trim(),
      rank: input.rank?.trim() || 'Trung tá',
      title: input.title?.trim() || 'Quản trị hệ thống',
      phone: input.phone?.trim() || ''
    }
  });

  if (claimed.error || !claimed.data?.ok) {
    return {
      success: false,
      error: claimed.data?.error || claimed.error?.message || 'Không thể tạo hồ sơ quản trị Cloud.'
    };
  }

  return { success: true, user: claimed.data.user as UserAccount };
}

export async function completePendingCloudAdmin(input: Omit<CloudAdminSetupInput, 'email' | 'password'>) {
  const result = await supabase.functions.invoke('claim-admin', {
    body: {
      token: input.token,
      username: input.username.trim(),
      name: input.name.trim(),
      rank: input.rank?.trim() || 'Trung tá',
      title: input.title?.trim() || 'Quản trị hệ thống',
      phone: input.phone?.trim() || ''
    }
  });
  if (result.error || !result.data?.ok) {
    return {
      success: false,
      error: result.data?.error || result.error?.message || 'Không thể hoàn tất hồ sơ quản trị Cloud.'
    };
  }
  return { success: true, user: result.data.user as UserAccount };
}

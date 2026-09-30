import { supabase } from '../lib/supabase';
import { UserAccount } from '../types';

export async function loginWithCloudIdentifier(
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    const snap = await getDocs(collection(db, 'accounts'));
    if (!snap.empty) {
      const { saveUserAccounts } = await import('../data/storage');
      const cloudAccounts = snap.docs.map((d) => d.data() as UserAccount);
      saveUserAccounts(cloudAccounts);
    }
  } catch (error) {
    console.warn('Cloud Firestore accounts sync on login:', error);
  }

  // Authenticate against up-to-date accounts
  const { authenticateUser } = await import('../data/storage');
  return authenticateUser(identifier, password);
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

export async function createCloudAccount(input: {
  username: string;
  email: string;
  password: string;
  name: string;
  rank: string;
  title: string;
  phone: string;
  role: 'admin' | 'officer';
  staffId?: string;
  assignedAreas?: string[];
}) {
  const isolatedClient = (await import('@supabase/supabase-js')).createClient(
    import.meta.env.VITE_SUPABASE_URL || 'https://gpukluiksejdpbbtiyze.supabase.co',
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_qvM58njlnFC00YXyfIEk0g_uvI1Dbf3',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  const created = await isolatedClient.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: { data: { full_name: input.name.trim() } }
  });

  if (created.error || !created.data.user) {
    return { success: false, error: created.error?.message || 'Không tạo được tài khoản xác thực.' };
  }

  const profile = await supabase.from('nv_profiles').insert({
    id: created.data.user.id,
    username: input.username.trim(),
    email: input.email.trim().toLowerCase(),
    full_name: input.name.trim(),
    rank: input.rank.trim(),
    title: input.title.trim(),
    phone: input.phone.trim(),
    role: input.role,
    staff_id: input.staffId || null,
    assigned_areas: input.assignedAreas || [],
    active: true
  });

  if (profile.error) {
    return {
      success: false,
      error: `Tài khoản Auth đã được tạo nhưng chưa tạo được hồ sơ Cloud: ${profile.error.message}`
    };
  }

  return {
    success: true,
    userId: created.data.user.id,
    emailConfirmed: Boolean(created.data.session)
  };
}

export async function updateCloudAccount(input: {
  id: string;
  username: string;
  email: string;
  name: string;
  rank: string;
  title: string;
  phone: string;
  role: 'admin' | 'officer';
  staffId?: string;
  assignedAreas?: string[];
  active?: boolean;
}) {
  const { error } = await supabase.from('nv_profiles').update({
    username: input.username.trim(),
    email: input.email.trim().toLowerCase(),
    full_name: input.name.trim(),
    rank: input.rank.trim(),
    title: input.title.trim(),
    phone: input.phone.trim(),
    role: input.role,
    staff_id: input.staffId || null,
    assigned_areas: input.assignedAreas || [],
    active: input.active !== false
  }).eq('id', input.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deactivateCloudAccount(id: string) {
  const { error } = await supabase.from('nv_profiles').update({ active: false }).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function sendCloudPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
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

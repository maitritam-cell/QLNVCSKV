import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}');
const adminKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const publishableKey = publishableKeys.default || Deno.env.get('SUPABASE_ANON_KEY');
const admin = createClient(Deno.env.get('SUPABASE_URL')!, adminKey!);
const authClient = createClient(Deno.env.get('SUPABASE_URL')!, publishableKey!);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function requireAdmin(req: Request) {
  const header = req.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  if (data.user.app_metadata?.role !== 'admin') return null;
  return data.user;
}

function toEmail(username: string, email?: string) {
  return (email || `${username}@qlnvcskv.local`).trim().toLowerCase();
}

async function findAuthUserByUsername(username: string) {
  const profile = await admin.from('nv_profiles').select('*').eq('username', username).maybeSingle();
  if (!profile.data) return null;
  const auth = await admin.auth.admin.getUserById(profile.data.id);
  return auth.data.user ? { profile: profile.data, user: auth.data.user } : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const actor = await requireAdmin(req);
    if (!actor) return json({ error: 'Không có quyền quản trị.' }, 403);

    const body = await req.json();
    const action = body.action;

    if (action === 'create') {
      const account = body.account;
      if (!account?.username || !account?.name || !account?.password) {
        return json({ error: 'Thiếu thông tin tài khoản.' }, 400);
      }
      const email = toEmail(account.username, account.email);
      const created = await admin.auth.admin.createUser({
        email,
        password: account.password,
        email_confirm: true,
        app_metadata: {
          role: account.role === 'admin' ? 'admin' : 'officer',
          staff_id: account.staffId || null
        },
        user_metadata: { full_name: account.name }
      });
      if (created.error || !created.data.user) {
        return json({ error: created.error?.message || 'Không tạo được tài khoản.' }, 409);
      }
      const user = created.data.user;
      const profile = await admin.from('nv_profiles').insert({
        id: user.id,
        username: account.username,
        full_name: account.name,
        rank: account.rank || '',
        title: account.title || '',
        phone: account.phone || '',
        role: account.role === 'admin' ? 'admin' : 'officer',
        staff_id: account.staffId || null,
        assigned_areas: account.assignedAreas || [],
        active: true
      });
      if (profile.error) {
        await admin.auth.admin.deleteUser(user.id);
        return json({ error: profile.error.message }, 500);
      }
      return json({ ok: true, id: user.id });
    }

    if (action === 'update' || action === 'reset') {
      const account = body.account;
      if (!account?.id) return json({ error: 'Thiếu mã tài khoản.' }, 400);
      const userPatch: any = {
        user_metadata: { full_name: account.name },
        app_metadata: {
          role: account.role === 'admin' ? 'admin' : 'officer',
          staff_id: account.staffId || null
        }
      };
      if (account.email) userPatch.email = account.email;
      if (account.password) userPatch.password = account.password;
      const updatedAuth = await admin.auth.admin.updateUserById(account.id, userPatch);
      if (updatedAuth.error) return json({ error: updatedAuth.error.message }, 409);

      const profile = await admin.from('nv_profiles').update({
        username: account.username,
        full_name: account.name,
        rank: account.rank || '',
        title: account.title || '',
        phone: account.phone || '',
        role: account.role === 'admin' ? 'admin' : 'officer',
        staff_id: account.staffId || null,
        assigned_areas: account.assignedAreas || [],
        active: account.active !== false
      }).eq('id', account.id);

      if (profile.error) return json({ error: profile.error.message }, 500);
      return json({ ok: true });
    }

    if (action === 'delete') {
      const id = String(body.id || '');
      if (!id || id === actor.id) return json({ error: 'Không thể xóa tài khoản hiện đang đăng nhập.' }, 400);
      const deleted = await admin.auth.admin.deleteUser(id);
      if (deleted.error) return json({ error: deleted.error.message }, 409);
      return json({ ok: true });
    }

    if (action === 'migrate') {
      const accounts = Array.isArray(body.accounts) ? body.accounts : [];
      let migrated = 0;
      for (const account of accounts) {
        if (!account?.username || !account?.name || !account?.password) continue;
        const existing = await findAuthUserByUsername(account.username);
        if (existing) {
          const updated = await admin.auth.admin.updateUserById(existing.user.id, {
            password: account.password,
            email: existing.user.email || toEmail(account.username, account.email),
            user_metadata: { full_name: account.name },
            app_metadata: {
              role: account.role === 'admin' ? 'admin' : 'officer',
              staff_id: account.staffId || null
            }
          });
          if (updated.error) continue;
          await admin.from('nv_profiles').update({
            username: account.username,
            full_name: account.name,
            rank: account.rank || '',
            title: account.title || '',
            phone: account.phone || '',
            role: account.role === 'admin' ? 'admin' : 'officer',
            staff_id: account.staffId || null,
            assigned_areas: account.assignedAreas || [],
            active: true
          }).eq('id', existing.user.id);
          migrated++;
          continue;
        }

        const created = await admin.auth.admin.createUser({
          email: toEmail(account.username, account.email),
          password: account.password,
          email_confirm: true,
          app_metadata: {
            role: account.role === 'admin' ? 'admin' : 'officer',
            staff_id: account.staffId || null
          },
          user_metadata: { full_name: account.name }
        });
        if (created.error || !created.data.user) continue;

        await admin.from('nv_profiles').insert({
          id: created.data.user.id,
          username: account.username,
          full_name: account.name,
          rank: account.rank || '',
          title: account.title || '',
          phone: account.phone || '',
          role: account.role === 'admin' ? 'admin' : 'officer',
          staff_id: account.staffId || null,
          assigned_areas: account.assignedAreas || [],
          active: true
        });
        migrated++;
      }
      return json({ ok: true, migrated });
    }

    return json({ error: 'Hành động không được hỗ trợ.' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: 'Lỗi quản trị tài khoản.' }, 500);
  }
});

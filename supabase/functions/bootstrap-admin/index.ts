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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { token, username, email, password, name, rank, title, phone } = await req.json();

    if (!token || !username || !email || !password || !name) {
      return json({ error: 'Thiếu thông tin khởi tạo quản trị.' }, 400);
    }
    if (String(password).length < 8) {
      return json({ error: 'Mật khẩu quản trị Cloud phải có ít nhất 8 ký tự.' }, 400);
    }

    const setup = await admin
      .from('nv_setup_tokens')
      .select('token, used_at')
      .eq('token', token)
      .maybeSingle();

    if (!setup.data || setup.data.used_at) {
      return json({ error: 'Mã khởi tạo không hợp lệ hoặc đã được sử dụng.' }, 403);
    }

    const created = await admin.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      email_confirm: true,
      app_metadata: {
        role: 'admin',
        staff_id: null
      },
      user_metadata: {
        full_name: String(name).trim()
      }
    });

    if (created.error || !created.data.user) {
      return json({ error: created.error?.message || 'Không tạo được tài khoản quản trị.' }, 409);
    }

    const user = created.data.user;
    const profile = await admin.from('nv_profiles').insert({
      id: user.id,
      username: String(username).trim(),
      full_name: String(name).trim(),
      rank: String(rank || 'Trung tá'),
      title: String(title || 'Quản trị hệ thống'),
      phone: String(phone || ''),
      role: 'admin',
      staff_id: null,
      assigned_areas: ['Toàn địa bàn'],
      active: true
    });

    if (profile.error) {
      await admin.auth.admin.deleteUser(user.id);
      return json({ error: 'Không tạo được hồ sơ quản trị.' }, 500);
    }

    await admin
      .from('nv_setup_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)
      .is('used_at', null);

    const signed = await authClient.auth.signInWithPassword({
      email: String(email).trim().toLowerCase(),
      password: String(password)
    });

    if (signed.error || !signed.data.session) {
      return json({ user: { id: user.id, username }, message: 'Đã tạo tài khoản. Hãy đăng nhập lại.' }, 200);
    }

    return json({
      session: signed.data.session,
      user: {
        id: user.id,
        username: String(username).trim(),
        password: '',
        role: 'admin',
        name: String(name).trim(),
        rank: String(rank || 'Trung tá'),
        title: String(title || 'Quản trị hệ thống'),
        phone: String(phone || ''),
        assignedAreas: ['Toàn địa bàn']
      }
    });
  } catch (error) {
    console.error(error);
    return json({ error: 'Lỗi khởi tạo quản trị Cloud.' }, 500);
  }
});

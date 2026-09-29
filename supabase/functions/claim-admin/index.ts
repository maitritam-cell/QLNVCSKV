import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}');
const secretKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const publishableKey = publishableKeys.default || Deno.env.get('SUPABASE_ANON_KEY');
const admin = createClient(Deno.env.get('SUPABASE_URL')!, secretKey!);
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
    const auth = req.headers.get('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return json({ error: 'Chưa đăng nhập tài khoản Cloud.' }, 401);

    const verified = await authClient.auth.getUser(token);
    if (verified.error || !verified.data.user) return json({ error: 'Phiên đăng nhập không hợp lệ.' }, 401);

    const { token: setupToken, username, name, rank, title, phone } = await req.json();
    if (!setupToken || !username || !name) return json({ error: 'Thiếu thông tin khởi tạo.' }, 400);

    const setup = await admin
      .from('nv_setup_tokens')
      .select('token, used_at')
      .eq('token', setupToken)
      .maybeSingle();

    if (!setup.data || setup.data.used_at) {
      return json({ error: 'Mã khởi tạo không hợp lệ hoặc đã được sử dụng.' }, 403);
    }

    const existing = await admin.from('nv_profiles').select('id').limit(1);
    if (existing.data && existing.data.length > 0) {
      return json({ error: 'Hệ thống Cloud đã được khởi tạo quản trị.' }, 409);
    }

    const profile = await admin.from('nv_profiles').insert({
      id: verified.data.user.id,
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

    if (profile.error) return json({ error: profile.error.message }, 500);

    await admin
      .from('nv_setup_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', setupToken);

    return json({
      ok: true,
      user: {
        id: verified.data.user.id,
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
    return json({ error: 'Lỗi khởi tạo hồ sơ quản trị Cloud.' }, 500);
  }
});

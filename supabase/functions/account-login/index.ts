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

function normalizedIdentifier(value: string) {
  return value.trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const { identifier, password } = await req.json();
    const id = normalizedIdentifier(String(identifier || ''));
    const pass = String(password || '');

    if (!id || !pass) return json({ error: 'Thiếu tên đăng nhập hoặc mật khẩu.' }, 400);

    let email = id;
    let profile: any = null;

    if (!id.includes('@')) {
      const byUsername = await admin
        .from('nv_profiles')
        .select('*')
        .eq('username', id)
        .eq('active', true)
        .maybeSingle();

      profile = byUsername.data;

      if (!profile) {
        const byPhone = await admin
          .from('nv_profiles')
          .select('*')
          .eq('phone', id)
          .eq('active', true)
          .maybeSingle();
        profile = byPhone.data;
      }

      if (!profile) return json({ error: 'Không tìm thấy tài khoản.' }, 401);

      const { data: authUser, error: authUserError } =
        await admin.auth.admin.getUserById(profile.id);

      if (authUserError || !authUser.user?.email) {
        return json({ error: 'Tài khoản xác thực chưa được khởi tạo.' }, 409);
      }
      email = authUser.user.email;
    }

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error || !data.session || !data.user) {
      return json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }, 401);
    }

    if (!profile) {
      const profileResult = await admin
        .from('nv_profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();
      profile = profileResult.data;
    }

    if (!profile || !profile.active) {
      await authClient.auth.signOut();
      return json({ error: 'Tài khoản chưa được cấu hình trong hệ thống QLNVCSKV.' }, 403);
    }

    return json({
      session: data.session,
      user: {
        id: profile.id,
        username: profile.username,
        password: '',
        role: profile.role,
        name: profile.full_name,
        rank: profile.rank,
        title: profile.title,
        phone: profile.phone,
        staffId: profile.staff_id || undefined,
        assignedAreas: profile.assigned_areas || []
      }
    });
  } catch (error) {
    console.error(error);
    return json({ error: 'Lỗi xác thực máy chủ.' }, 500);
  }
});

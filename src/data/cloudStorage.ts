import { supabase } from '../lib/supabase';
import {
  Staff,
  TaskCategoryConfig,
  ResidentialGroup,
  HKCCHRecord,
  MaTuyRecord,
  DCTTPRecord,
  DatDaiRecord,
  GenericTaskRecord,
  InformationPost,
  UserAccount
} from '../types';

export type CloudCache = {
  ready: boolean;
  userId: string | null;
  role: 'admin' | 'officer' | null;
  staffId: string | null;
  taskCategories: TaskCategoryConfig[];
  staff: Staff[];
  residentialGroups: ResidentialGroup[];
  hkcch: HKCCHRecord[];
  matuy: MaTuyRecord[];
  dcttp: DCTTPRecord[];
  datdai: DatDaiRecord[];
  genericTasks: GenericTaskRecord[];
  informationPosts: InformationPost[];
};

export const cloudCache: CloudCache = {
  ready: false,
  userId: null,
  role: null,
  staffId: null,
  taskCategories: [],
  staff: [],
  residentialGroups: [],
  hkcch: [],
  matuy: [],
  dcttp: [],
  datdai: [],
  genericTasks: [],
  informationPosts: []
};

export function isCloudReady(): boolean {
  return cloudCache.ready;
}

function sessionClaims(session: any) {
  const metadata = session?.user?.app_metadata || {};
  return {
    userId: session?.user?.id || null,
    role: metadata.role === 'admin' ? 'admin' : metadata.role === 'officer' ? 'officer' : null,
    staffId: typeof metadata.staff_id === 'string' ? metadata.staff_id : null
  } as const;
}

function dbTaskToRecords(row: any) {
  const base = {
    stt: Number(row.stt),
    toDanPho: row.to_dan_pho || '',
    canBoId: row.assignee_id || '',
    canBoName: row.assignee_name || undefined,
    isDone: row.status === 'done' || row.status === 'completed' || row.progress >= 100,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString().replace('T', ' ').slice(0, 16) : undefined,
    note: row.note || '',
    referenceTitle: row.reference_title || '',
    referenceLink: row.reference_link || ''
  };

  switch (row.task_type) {
    case 'hkcch':
      return {
        ...base,
        hoTen: row.person_name || '',
        soHoSo: row.case_number || '',
        isDone: row.status === 'done' || row.progress >= 100
      } as HKCCHRecord;
    case 'matuy':
      return {
        ...base,
        hoTen: row.person_name || '',
        namSinh: row.birth_year || '',
        soCMND: row.id_number || '',
        ketQuaTest: row.test_result || 'Chưa test',
        isDone: row.status === 'done' || row.progress >= 100
      } as MaTuyRecord;
    case 'dcttp':
      return {
        ...base,
        hoTen: row.person_name || '',
        tongNhanKhau: Number(row.target_count || 0),
        soLuongDaDieuChinh: Number(row.completed_count || 0),
        isDone: row.status === 'done' || row.completed_count >= row.target_count && row.target_count > 0
      } as DCTTPRecord;
    case 'datdai': {
      const extra = row.extra || {};
      return {
        ...base,
        chuHo: row.person_name || '',
        cmnd: row.id_number || '',
        namSinh: row.birth_year || '',
        diaChi: row.address || '',
        status: row.status || 'pending',
        statusText: row.status_text || '',
        cccd: extra.cccd || '',
        dob: extra.dob || '',
        wrongDetail: extra.wrongDetail || '',
        noInfoReason: extra.noInfoReason || '',
        isDone: row.status !== 'pending' || row.progress >= 100
      } as DatDaiRecord;
    }
    default:
      return {
        ...base,
        taskType: row.task_type,
        hoTen: row.person_name || '',
        soHoSo: row.case_number || '',
        info1: row.extra?.info1 || '',
        info2: row.extra?.info2 || ''
      } as GenericTaskRecord;
  }
}

function recordToDb(taskType: string, record: any) {
  const base = {
    task_type: taskType,
    stt: record.stt,
    person_name: record.hoTen || record.chuHo || '',
    case_number: record.soHoSo || '',
    birth_year: record.namSinh || '',
    id_number: record.soCMND || record.cmnd || '',
    address: record.diaChi || '',
    to_dan_pho: record.toDanPho || '',
    target_count: record.tongNhanKhau ?? null,
    completed_count: record.soLuongDaDieuChinh ?? (record.isDone ? 1 : 0),
    status:
      taskType === 'datdai'
        ? record.status || (record.isDone ? 'cccd_updated' : 'pending')
        : record.isDone
        ? 'done'
        : 'pending',
    status_text: record.statusText || '',
    test_result: record.ketQuaTest || null,
    note: record.note || '',
    reference_title: record.referenceTitle || '',
    reference_link: record.referenceLink || '',
    assignee_id: record.canBoId || null,
    assignee_name: record.canBoName || '',
    description: record.description || '',
    due_date: record.dueDate || null,
    priority: record.priority || 'normal',
    task_group: record.taskGroup || 'regular',
    extra: {
      ...(record.extra || {}),
      info1: record.info1 || '',
      info2: record.info2 || '',
      cccd: record.cccd || '',
      dob: record.dob || '',
      wrongDetail: record.wrongDetail || '',
      noInfoReason: record.noInfoReason || ''
    },
    updated_at: new Date().toISOString()
  };
  return base;
}

export async function initializeCloudStorage(): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return false;

  const claims = sessionClaims(data.session);
  cloudCache.userId = claims.userId;
  cloudCache.role = claims.role;
  cloudCache.staffId = claims.staffId;

  const [categories, staff, groups, tasks, posts] = await Promise.all([
    supabase.from('nv_task_categories').select('*').order('created_at'),
    supabase.from('nv_staff').select('*').order('id'),
    supabase.from('nv_residential_groups').select('*').order('name'),
    supabase.from('nv_task_records').select('*').order('task_type').order('stt'),
    supabase.from('nv_information_posts').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
  ]);

  if (categories.error || staff.error || groups.error || tasks.error || posts.error) {
    console.error('Supabase initialization failed', {
      categories: categories.error,
      staff: staff.error,
      groups: groups.error,
      tasks: tasks.error,
      posts: posts.error
    });
    return false;
  }

  cloudCache.taskCategories = (categories.data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    shortTitle: row.short_title,
    unit: row.unit,
    badge: row.badge,
    color: row.color,
    isCustom: row.is_custom
  }));

  cloudCache.staff = (staff.data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    rank: row.rank,
    phone: row.phone,
    assignedAreas: row.assigned_areas || [],
    isNoArea: row.is_no_area,
    roleDescription: row.role_description || undefined,
    avatarBg: row.avatar_bg || undefined
  }));

  cloudCache.residentialGroups = (groups.data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    code: row.code || undefined,
    assignedStaffIds: row.assigned_staff_ids || [],
    householdCount: row.household_count || undefined,
    populationCount: row.population_count || undefined,
    note: row.note || undefined
  }));

  const grouped = {
    hkcch: [] as HKCCHRecord[],
    matuy: [] as MaTuyRecord[],
    dcttp: [] as DCTTPRecord[],
    datdai: [] as DatDaiRecord[],
    generic: [] as GenericTaskRecord[]
  };

  for (const row of tasks.data || []) {
    const mapped = dbTaskToRecords(row);
    if (row.task_type === 'hkcch') grouped.hkcch.push(mapped);
    else if (row.task_type === 'matuy') grouped.matuy.push(mapped);
    else if (row.task_type === 'dcttp') grouped.dcttp.push(mapped);
    else if (row.task_type === 'datdai') grouped.datdai.push(mapped);
    else grouped.generic.push(mapped);
  }

  cloudCache.hkcch = grouped.hkcch;
  cloudCache.matuy = grouped.matuy;
  cloudCache.dcttp = grouped.dcttp;
  cloudCache.datdai = grouped.datdai;
  cloudCache.genericTasks = grouped.generic;

  cloudCache.informationPosts = (posts.data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    link: row.link || undefined,
    taskType: row.task_type || undefined,
    isPinned: Boolean(row.is_pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by || undefined
  }));

  cloudCache.ready = true;
  return true;
}

export async function persistStaff(list: Staff[]) {
  cloudCache.staff = list;
  if (!cloudCache.ready || cloudCache.role !== 'admin') return;
  const rows = list.map((s) => ({
    id: s.id,
    name: s.name,
    rank: s.rank || '',
    phone: s.phone || '',
    assigned_areas: s.assignedAreas || [],
    is_no_area: Boolean(s.isNoArea),
    role_description: s.roleDescription || null,
    avatar_bg: s.avatarBg || null
  }));
  const { error } = await supabase.from('nv_staff').upsert(rows, { onConflict: 'id' });
  if (error) console.error('Supabase staff save failed', error);
}

export async function persistResidentialGroups(list: ResidentialGroup[]) {
  cloudCache.residentialGroups = list;
  if (!cloudCache.ready || cloudCache.role !== 'admin') return;
  const existing = await supabase.from('nv_residential_groups').select('id');
  if (existing.data) {
    const ids = new Set(list.map((g) => g.id));
    const remove = existing.data.filter((r: any) => !ids.has(r.id)).map((r: any) => r.id);
    if (remove.length) await supabase.from('nv_residential_groups').delete().in('id', remove);
  }
  const rows = list.map((g) => ({
    id: g.id,
    name: g.name,
    code: g.code || null,
    assigned_staff_ids: g.assignedStaffIds || [],
    household_count: g.householdCount ?? null,
    population_count: g.populationCount ?? null,
    note: g.note || null
  }));
  const { error } = await supabase.from('nv_residential_groups').upsert(rows, { onConflict: 'id' });
  if (error) console.error('Supabase TDP save failed', error);
}

export async function persistTaskCategories(list: TaskCategoryConfig[]) {
  cloudCache.taskCategories = list;
  if (!cloudCache.ready || cloudCache.role !== 'admin') return;
  const { data: current } = await supabase.from('nv_task_categories').select('id');
  if (current) {
    const ids = new Set(list.map((c) => c.id));
    const remove = current.filter((r: any) => !ids.has(r.id)).map((r: any) => r.id);
    if (remove.length) await supabase.from('nv_task_categories').delete().in('id', remove);
  }
  const rows = list.map((c) => ({
    id: c.id,
    title: c.title,
    short_title: c.shortTitle,
    unit: c.unit,
    badge: c.badge,
    color: c.color,
    is_custom: Boolean(c.isCustom)
  }));
  const { error } = await supabase.from('nv_task_categories').upsert(rows, { onConflict: 'id' });
  if (error) console.error('Supabase task category save failed', error);
}

export async function persistTaskList(taskType: string, list: any[]) {
  if (!cloudCache.ready) return;
  if (cloudCache.role !== 'admin') {
    const own = list.filter((r) => r.canBoId === cloudCache.staffId);
    const { error } = await supabase
      .from('nv_task_records')
      .upsert(own.map((r) => recordToDb(taskType, r)), { onConflict: 'task_type,stt' });
    if (error) console.error('Supabase officer task update failed', error);
    return;
  }

  const rows = list.map((r) => recordToDb(taskType, r));
  const { data: current } = await supabase.from('nv_task_records').select('stt').eq('task_type', taskType);
  if (current) {
    const stts = new Set(list.map((r) => Number(r.stt)));
    const remove = current.filter((r: any) => !stts.has(Number(r.stt))).map((r: any) => r.stt);
    if (remove.length) await supabase.from('nv_task_records').delete().eq('task_type', taskType).in('stt', remove);
  }
  const { error } = rows.length
    ? await supabase.from('nv_task_records').upsert(rows, { onConflict: 'task_type,stt' })
    : await supabase.from('nv_task_records').delete().eq('task_type', taskType);
  if (error) console.error('Supabase task save failed', error);
}

export async function persistInformationPosts(list: InformationPost[]) {
  cloudCache.informationPosts = list;
  if (!cloudCache.ready || cloudCache.role !== 'admin') return;
  const current = await supabase.from('nv_information_posts').select('id');
  if (current.data) {
    const ids = new Set(list.map((p) => p.id));
    const remove = current.data.filter((r: any) => !ids.has(r.id)).map((r: any) => r.id);
    if (remove.length) await supabase.from('nv_information_posts').delete().in('id', remove);
  }
  const rows = list.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    content: p.content,
    link: p.link || null,
    task_type: p.taskType || null,
    is_pinned: Boolean(p.isPinned),
    created_by: cloudCache.userId,
    created_at: p.createdAt || new Date().toISOString()
  }));
  const { error } = await supabase.from('nv_information_posts').upsert(rows, { onConflict: 'id' });
  if (error) console.error('Supabase information post save failed', error);
}

export async function persistSetting(key: string, value: unknown) {
  if (!cloudCache.ready || cloudCache.role !== 'admin') return;
  const { error } = await supabase.from('nv_app_settings').upsert({
    key,
    value,
    updated_by: cloudCache.userId
  }, { onConflict: 'key' });
  if (error) console.error('Supabase setting save failed', error);
}

export async function migrateLocalDataToCloud(): Promise<{ ok: boolean; message: string }> {
  const raw = {
    taskCategories: localStorage.getItem('nhiemvu_task_categories_v2'),
    staff: localStorage.getItem('nhiemvu_staff_list_v1'),
    residentialGroups: localStorage.getItem('nhiemvu_residential_groups_v1'),
    hkcch: localStorage.getItem('nhiemvu_hkcch_list_v1'),
    matuy: localStorage.getItem('nhiemvu_matuy_list_v1'),
    dcttp: localStorage.getItem('nhiemvu_dcttp_list_v1'),
    datdai: localStorage.getItem('nhiemvu_datdai_list_v1'),
    genericTasks: localStorage.getItem('nhiemvu_generic_tasks_v2'),
    informationPosts: localStorage.getItem('qlnv_informational_posts'),
    config: localStorage.getItem('nhiemvu_app_config_v1')
  };

  try {
    if (raw.taskCategories) await persistTaskCategories(JSON.parse(raw.taskCategories));
    if (raw.staff) await persistStaff(JSON.parse(raw.staff));
    if (raw.residentialGroups) await persistResidentialGroups(JSON.parse(raw.residentialGroups));
    if (raw.hkcch) await persistTaskList('hkcch', JSON.parse(raw.hkcch));
    if (raw.matuy) await persistTaskList('matuy', JSON.parse(raw.matuy));
    if (raw.dcttp) await persistTaskList('dcttp', JSON.parse(raw.dcttp));
    if (raw.datdai) await persistTaskList('datdai', JSON.parse(raw.datdai));
    if (raw.genericTasks) {
      const generic = JSON.parse(raw.genericTasks);
      const byType = new Map<string, any[]>();
      generic.forEach((r: any) => {
        if (!byType.has(r.taskType)) byType.set(r.taskType, []);
        byType.get(r.taskType)!.push(r);
      });
      for (const [type, records] of byType) await persistTaskList(type, records);
    }
    if (raw.informationPosts) await persistInformationPosts(JSON.parse(raw.informationPosts));
    if (raw.config) await persistSetting('app_config', JSON.parse(raw.config));

    return { ok: true, message: 'Đã chuyển dữ liệu cục bộ lên Supabase.' };
  } catch (error) {
    console.error(error);
    return { ok: false, message: 'Không thể chuyển toàn bộ dữ liệu cục bộ.' };
  }
}

export async function fetchCurrentProfile(): Promise<UserAccount | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  const userId = sessionData.session.user.id;
  const { data, error } = await supabase
    .from('nv_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    username: data.username,
    password: '',
    role: data.role,
    name: data.full_name,
    rank: data.rank,
    title: data.title,
    phone: data.phone,
    staffId: data.staff_id || undefined,
    assignedAreas: data.assigned_areas || []
  };
}

export function clearCloudCache() {
  cloudCache.ready = false;
  cloudCache.userId = null;
  cloudCache.role = null;
  cloudCache.staffId = null;
  cloudCache.taskCategories = [];
  cloudCache.staff = [];
  cloudCache.residentialGroups = [];
  cloudCache.hkcch = [];
  cloudCache.matuy = [];
  cloudCache.dcttp = [];
  cloudCache.datdai = [];
  cloudCache.genericTasks = [];
  cloudCache.informationPosts = [];
}

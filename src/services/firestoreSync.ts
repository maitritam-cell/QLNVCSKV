import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocFromServer,
  DocumentReference
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Staff,
  HKCCHRecord,
  MaTuyRecord,
  DCTTPRecord,
  DatDaiRecord,
  GenericTaskRecord,
  ResidentialGroup,
  TaskCategoryConfig,
  UserAccount,
  AppConfig
} from '../types';
import {
  getStaffList,
  saveStaffList,
  getHkcchList,
  saveHkcchList,
  getMatuyList,
  saveMatuyList,
  getDcttpList,
  saveDcttpList,
  getDatdaiList,
  saveDatdaiList,
  getGenericTasksList,
  saveGenericTasksList,
  getResidentialGroups,
  saveResidentialGroups,
  getTaskCategories,
  saveTaskCategories,
  getUserAccounts,
  saveUserAccounts,
  getConfig,
  saveConfig,
  getCurrentUser,
  setCurrentUser,
  registerStorageChangeHandler,
  setStorageSyncSuppressed
} from '../data/storage';

export interface CloudSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  pendingChanges: number;
}

let currentStatus: CloudSyncStatus = {
  isConnected: false,
  isSyncing: false,
  lastSyncedAt: null,
  errorMessage: null,
  pendingChanges: 0
};

const statusListeners: Array<(status: CloudSyncStatus) => void> = [];

/**
 * Synchronizes a client collection to Firestore:
 * - Upserts all items currently present in `items`
 * - DELETES any document in Firestore that was removed by the user
 */
async function syncCollectionWithFirestore(
  collectionName: string,
  items: any[],
  getId: (item: any) => string
): Promise<void> {
  const desiredMap = new Map<string, any>();
  for (const item of items) {
    desiredMap.set(getId(item), item);
  }

  // 1. Fetch current documents in Firestore
  const snap = await getDocs(collection(db, collectionName));
  const docsToDelete: DocumentReference[] = [];

  for (const docSnap of snap.docs) {
    if (!desiredMap.has(docSnap.id)) {
      docsToDelete.push(docSnap.ref);
    }
  }

  // 2. Commit batch operations (max 400 per batch)
  let batch = writeBatch(db);
  let opCount = 0;

  for (const docRef of docsToDelete) {
    batch.delete(docRef);
    opCount++;
    if (opCount >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  for (const [id, item] of desiredMap.entries()) {
    batch.set(doc(db, collectionName, id), item);
    opCount++;
    if (opCount >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }
}

// Automatic background sync hook to Firestore on every storage mutation
registerStorageChangeHandler(async (entity, data) => {
  try {
    if (entity === 'residential_groups' && Array.isArray(data)) {
      await syncCollectionWithFirestore('residential_groups', data, (item) => item.id);
    } else if (entity === 'staff' && Array.isArray(data)) {
      await syncCollectionWithFirestore('staff', data, (item) => item.id);
    } else if (entity === 'hkcch' && Array.isArray(data)) {
      await syncCollectionWithFirestore('hkcch', data, (item) => `hk_${item.stt}`);
    } else if (entity === 'matuy' && Array.isArray(data)) {
      await syncCollectionWithFirestore('matuy', data, (item) => `mt_${item.stt}`);
    } else if (entity === 'dcttp' && Array.isArray(data)) {
      await syncCollectionWithFirestore('dcttp', data, (item) => `dc_${item.stt}`);
    } else if (entity === 'datdai' && Array.isArray(data)) {
      await syncCollectionWithFirestore('datdai', data, (item) => `dd_${item.stt}`);
    } else if (entity === 'generic_tasks' && Array.isArray(data)) {
      await syncCollectionWithFirestore(
        'generic_tasks',
        data,
        (item) => `gen_${item.taskType}_${item.stt}`
      );
    } else if (entity === 'task_categories' && Array.isArray(data)) {
      await syncCollectionWithFirestore('task_categories', data, (item) => item.id);
    } else if (entity === 'accounts' && Array.isArray(data)) {
      await syncCollectionWithFirestore('accounts', data, (item) => item.id);
    } else if (entity === 'config' && data) {
      await setDoc(doc(db, 'app_config', 'main'), data);
    }
    updateStatus({ lastSyncedAt: new Date() });
  } catch (err) {
    console.warn(`Background cloud sync to Firestore (${entity}):`, err);
  }
});

export function subscribeSyncStatus(listener: (status: CloudSyncStatus) => void): () => void {
  statusListeners.push(listener);
  listener({ ...currentStatus });
  return () => {
    const idx = statusListeners.indexOf(listener);
    if (idx !== -1) statusListeners.splice(idx, 1);
  };
}

function updateStatus(partial: Partial<CloudSyncStatus>) {
  currentStatus = { ...currentStatus, ...partial };
  statusListeners.forEach((fn) => {
    try {
      fn({ ...currentStatus });
    } catch (e) {
      console.error('Error notifying sync listener', e);
    }
  });
}

export function getSyncStatus(): CloudSyncStatus {
  return { ...currentStatus };
}

/**
 * Checks connection and initializes real-time listeners or initial fetch from Firestore
 */
export async function initializeFirestoreSync(onRemoteUpdate?: () => void): Promise<void> {
  updateStatus({ isSyncing: true, errorMessage: null });
  try {
    // 1. Verify connection
    await getDocFromServer(doc(db, 'app_state', 'healthcheck')).catch(() => {
      // It's normal if document does not exist yet
    });

    updateStatus({ isConnected: true });

    // 2. Check if Firestore already has staff documents
    const staffColRef = collection(db, 'staff');
    const staffSnap = await getDocs(staffColRef);

    if (staffSnap.empty) {
      // First-time database setup: migrate local/initial data up to Firestore
      console.log('Firebase Firestore is empty. Initializing cloud database with seed data...');
      await uploadAllLocalDataToFirestore();
    } else {
      // Pull data from cloud and update storage
      await pullAllDataFromFirestore();
    }

    // 3. Setup real-time listeners on main collections
    setupRealtimeListeners(onRemoteUpdate);

    updateStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncedAt: new Date(),
      errorMessage: null
    });
  } catch (error) {
    console.error('Failed to initialize Firestore cloud sync:', error);
    updateStatus({
      isSyncing: false,
      errorMessage: error instanceof Error ? error.message : 'Lỗi kết nối cơ sở dữ liệu'
    });
  }
}

/**
 * Uploads all local data to Firestore cloud database and deletes any stale documents
 */
export async function uploadAllLocalDataToFirestore(): Promise<void> {
  updateStatus({ isSyncing: true });
  try {
    await syncCollectionWithFirestore('staff', getStaffList(), (item) => item.id);
    await syncCollectionWithFirestore('residential_groups', getResidentialGroups(), (item) => item.id);
    await syncCollectionWithFirestore('task_categories', getTaskCategories(), (item) => item.id);
    await syncCollectionWithFirestore('accounts', getUserAccounts(), (item) => item.id);
    await syncCollectionWithFirestore('hkcch', getHkcchList(), (item) => `hk_${item.stt}`);
    await syncCollectionWithFirestore('matuy', getMatuyList(), (item) => `mt_${item.stt}`);
    await syncCollectionWithFirestore('dcttp', getDcttpList(), (item) => `dc_${item.stt}`);
    await syncCollectionWithFirestore('datdai', getDatdaiList(), (item) => `dd_${item.stt}`);
    await syncCollectionWithFirestore(
      'generic_tasks',
      getGenericTasksList(),
      (item) => `gen_${item.taskType}_${item.stt}`
    );

    await setDoc(doc(db, 'app_config', 'main'), getConfig());

    await setDoc(doc(db, 'app_state', 'metadata'), {
      syncedAt: new Date().toISOString(),
      version: '1.0.0',
      description: 'Hệ thống Quản lý Nhiệm vụ Công tác Công an Phường'
    });

    updateStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncedAt: new Date(),
      errorMessage: null
    });
  } catch (error) {
    updateStatus({ isSyncing: false });
    handleFirestoreError(error, OperationType.WRITE, 'all_collections');
  }
}

export async function syncAllLocalToFirestore(): Promise<{ ok: boolean; message: string }> {
  try {
    await uploadAllLocalDataToFirestore();
    return { ok: true, message: 'Đã đồng bộ sạch sẽ dữ liệu hiện tại lên máy chủ Cloud!' };
  } catch (err) {
    return {
      ok: false,
      message: 'Không thể đồng bộ: ' + (err instanceof Error ? err.message : String(err))
    };
  }
}

/**
 * Pulls all records from Firestore down into client storage
 */
export async function pullAllDataFromFirestore(): Promise<void> {
  updateStatus({ isSyncing: true });
  setStorageSyncSuppressed(true);
  try {
    // 1. Staff
    const staffSnap = await getDocs(collection(db, 'staff'));
    if (!staffSnap.empty) {
      const staffList = staffSnap.docs.map((d) => d.data() as Staff);
      saveStaffList(staffList);
    }

    // 2. Residential Groups
    const groupsSnap = await getDocs(collection(db, 'residential_groups'));
    if (!groupsSnap.empty) {
      const groups = groupsSnap.docs.map((d) => d.data() as ResidentialGroup);
      saveResidentialGroups(groups);
    }

    // 3. Task Categories
    const catSnap = await getDocs(collection(db, 'task_categories'));
    if (!catSnap.empty) {
      const categories = catSnap.docs.map((d) => d.data() as TaskCategoryConfig);
      saveTaskCategories(categories);
    }

    // 4. Accounts
    const accSnap = await getDocs(collection(db, 'accounts'));
    if (!accSnap.empty) {
      const accounts = accSnap.docs.map((d) => d.data() as UserAccount);
      saveUserAccounts(accounts);
    }

    // 5. Tasks - load the exact collection snapshot from Firestore
    const hkcchSnap = await getDocs(collection(db, 'hkcch'));
    const hkList = hkcchSnap.docs.map((d) => d.data() as HKCCHRecord);
    hkList.sort((a, b) => a.stt - b.stt);
    saveHkcchList(hkList);

    const matuySnap = await getDocs(collection(db, 'matuy'));
    const mtList = matuySnap.docs.map((d) => d.data() as MaTuyRecord);
    mtList.sort((a, b) => a.stt - b.stt);
    saveMatuyList(mtList);

    const dcttpSnap = await getDocs(collection(db, 'dcttp'));
    const dcList = dcttpSnap.docs.map((d) => d.data() as DCTTPRecord);
    dcList.sort((a, b) => a.stt - b.stt);
    saveDcttpList(dcList);

    const datdaiSnap = await getDocs(collection(db, 'datdai'));
    const ddList = datdaiSnap.docs.map((d) => d.data() as DatDaiRecord);
    ddList.sort((a, b) => a.stt - b.stt);
    saveDatdaiList(ddList);

    const genSnap = await getDocs(collection(db, 'generic_tasks'));
    const genList = genSnap.docs.map((d) => d.data() as GenericTaskRecord);
    saveGenericTasksList(genList);

    // 6. App Config
    try {
      const cfgSnap = await getDocs(collection(db, 'app_config'));
      const mainDoc = cfgSnap.docs.find((d) => d.id === 'main');
      if (mainDoc && mainDoc.exists()) {
        saveConfig(mainDoc.data() as AppConfig);
      }
    } catch {
      // Continue gracefully
    }

    updateStatus({
      isConnected: true,
      isSyncing: false,
      lastSyncedAt: new Date(),
      errorMessage: null
    });
  } catch (error) {
    updateStatus({ isSyncing: false });
    handleFirestoreError(error, OperationType.GET, 'all_collections');
  } finally {
    setStorageSyncSuppressed(false);
  }
}

/**
 * Sets up Firestore real-time listeners for live collaborative updates
 */
function setupRealtimeListeners(onRemoteUpdate?: () => void) {
  // Listen to residential groups
  onSnapshot(
    collection(db, 'residential_groups'),
    (snap) => {
      const groups = snap.docs.map((d) => d.data() as ResidentialGroup);
      if (groups.length > 0) {
        setStorageSyncSuppressed(true);
        saveResidentialGroups(groups);
        setStorageSyncSuppressed(false);
        updateStatus({ lastSyncedAt: new Date() });
        if (onRemoteUpdate) onRemoteUpdate();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'residential_groups');
    }
  );

  // Listen to staff
  onSnapshot(
    collection(db, 'staff'),
    (snap) => {
      const staffList = snap.docs.map((d) => d.data() as Staff);
      if (staffList.length > 0) {
        setStorageSyncSuppressed(true);
        saveStaffList(staffList);
        setStorageSyncSuppressed(false);
        updateStatus({ lastSyncedAt: new Date() });
        if (onRemoteUpdate) onRemoteUpdate();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'staff');
    }
  );

  // Listen to task categories
  onSnapshot(
    collection(db, 'task_categories'),
    (snap) => {
      const categories = snap.docs.map((d) => d.data() as TaskCategoryConfig);
      if (categories.length > 0) {
        setStorageSyncSuppressed(true);
        saveTaskCategories(categories);
        setStorageSyncSuppressed(false);
        updateStatus({ lastSyncedAt: new Date() });
        if (onRemoteUpdate) onRemoteUpdate();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'task_categories');
    }
  );

  // Listen to HKCCH
  onSnapshot(
    collection(db, 'hkcch'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as HKCCHRecord);
      list.sort((a, b) => a.stt - b.stt);
      setStorageSyncSuppressed(true);
      saveHkcchList(list);
      setStorageSyncSuppressed(false);
      updateStatus({ lastSyncedAt: new Date() });
      if (onRemoteUpdate) onRemoteUpdate();
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'hkcch');
    }
  );

  // Listen to Ma Tuy
  onSnapshot(
    collection(db, 'matuy'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as MaTuyRecord);
      list.sort((a, b) => a.stt - b.stt);
      setStorageSyncSuppressed(true);
      saveMatuyList(list);
      setStorageSyncSuppressed(false);
      updateStatus({ lastSyncedAt: new Date() });
      if (onRemoteUpdate) onRemoteUpdate();
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'matuy');
    }
  );

  // Listen to DCTTP
  onSnapshot(
    collection(db, 'dcttp'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as DCTTPRecord);
      list.sort((a, b) => a.stt - b.stt);
      setStorageSyncSuppressed(true);
      saveDcttpList(list);
      setStorageSyncSuppressed(false);
      updateStatus({ lastSyncedAt: new Date() });
      if (onRemoteUpdate) onRemoteUpdate();
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'dcttp');
    }
  );

  // Listen to Dat Dai
  onSnapshot(
    collection(db, 'datdai'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as DatDaiRecord);
      list.sort((a, b) => a.stt - b.stt);
      setStorageSyncSuppressed(true);
      saveDatdaiList(list);
      setStorageSyncSuppressed(false);
      updateStatus({ lastSyncedAt: new Date() });
      if (onRemoteUpdate) onRemoteUpdate();
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'datdai');
    }
  );

  // Listen to Generic Tasks
  onSnapshot(
    collection(db, 'generic_tasks'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as GenericTaskRecord);
      setStorageSyncSuppressed(true);
      saveGenericTasksList(list);
      setStorageSyncSuppressed(false);
      updateStatus({ lastSyncedAt: new Date() });
      if (onRemoteUpdate) onRemoteUpdate();
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'generic_tasks');
    }
  );

  // Listen to App Config
  onSnapshot(
    collection(db, 'app_config'),
    (snap) => {
      const mainDoc = snap.docs.find((d) => d.id === 'main');
      if (mainDoc && mainDoc.exists()) {
        setStorageSyncSuppressed(true);
        saveConfig(mainDoc.data() as AppConfig);
        setStorageSyncSuppressed(false);
        if (onRemoteUpdate) onRemoteUpdate();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'app_config');
    }
  );

  // Listen to Accounts
  onSnapshot(
    collection(db, 'accounts'),
    (snap) => {
      if (!snap.empty) {
        const accounts = snap.docs.map((d) => d.data() as UserAccount);
        setStorageSyncSuppressed(true);
        saveUserAccounts(accounts);
        const curr = getCurrentUser();
        if (curr) {
          const matched = accounts.find((a) => a.id === curr.id);
          if (matched) {
            setCurrentUser(matched);
          }
        }
        setStorageSyncSuppressed(false);
        if (onRemoteUpdate) onRemoteUpdate();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'accounts');
    }
  );
}

// -------------------------------------------------------------
// Cloud Mutation Helpers (Call whenever app modifies entities)
// -------------------------------------------------------------

export async function cloudUpdateAccountPassword(
  userId: string,
  newPassword: string
): Promise<boolean> {
  try {
    const { changeUserPassword, getUserAccounts } = await import('../data/storage');
    changeUserPassword(userId, newPassword);
    const accounts = getUserAccounts();
    const acc = accounts.find((a) => a.id === userId);
    if (acc) {
      await setDoc(doc(db, 'accounts', userId), acc);
    }
    return true;
  } catch (err) {
    console.error('Failed to update account password in Firestore:', err);
    return false;
  }
}

export async function cloudSaveStaff(staff: Staff): Promise<void> {
  try {
    await setDoc(doc(db, 'staff', staff.id), staff);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `staff/${staff.id}`);
  }
}

export async function cloudDeleteStaff(staffId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'staff', staffId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `staff/${staffId}`);
  }
}

export async function cloudSaveResidentialGroup(group: ResidentialGroup): Promise<void> {
  try {
    await setDoc(doc(db, 'residential_groups', group.id), group);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `residential_groups/${group.id}`);
  }
}

export async function cloudDeleteResidentialGroup(groupId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'residential_groups', groupId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `residential_groups/${groupId}`);
  }
}

export async function cloudSaveTaskRecord(
  collectionName: 'hkcch' | 'matuy' | 'dcttp' | 'datdai' | 'generic_tasks',
  id: string,
  record: any
): Promise<void> {
  try {
    await setDoc(doc(db, collectionName, id), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${id}`);
  }
}

export async function cloudDeleteTaskRecord(
  collectionName: 'hkcch' | 'matuy' | 'dcttp' | 'datdai' | 'generic_tasks',
  id: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

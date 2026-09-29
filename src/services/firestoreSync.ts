import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocFromServer
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
  UserAccount
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
  registerStorageChangeHandler
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

// Automatic background sync hook to Firestore on every storage mutation
registerStorageChangeHandler(async (entity, data) => {
  try {
    if (entity === 'residential_groups' && Array.isArray(data)) {
      const batch = writeBatch(db);
      for (const item of data) {
        batch.set(doc(db, 'residential_groups', item.id), item);
      }
      await batch.commit();
    } else if (entity === 'staff' && Array.isArray(data)) {
      const batch = writeBatch(db);
      for (const item of data) {
        batch.set(doc(db, 'staff', item.id), item);
      }
      await batch.commit();
    } else if (entity === 'hkcch' && Array.isArray(data)) {
      const batch = writeBatch(db);
      for (const item of data) {
        batch.set(doc(db, 'hkcch', `hk_${item.stt}`), item);
      }
      await batch.commit();
    } else if (entity === 'matuy' && Array.isArray(data)) {
      const batch = writeBatch(db);
      for (const item of data) {
        batch.set(doc(db, 'matuy', `mt_${item.stt}`), item);
      }
      await batch.commit();
    } else if (entity === 'dcttp' && Array.isArray(data)) {
      const batch = writeBatch(db);
      for (const item of data) {
        batch.set(doc(db, 'dcttp', `dc_${item.stt}`), item);
      }
      await batch.commit();
    } else if (entity === 'datdai' && Array.isArray(data)) {
      const batch = writeBatch(db);
      for (const item of data) {
        batch.set(doc(db, 'datdai', `dd_${item.stt}`), item);
      }
      await batch.commit();
    } else if (entity === 'generic_tasks' && Array.isArray(data)) {
      const batch = writeBatch(db);
      for (const item of data) {
        batch.set(doc(db, 'generic_tasks', `gen_${item.taskType}_${item.stt}`), item);
      }
      await batch.commit();
    } else if (entity === 'task_categories' && Array.isArray(data)) {
      const batch = writeBatch(db);
      for (const item of data) {
        batch.set(doc(db, 'task_categories', item.id), item);
      }
      await batch.commit();
    } else if (entity === 'accounts' && Array.isArray(data)) {
      const batch = writeBatch(db);
      for (const item of data) {
        batch.set(doc(db, 'accounts', item.id), item);
      }
      await batch.commit();
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
 * Uploads all local data to Firestore cloud database
 */
export async function uploadAllLocalDataToFirestore(): Promise<void> {
  updateStatus({ isSyncing: true });
  try {
    const batch = writeBatch(db);

    // 1. Staff
    const staff = getStaffList();
    for (const item of staff) {
      batch.set(doc(db, 'staff', item.id), item);
    }

    // 2. Residential Groups
    const groups = getResidentialGroups();
    for (const item of groups) {
      batch.set(doc(db, 'residential_groups', item.id), item);
    }

    // 3. Task Categories
    const categories = getTaskCategories();
    for (const item of categories) {
      batch.set(doc(db, 'task_categories', item.id), item);
    }

    // 4. Accounts
    const accounts = getUserAccounts();
    for (const item of accounts) {
      batch.set(doc(db, 'accounts', item.id), item);
    }

    // 5. HKCCH
    const hkcch = getHkcchList();
    for (const item of hkcch) {
      batch.set(doc(db, 'hkcch', `hk_${item.stt}`), item);
    }

    // 6. Matuy
    const matuy = getMatuyList();
    for (const item of matuy) {
      batch.set(doc(db, 'matuy', `mt_${item.stt}`), item);
    }

    // 7. DCTTP
    const dcttp = getDcttpList();
    for (const item of dcttp) {
      batch.set(doc(db, 'dcttp', `dc_${item.stt}`), item);
    }

    // 8. Datdai
    const datdai = getDatdaiList();
    for (const item of datdai) {
      batch.set(doc(db, 'datdai', `dd_${item.stt}`), item);
    }

    // 9. Generic Tasks
    const genericTasks = getGenericTasksList();
    for (const item of genericTasks) {
      batch.set(doc(db, 'generic_tasks', `gen_${item.taskType}_${item.stt}`), item);
    }

    // App state metadata
    batch.set(doc(db, 'app_state', 'metadata'), {
      syncedAt: new Date().toISOString(),
      version: '1.0.0',
      description: 'Hệ thống Quản lý Nhiệm vụ Công tác Công an Phường'
    });

    await batch.commit();

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

/**
 * Pulls all records from Firestore down into client storage
 */
export async function pullAllDataFromFirestore(): Promise<void> {
  updateStatus({ isSyncing: true });
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

    // 5. Tasks
    const hkcchSnap = await getDocs(collection(db, 'hkcch'));
    if (!hkcchSnap.empty) {
      const list = hkcchSnap.docs.map((d) => d.data() as HKCCHRecord);
      list.sort((a, b) => a.stt - b.stt);
      saveHkcchList(list);
    }

    const matuySnap = await getDocs(collection(db, 'matuy'));
    if (!matuySnap.empty) {
      const list = matuySnap.docs.map((d) => d.data() as MaTuyRecord);
      list.sort((a, b) => a.stt - b.stt);
      saveMatuyList(list);
    }

    const dcttpSnap = await getDocs(collection(db, 'dcttp'));
    if (!dcttpSnap.empty) {
      const list = dcttpSnap.docs.map((d) => d.data() as DCTTPRecord);
      list.sort((a, b) => a.stt - b.stt);
      saveDcttpList(list);
    }

    const datdaiSnap = await getDocs(collection(db, 'datdai'));
    if (!datdaiSnap.empty) {
      const list = datdaiSnap.docs.map((d) => d.data() as DatDaiRecord);
      list.sort((a, b) => a.stt - b.stt);
      saveDatdaiList(list);
    }

    const genSnap = await getDocs(collection(db, 'generic_tasks'));
    if (!genSnap.empty) {
      const list = genSnap.docs.map((d) => d.data() as GenericTaskRecord);
      saveGenericTasksList(list);
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
      if (!snap.empty) {
        const groups = snap.docs.map((d) => d.data() as ResidentialGroup);
        saveResidentialGroups(groups);
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
      if (!snap.empty) {
        const staffList = snap.docs.map((d) => d.data() as Staff);
        saveStaffList(staffList);
        updateStatus({ lastSyncedAt: new Date() });
        if (onRemoteUpdate) onRemoteUpdate();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'staff');
    }
  );

  // Listen to tasks
  onSnapshot(
    collection(db, 'hkcch'),
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as HKCCHRecord);
        list.sort((a, b) => a.stt - b.stt);
        saveHkcchList(list);
        updateStatus({ lastSyncedAt: new Date() });
        if (onRemoteUpdate) onRemoteUpdate();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'hkcch');
    }
  );

  onSnapshot(
    collection(db, 'matuy'),
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as MaTuyRecord);
        list.sort((a, b) => a.stt - b.stt);
        saveMatuyList(list);
        updateStatus({ lastSyncedAt: new Date() });
        if (onRemoteUpdate) onRemoteUpdate();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'matuy');
    }
  );

  onSnapshot(
    collection(db, 'dcttp'),
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as DCTTPRecord);
        list.sort((a, b) => a.stt - b.stt);
        saveDcttpList(list);
        updateStatus({ lastSyncedAt: new Date() });
        if (onRemoteUpdate) onRemoteUpdate();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'dcttp');
    }
  );

  onSnapshot(
    collection(db, 'datdai'),
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as DatDaiRecord);
        list.sort((a, b) => a.stt - b.stt);
        saveDatdaiList(list);
        updateStatus({ lastSyncedAt: new Date() });
        if (onRemoteUpdate) onRemoteUpdate();
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, 'datdai');
    }
  );
}

// -------------------------------------------------------------
// Cloud Mutation Helpers (Call whenever app modifies entities)
// -------------------------------------------------------------

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

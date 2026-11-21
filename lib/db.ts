import { openDB, IDBPDatabase } from "idb";

const DB_NAME = "asejik_learning_db";
const DB_VERSION = 1;

export interface UserProfile {
  fullName: string;
  email: string;
  consentedAt: string;
  syncedToCloud: boolean;
}

export interface CourseProgressRecord {
  courseSlug: string;
  completedLessonSlugs: string[];
  activeLessonSlug: string;
  lastActiveAt: number;
  percentage: number;
}

export interface LessonStateRecord {
  key: string; // `${courseSlug}_${lessonSlug}`
  courseSlug: string;
  lessonSlug: string;
  currentScreenIndex: number;
  completedScreenIds: string[];
  retryQueue: string[];
  completedAt?: number;
  rating?: "thumbs-up" | "thumbs-down";
}

// In-memory fallback map for environments where IndexedDB is restricted (e.g. strict Incognito / Private browsing)
const inMemoryFallback = {
  userProfile: null as UserProfile | null,
  courseProgress: new Map<string, CourseProgressRecord>(),
  lessonState: new Map<string, LessonStateRecord>(),
};

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!("indexedDB" in window)) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("user_profile")) {
          db.createObjectStore("user_profile");
        }
        if (!db.objectStoreNames.contains("course_progress")) {
          db.createObjectStore("course_progress", { keyPath: "courseSlug" });
        }
        if (!db.objectStoreNames.contains("lesson_state")) {
          db.createObjectStore("lesson_state", { keyPath: "key" });
        }
      },
    }).catch((err) => {
      // In case IndexedDB is blocked or quota exceeded, reset promise and use fallback
      console.warn("IndexedDB unavailable, falling back to in-memory session state:", err);
      dbPromise = null;
      throw err;
    });
  }

  return dbPromise;
}

// 1. User Profile Operations
export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    const db = await getDb();
    if (db) {
      await db.put("user_profile", profile, "current_user");
      return true;
    }
  } catch {
    // Fallback
  }
  inMemoryFallback.userProfile = profile;
  return true;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const db = await getDb();
    if (db) {
      const result = await db.get("user_profile", "current_user");
      return result || null;
    }
  } catch {
    // Fallback
  }
  return inMemoryFallback.userProfile;
}

// 2. Course Progress Operations
export async function saveCourseProgress(
  courseSlug: string,
  lessonSlug: string,
  percentage: number
): Promise<boolean> {
  const existing = await getCourseProgress(courseSlug);
  const completedLessons = new Set(existing?.completedLessonSlugs || []);
  if (percentage >= 100) {
    completedLessons.add(lessonSlug);
  }

  const record: CourseProgressRecord = {
    courseSlug,
    completedLessonSlugs: Array.from(completedLessons),
    activeLessonSlug: lessonSlug,
    lastActiveAt: Date.now(),
    percentage: Math.max(existing?.percentage || 0, percentage),
  };

  try {
    const db = await getDb();
    if (db) {
      await db.put("course_progress", record);
      return true;
    }
  } catch {
    // Fallback
  }
  inMemoryFallback.courseProgress.set(courseSlug, record);
  return true;
}

export async function getCourseProgress(
  courseSlug: string
): Promise<CourseProgressRecord | null> {
  try {
    const db = await getDb();
    if (db) {
      const result = await db.get("course_progress", courseSlug);
      return result || null;
    }
  } catch {
    // Fallback
  }
  return inMemoryFallback.courseProgress.get(courseSlug) || null;
}

export async function getAllCourseProgress(): Promise<CourseProgressRecord[]> {
  try {
    const db = await getDb();
    if (db) {
      return await db.getAll("course_progress");
    }
  } catch {
    // Fallback
  }
  return Array.from(inMemoryFallback.courseProgress.values());
}

// 3. Lesson State Operations (Active Recall & Rating)
export async function saveLessonState(
  courseSlug: string,
  lessonSlug: string,
  state: Partial<Omit<LessonStateRecord, "key" | "courseSlug" | "lessonSlug">>
): Promise<boolean> {
  const key = `${courseSlug}_${lessonSlug}`;
  const existing = await getLessonState(courseSlug, lessonSlug);

  const record: LessonStateRecord = {
    key,
    courseSlug,
    lessonSlug,
    currentScreenIndex: state.currentScreenIndex ?? existing?.currentScreenIndex ?? 0,
    completedScreenIds: state.completedScreenIds ?? existing?.completedScreenIds ?? [],
    retryQueue: state.retryQueue ?? existing?.retryQueue ?? [],
    completedAt: state.completedAt ?? existing?.completedAt,
    rating: state.rating ?? existing?.rating,
  };

  try {
    const db = await getDb();
    if (db) {
      await db.put("lesson_state", record);
      return true;
    }
  } catch {
    // Fallback
  }
  inMemoryFallback.lessonState.set(key, record);
  return true;
}

export async function getLessonState(
  courseSlug: string,
  lessonSlug: string
): Promise<LessonStateRecord | null> {
  const key = `${courseSlug}_${lessonSlug}`;
  try {
    const db = await getDb();
    if (db) {
      const result = await db.get("lesson_state", key);
      return result || null;
    }
  } catch {
    // Fallback
  }
  return inMemoryFallback.lessonState.get(key) || null;
}

// 4. Clear All Local Data (Privacy Self-Service)
export async function clearAllLocalData(): Promise<boolean> {
  try {
    const db = await getDb();
    if (db) {
      const tx = db.transaction(
        ["user_profile", "course_progress", "lesson_state"],
        "readwrite"
      );
      await Promise.all([
        tx.objectStore("user_profile").clear(),
        tx.objectStore("course_progress").clear(),
        tx.objectStore("lesson_state").clear(),
        tx.done,
      ]);
    }
  } catch (err) {
    console.warn("Error clearing IndexedDB, clearing in-memory state:", err);
  }

  inMemoryFallback.userProfile = null;
  inMemoryFallback.courseProgress.clear();
  inMemoryFallback.lessonState.clear();

  // Also clear legacy localStorage keys
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem("asejik_course_progress_v1");
      window.localStorage.removeItem("asejik_user_profile");
    } catch {
      // Ignored
    }
  }

  return true;
}

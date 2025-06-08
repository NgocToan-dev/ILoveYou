import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, clearFirestoreCache, restartFirestoreConnection } from "./config";
import { Reminder, remindersFromQuerySnapshot } from "../../models";
import { formatDateString, toDate } from "../../utils/dateUtils";

// Helper function to safely compare reminder dates
const isReminderOverdue = (reminder, referenceDate = new Date()) => {
  if (!reminder.dueDate) return false;
  const dueDate = toDate(reminder.dueDate);
  return dueDate ? dueDate < referenceDate : false;
};

const isReminderUpcoming = (
  reminder,
  startDate = new Date(),
  endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
) => {
  if (!reminder.dueDate) return false;
  const dueDate = toDate(reminder.dueDate);
  return dueDate ? dueDate >= startDate && dueDate <= endDate : false;
};

const compareReminderDates = (reminderA, reminderB) => {
  const dateA = toDate(reminderA.dueDate);
  const dateB = toDate(reminderB.dueDate);

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return dateA - dateB;
};

// Reminder types
export const REMINDER_TYPES = {
  PERSONAL: "personal",
  COUPLE: "couple",
};

// Reminder priorities
export const REMINDER_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

// Reminder categories
export const REMINDER_CATEGORIES = {
  SPECIAL_OCCASIONS: "special_occasions",
  DATES: "dates",
  GIFTS: "gifts",
  HEALTH_WELLNESS: "health_wellness",
  PERSONAL_GROWTH: "personal_growth",
  OTHER: "other",
};

// Recurring types
export const RECURRING_TYPES = {
  NONE: "none",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

// Create a new reminder
export const createReminder = async (reminderData) => {
  try {
    // Create Reminder model instance with defaults
    const reminderModel = new Reminder({
      ...reminderData,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Validate reminder
    if (!reminderModel.isValid()) {
      return {
        success: false,
        error: "Invalid reminder data: title and due date are required",
      };
    }

    const docRef = await addDoc(
      collection(db, "reminders"),
      reminderModel.toFirestore()
    );

    return {
      success: true,
      id: docRef.id,
      ...reminderModel.toFirestore(),
    };
  } catch (error) {
    console.error("Error creating reminder:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Update an existing reminder
export const updateReminder = async (reminderId, updateData) => {
  try {
    // Basic validation using Reminder model
    if (updateData.title !== undefined && !updateData.title.trim()) {
      throw new Error("Title cannot be empty");
    }

    if (updateData.dueDate !== undefined && !updateData.dueDate) {
      throw new Error("Due date is required");
    }

    const reminderRef = doc(db, "reminders", reminderId);
    await updateDoc(reminderRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error updating reminder:", error);
    throw error;
  }
};

// Delete a reminder
export const deleteReminder = async (reminderId) => {
  try {
    if (!reminderId || typeof reminderId !== 'string') {
      throw new Error('Invalid reminder ID provided');
    }

    console.log('Attempting to delete reminder with ID:', reminderId);
    
    // First check if the reminder exists
    const reminderRef = doc(db, "reminders", reminderId);
    const reminderDoc = await getDoc(reminderRef);
    
    if (!reminderDoc.exists()) {
      console.warn('Reminder does not exist:', reminderId);
      throw new Error('Reminder not found');
    }

    // Add a small delay to prevent rapid successive operations that might cause Firestore state issues
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Delete the reminder
    await deleteDoc(reminderRef);
    console.log('Successfully deleted reminder:', reminderId);

    // Add another small delay to allow Firestore to sync state
    await new Promise(resolve => setTimeout(resolve, 100));

    return true;
  } catch (error) {
    console.error("Error deleting reminder:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    
    // Handle specific Firestore errors
    if (error.code === 'internal' || error.name === 'BloomFilterError') {
      console.error("Firestore internal/BloomFilter error detected, attempting to clear cache...");
      
      try {
        // Try to clear cache first
        await clearFirestoreCache();
        
        // Wait a bit longer
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry the deletion
        const reminderRef = doc(db, "reminders", reminderId);
        await deleteDoc(reminderRef);
        console.log('Retry successful after cache clear for reminder deletion:', reminderId);
        return true;
      } catch (retryError) {
        console.error("Retry failed after cache clear:", retryError);
        
        // Try restarting connection as last resort
        try {
          await restartFirestoreConnection();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const reminderRef = doc(db, "reminders", reminderId);
          await deleteDoc(reminderRef);
          console.log('Final retry successful after connection restart:', reminderId);
          return true;
        } catch (finalError) {
          console.error("Final retry failed:", finalError);
          throw new Error('Firestore connection error. Please restart the app and try again.');
        }
      }
    }
    
    throw error;
  }
};

// Mark reminder as completed
export const completeReminder = async (reminderId) => {
  try {
    const reminderRef = doc(db, "reminders", reminderId);
    await updateDoc(reminderRef, {
      completed: true,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error completing reminder:", error);
    throw error;
  }
};

// Mark reminder as uncompleted
export const uncompleteReminder = async (reminderId) => {
  try {
    const reminderRef = doc(db, "reminders", reminderId);
    await updateDoc(reminderRef, {
      completed: false,
      completedAt: null,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error uncompleting reminder:", error);
    throw error;
  }
};

// Get a single reminder by ID
export const getReminderById = async (reminderId) => {
  try {
    const reminderRef = doc(db, "reminders", reminderId);
    const reminderDoc = await getDoc(reminderRef);

    if (!reminderDoc.exists()) {
      return null;
    }

    return {
      id: reminderDoc.id,
      ...reminderDoc.data(),
    };
  } catch (error) {
    console.error("Error getting reminder:", error);
    throw error;
  }
};

// Get a specific reminder by ID
export const getReminder = async (reminderId) => {
  try {
    const reminderRef = doc(db, "reminders", reminderId);
    const reminderDoc = await getDoc(reminderRef);

    if (!reminderDoc.exists()) {
      return null;
    }

    return {
      id: reminderDoc.id,
      ...reminderDoc.data(),
    };
  } catch (error) {
    console.error("Error getting reminder:", error);
    throw error;
  }
};

// Get user's personal reminders
export const getUserPersonalReminders = async (
  userId,
  includeCompleted = false
) => {
  try {
    let q = query(
      collection(db, "reminders"),
      where("userId", "==", userId),
      where("type", "==", REMINDER_TYPES.PERSONAL),
      orderBy("dueDate", "asc")
    );

    if (!includeCompleted) {
      q = query(
        collection(db, "reminders"),
        where("userId", "==", userId),
        where("type", "==", REMINDER_TYPES.PERSONAL),
        where("completed", "==", false),
        orderBy("dueDate", "asc")
      );
    }

    const querySnapshot = await getDocs(q);
    const reminders = [];

    querySnapshot.forEach((doc) => {
      reminders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return reminders;
  } catch (error) {
    console.error("Error getting user personal reminders:", error);
    throw error;
  }
};

// Get couple's shared reminders
export const getCoupleReminders = async (
  coupleId,
  includeCompleted = false
) => {
  try {
    let q = query(
      collection(db, "reminders"),
      where("coupleId", "==", coupleId),
      where("type", "==", REMINDER_TYPES.COUPLE),
      orderBy("dueDate", "asc")
    );

    if (!includeCompleted) {
      q = query(
        collection(db, "reminders"),
        where("coupleId", "==", coupleId),
        where("type", "==", REMINDER_TYPES.COUPLE),
        where("completed", "==", false),
        orderBy("dueDate", "asc")
      );
    }

    const querySnapshot = await getDocs(q);
    const reminders = [];

    querySnapshot.forEach((doc) => {
      reminders.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return reminders;
  } catch (error) {
    console.error("Error getting couple reminders:", error);
    throw error;
  }
};

// Subscribe to user's personal reminders
export const subscribeToUserPersonalReminders = (
  userId,
  includeCompleted,
  callback
) => {
  try {
    let q = query(
      collection(db, "reminders"),
      where("userId", "==", userId),
      where("type", "==", REMINDER_TYPES.PERSONAL),
      orderBy("dueDate", "asc")
    );

    if (!includeCompleted) {
      q = query(
        collection(db, "reminders"),
        where("userId", "==", userId),
        where("type", "==", REMINDER_TYPES.PERSONAL),
        where("completed", "==", false),
        orderBy("dueDate", "asc")
      );
    }

    console.log("Setting up personal reminders subscription for userId:", userId, "includeCompleted:", includeCompleted);

    return onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const reminders = [];
          querySnapshot.forEach((doc) => {
            reminders.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          console.log("Personal reminders subscription received:", reminders.length, "reminders");
          callback(reminders);
        } catch (error) {
          console.error("Error processing personal reminders snapshot:", error);
          callback([]);
        }
      },
      (error) => {
        console.error("Error in personal reminders subscription:", error);
        console.error("Error details:", error.code, error.message);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up personal reminders subscription:", error);
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }
};

// Subscribe to couple's reminders
export const subscribeToCoupleReminders = (
  coupleId,
  includeCompleted,
  callback
) => {
  if (!coupleId) {
    console.warn("No coupleId provided for couple reminders subscription");
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }

  try {
    let q = query(
      collection(db, "reminders"),
      where("coupleId", "==", coupleId),
      where("type", "==", REMINDER_TYPES.COUPLE),
      orderBy("dueDate", "asc")
    );

    if (!includeCompleted) {
      q = query(
        collection(db, "reminders"),
        where("coupleId", "==", coupleId),
        where("type", "==", REMINDER_TYPES.COUPLE),
        where("completed", "==", false),
        orderBy("dueDate", "asc")
      );
    }

    console.log(
      "Setting up couple reminders subscription for coupleId:",
      coupleId,
      "includeCompleted:",
      includeCompleted
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const reminders = [];
          querySnapshot.forEach((doc) => {
            reminders.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          console.log(
            "Couple reminders subscription received:",
            reminders.length,
            "reminders"
          );
          callback(reminders);
        } catch (error) {
          console.error("Error processing couple reminders snapshot:", error);
          callback([]);
        }
      },
      (error) => {
        console.error("Error in couple reminders subscription:", error);
        console.error("Error details:", error.code, error.message);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up couple reminders subscription:", error);
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }
};

// Get upcoming reminders (due within next 7 days)
export const getUpcomingReminders = async (userId, coupleId) => {
  try {
    const reminders = [];

    // Get personal reminders
    const personalReminders = await getUserPersonalReminders(userId, false);
    const upcomingPersonal = personalReminders.filter((reminder) =>
      isReminderUpcoming(reminder)
    );
    reminders.push(...upcomingPersonal);

    // Get couple reminders if coupleId exists
    if (coupleId) {
      const coupleReminders = await getCoupleReminders(coupleId, false);
      const upcomingCouple = coupleReminders.filter((reminder) =>
        isReminderUpcoming(reminder)
      );
      reminders.push(...upcomingCouple);
    }

    // Sort by due date
    reminders.sort(compareReminderDates);

    return reminders;
  } catch (error) {
    console.error("Error getting upcoming reminders:", error);
    throw error;
  }
};

// Get overdue reminders
export const getOverdueReminders = async (userId, coupleId) => {
  try {
    const now = new Date();

    const reminders = [];
    // Get personal reminders
    const personalReminders = await getUserPersonalReminders(userId, false);
    const overduePersonal = personalReminders.filter((reminder) =>
      isReminderOverdue(reminder)
    );
    reminders.push(...overduePersonal);

    // Get couple reminders if coupleId exists
    if (coupleId) {
      const coupleReminders = await getCoupleReminders(coupleId, false);
      const overdueCouple = coupleReminders.filter((reminder) =>
        isReminderOverdue(reminder)
      );
      reminders.push(...overdueCouple);
    }

    // Sort by due date (oldest first)
    reminders.sort(compareReminderDates);

    return reminders;
  } catch (error) {
    console.error("Error getting overdue reminders:", error);
    throw error;
  }
};

// Get reminders statistics
export const getRemindersStats = async (userId, coupleId) => {
  try {
    const stats = {
      personal: {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
      },
      couple: {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
      },
    };

    const now = new Date();

    // Get personal reminders stats
    const allPersonal = await getUserPersonalReminders(userId, true);
    stats.personal.total = allPersonal.length;
    stats.personal.completed = allPersonal.filter((r) => r.completed).length;
    stats.personal.pending = allPersonal.filter((r) => !r.completed).length;
    stats.personal.overdue = allPersonal.filter(
      (r) => !r.completed && isReminderOverdue(r)
    ).length;

    // Get couple reminders stats if coupleId exists
    if (coupleId) {
      const allCouple = await getCoupleReminders(coupleId, true);
      stats.couple.total = allCouple.length;
      stats.couple.completed = allCouple.filter((r) => r.completed).length;
      stats.couple.pending = allCouple.filter((r) => !r.completed).length;
      stats.couple.overdue = allCouple.filter(
        (r) => !r.completed && isReminderOverdue(r)
      ).length;
    }

    return stats;
  } catch (error) {
    console.error("Error getting reminders stats:", error);
    throw error;
  }
};

// Helper function to get priority color
export const getPriorityColor = (priority) => {
  const colors = {
    [REMINDER_PRIORITIES.LOW]: "#4CAF50",
    [REMINDER_PRIORITIES.MEDIUM]: "#FF9800",
    [REMINDER_PRIORITIES.HIGH]: "#FF5722",
    [REMINDER_PRIORITIES.URGENT]: "#F44336",
  };

  return colors[priority] || colors[REMINDER_PRIORITIES.MEDIUM];
};

// Helper function to get priority name
export const getPriorityName = (priority) => {
  const names = {
    [REMINDER_PRIORITIES.LOW]: "Thấp",
    [REMINDER_PRIORITIES.MEDIUM]: "Trung bình",
    [REMINDER_PRIORITIES.HIGH]: "Cao",
    [REMINDER_PRIORITIES.URGENT]: "Khẩn cấp",
  };

  return names[priority] || names[REMINDER_PRIORITIES.MEDIUM];
};

// Helper function to get recurring name
export const getRecurringName = (recurring) => {
  const names = {
    [RECURRING_TYPES.NONE]: "Không lặp lại",
    [RECURRING_TYPES.DAILY]: "Hàng ngày",
    [RECURRING_TYPES.WEEKLY]: "Hàng tuần",
    [RECURRING_TYPES.MONTHLY]: "Hàng tháng",
    [RECURRING_TYPES.YEARLY]: "Hàng năm",
  };

  return names[recurring] || names[RECURRING_TYPES.NONE];
};

// Helper function to get category display info
export const getCategoryDisplayInfo = (category) => {
  const categoryInfo = {
    [REMINDER_CATEGORIES.SPECIAL_OCCASIONS]: {
      name: "Sự kiện đặc biệt",
      emoji: "🎉",
      color: "#E91E63",
      description: "Sinh nhật, kỷ niệm, lễ tết",
    },
    [REMINDER_CATEGORIES.DATES]: {
      name: "Hẹn hò",
      emoji: "💑",
      color: "#9C27B0",
      description: "Date nights, romantic dinners",
    },
    [REMINDER_CATEGORIES.GIFTS]: {
      name: "Quà tặng",
      emoji: "🎁",
      color: "#FF9800",
      description: "Mua quà, chuẩn bị surprise",
    },
    [REMINDER_CATEGORIES.HEALTH_WELLNESS]: {
      name: "Sức khỏe",
      emoji: "💪",
      color: "#4CAF50",
      description: "Tập gym, khám sức khỏe",
    },
    [REMINDER_CATEGORIES.PERSONAL_GROWTH]: {
      name: "Phát triển",
      emoji: "📚",
      color: "#2196F3",
      description: "Học hỏi, rèn luyện kỹ năng",
    },
    [REMINDER_CATEGORIES.OTHER]: {
      name: "Khác",
      emoji: "📌",
      color: "#607D8B",
      description: "Các việc khác",
    },
  };

  return categoryInfo[category] || categoryInfo[REMINDER_CATEGORIES.OTHER];
};

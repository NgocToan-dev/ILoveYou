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

// Get category display info
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

// Get priority display info
export const getPriorityDisplayInfo = (priority) => {
  const priorityInfo = {
    [REMINDER_PRIORITIES.LOW]: {
      name: "Thấp",
      color: "#4CAF50",
      icon: "chevron-down",
      emoji: "🟢",
    },
    [REMINDER_PRIORITIES.MEDIUM]: {
      name: "Trung bình",
      color: "#FF9800",
      icon: "remove",
      emoji: "🟡",
    },
    [REMINDER_PRIORITIES.HIGH]: {
      name: "Cao",
      color: "#FF5722",
      icon: "chevron-up",
      emoji: "🟠",
    },
    [REMINDER_PRIORITIES.URGENT]: {
      name: "Khẩn cấp",
      color: "#F44336",
      icon: "warning",
      emoji: "🔴",
    },
  };

  return priorityInfo[priority] || priorityInfo[REMINDER_PRIORITIES.MEDIUM];
};

// Get recurring type display info
export const getRecurringDisplayInfo = (recurring) => {
  const recurringInfo = {
    [RECURRING_TYPES.NONE]: {
      name: "Không lặp lại",
      shortName: "Một lần",
    },
    [RECURRING_TYPES.DAILY]: {
      name: "Hàng ngày",
      shortName: "Ngày",
    },
    [RECURRING_TYPES.WEEKLY]: {
      name: "Hàng tuần",
      shortName: "Tuần",
    },
    [RECURRING_TYPES.MONTHLY]: {
      name: "Hàng tháng",
      shortName: "Tháng",
    },
    [RECURRING_TYPES.YEARLY]: {
      name: "Hàng năm",
      shortName: "Năm",
    },
  };

  return recurringInfo[recurring] || recurringInfo[RECURRING_TYPES.NONE];
};
// Note categories
export const NOTE_CATEGORIES = {
  LOVE_LETTERS: "loveLetters",
  MEMORIES: "memories",
  DREAMS: "dreams",
  GRATITUDE: "gratitude",
};

// Note types
export const NOTE_TYPES = {
  PRIVATE: "private",
  SHARED: "shared",
};

// Get category display info
export const getCategoryDisplayInfo = (category) => {
  const categoryInfo = {
    [NOTE_CATEGORIES.LOVE_LETTERS]: {
      name: "Thư tình",
      icon: "mail",
      emoji: "💌",
      color: "#E91E63",
      description: "Những lời yêu thương ngọt ngào",
    },
    [NOTE_CATEGORIES.MEMORIES]: {
      name: "Kỷ niệm",
      icon: "camera",
      emoji: "📸",
      color: "#8E24AA",
      description: "Lưu giữ những khoảnh khắc đáng nhớ",
    },
    [NOTE_CATEGORIES.DREAMS]: {
      name: "Ước mơ",
      icon: "star",
      emoji: "⭐",
      color: "#FF6F00",
      description: "Những giấc mơ và kế hoạch tương lai",
    },
    [NOTE_CATEGORIES.GRATITUDE]: {
      name: "Biết ơn",
      icon: "heart",
      emoji: "🙏",
      color: "#4CAF50",
      description: "Những điều biết ơn và trân trọng",
    },
  };

  return categoryInfo[category] || categoryInfo[NOTE_CATEGORIES.LOVE_LETTERS];
};
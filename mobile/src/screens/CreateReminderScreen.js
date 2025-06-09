import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../context/AuthContext";
import { LoveBackground, LoadingIndicator } from "../components";
import {
  createReminder,
  REMINDER_TYPES,
  REMINDER_PRIORITIES,
  REMINDER_CATEGORIES,
  getPriorityColor,
  getPriorityName,
  getReminderCategoryDisplayInfo,
} from "@shared/services/firebase/reminders";
import { getUserProfile } from "@shared/services/firebase/firestore";
import { Reminder } from "@shared/models";

const CreateReminderScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { type: initialType } = route.params || {};

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState(
    initialType || REMINDER_TYPES.PERSONAL
  );
  const [selectedCategory, setSelectedCategory] = useState(
    REMINDER_CATEGORIES.SPECIAL_OCCASIONS
  );
  const [selectedPriority, setSelectedPriority] = useState(
    REMINDER_PRIORITIES.MEDIUM
  );
  // Date and time state - simplified with DateTimePicker
  const [selectedDateTime, setSelectedDateTime] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9:00 AM
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng.");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateReminder = async () => {
    if (!title.trim()) {
      Alert.alert("Thiếu tiêu đề", "Vui lòng nhập tiêu đề cho nhắc nhở.");
      return;
    }

    if (selectedType === REMINDER_TYPES.COUPLE && !userProfile?.coupleId) {
      Alert.alert(
        "Chưa kết nối",
        "Bạn cần kết nối với người yêu để tạo nhắc nhở cặp đôi.",
        [
          { text: "Hủy" },
          {
            text: "Kết nối ngay",
            onPress: () => navigation.navigate("Couple"),
          },
        ]
      );
      return;
    }

    // Validate date time - must be in the future
    if (selectedDateTime <= new Date()) {
      Alert.alert(
        "Thời gian không hợp lệ",
        "Vui lòng chọn thời gian trong tương lai."
      );
      return;
    }

    setSubmitting(true);
    try {
      // Create Reminder model instance with validation
      const reminderModel = new Reminder({
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        priority: selectedPriority,
        type: selectedType,
        dueDate: selectedDateTime,
        userId: user.uid,
        coupleId:
          selectedType === REMINDER_TYPES.COUPLE ? userProfile?.coupleId : null,
        completed: false,
      });

      // Validate using model
      if (!reminderModel.isValid()) {
        Alert.alert(
          "Dữ liệu không hợp lệ",
          "Vui lòng kiểm tra lại thông tin nhắc nhở."
        );
        return;
      }

      console.log("Creating reminder with model:", reminderModel.toFirestore());
      console.log("User profile coupleId:", userProfile?.coupleId);
      console.log("Selected type:", selectedType);
      console.log("Final reminder data:", {
        ...reminderModel.toFirestore(),
        userId: user.uid,
        coupleId:
          selectedType === REMINDER_TYPES.COUPLE ? userProfile?.coupleId : null,
      });
      const result = await createReminder(reminderModel.toFirestore());
      console.log("Create reminder result:", result);

      if (result.success) {
        const categoryInfo = getReminderCategoryDisplayInfo(selectedCategory);
        Alert.alert(
          "Tạo thành công! ⏰",
          `Đã tạo nhắc nhở "${categoryInfo.name}" ${
            selectedType === REMINDER_TYPES.COUPLE ? "cặp đôi" : "cá nhân"
          } thành công!`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        console.error("Create reminder failed:", result.error);
        Alert.alert(
          "Lỗi",
          result.error || "Không thể tạo nhắc nhở. Vui lòng thử lại."
        );
      }
    } catch (error) {
      console.error("Error creating reminder:", error);
      Alert.alert("Lỗi", `Có lỗi xảy ra: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (title.trim() || description.trim()) {
      Alert.alert(
        "Hủy tạo nhắc nhở",
        "Bạn có muốn hủy tạo nhắc nhở? Nội dung đã nhập sẽ bị mất.",
        [
          { text: "Tiếp tục tạo", style: "cancel" },
          {
            text: "Hủy",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const renderCategorySelector = () => {
    const categories = [
      REMINDER_CATEGORIES.SPECIAL_OCCASIONS,
      REMINDER_CATEGORIES.DATES,
      REMINDER_CATEGORIES.GIFTS,
      REMINDER_CATEGORIES.HEALTH_WELLNESS,
      REMINDER_CATEGORIES.PERSONAL_GROWTH,
      REMINDER_CATEGORIES.OTHER,
    ];

    return (
      <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>Danh mục</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const categoryInfo = getReminderCategoryDisplayInfo(category);
              const isSelected = selectedCategory === category;

              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryCard,
                    isSelected && styles.selectedCategoryCard,
                    { borderLeftColor: categoryInfo.color },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && styles.selectedCategoryName,
                    ]}
                  >
                    {categoryInfo.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderPrioritySelector = () => {
    const priorities = [
      REMINDER_PRIORITIES.LOW,
      REMINDER_PRIORITIES.MEDIUM,
      REMINDER_PRIORITIES.HIGH,
      REMINDER_PRIORITIES.URGENT,
    ];

    return (
      <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>Mức độ ưu tiên</Text>
        <View style={styles.priorityGrid}>
          {priorities.map((priority) => {
            const isSelected = selectedPriority === priority;
            const priorityColor = getPriorityColor(priority);
            const priorityName = getPriorityName(priority);

            return (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityCard,
                  isSelected && { backgroundColor: priorityColor + "20" },
                  { borderColor: isSelected ? priorityColor : "#FCE4EC" },
                ]}
                onPress={() => setSelectedPriority(priority)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: priorityColor },
                  ]}
                />
                <Text
                  style={[
                    styles.priorityName,
                    isSelected && { color: priorityColor },
                  ]}
                >
                  {priorityName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTypeSelector = () => {
    return (
      <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>Loại nhắc nhở</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === REMINDER_TYPES.PERSONAL &&
                styles.selectedTypeButton,
            ]}
            onPress={() => setSelectedType(REMINDER_TYPES.PERSONAL)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="person"
              size={20}
              color={
                selectedType === REMINDER_TYPES.PERSONAL ? "#FFF" : "#8E24AA"
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                selectedType === REMINDER_TYPES.PERSONAL &&
                  styles.selectedTypeButtonText,
              ]}
            >
              Cá nhân
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === REMINDER_TYPES.COUPLE &&
                styles.selectedTypeButton,
              !userProfile?.coupleId && styles.disabledButton,
            ]}
            onPress={() => {
              if (userProfile?.coupleId) {
                setSelectedType(REMINDER_TYPES.COUPLE);
              } else {
                Alert.alert(
                  "Chưa kết nối",
                  "Bạn cần kết nối với người yêu để tạo nhắc nhở cặp đôi.",
                  [
                    { text: "Hủy" },
                    {
                      text: "Kết nối ngay",
                      onPress: () => navigation.navigate("Couple"),
                    },
                  ]
                );
              }
            }}
            disabled={!userProfile?.coupleId}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people"
              size={20}
              color={
                selectedType === REMINDER_TYPES.COUPLE ? "#FFF" : "#E91E63"
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                selectedType === REMINDER_TYPES.COUPLE &&
                  styles.selectedTypeButtonText,
              ]}
            >
              Cặp đôi
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const renderDateTimeSelector = () => {
    const formatDateTime = () => {
      return selectedDateTime.toLocaleString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const handleDateConfirm = (date) => {
      setShowDatePicker(false);
      // Keep the current time but update the date
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setFullYear(date.getFullYear());
      newDateTime.setMonth(date.getMonth());
      newDateTime.setDate(date.getDate());
      setSelectedDateTime(newDateTime);
    };

    const handleTimeConfirm = (time) => {
      setShowTimePicker(false);
      // Keep the current date but update the time
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setHours(time.getHours());
      newDateTime.setMinutes(time.getMinutes());
      setSelectedDateTime(newDateTime);
    };

    return (
      <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>Thời gian nhắc nhở</Text>
        {/* Date and Time Buttons */}
        <View style={styles.dateTimeContainer}>
          {/* Date Button */}
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color="#E91E63" />
            <Text style={styles.dateTimeText}>
              {selectedDateTime.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Text>
          </TouchableOpacity>

          {/* Time Button */}
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={20} color="#E91E63" />
            <Text style={styles.dateTimeText}>
              {selectedDateTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Preview */}
        <Text style={styles.dateTimePreview}>
          Nhắc nhở vào: {formatDateTime()}
        </Text>
        {/* Date Picker Modal */}
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
          date={selectedDateTime}
          minimumDate={new Date()}
          maximumDate={(() => {
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() + 5);
            return maxDate;
          })()}
          locale="vi"
        />
        {/* Time Picker Modal */}
        <DateTimePickerModal
          isVisible={showTimePicker}
          mode="time"
          onConfirm={handleTimeConfirm}
          onCancel={() => setShowTimePicker(false)}
          date={selectedDateTime}
          is24Hour={true}
          locale="vi"
        />
      </View>
    );
  };

  if (loading) {
    return (
      <LoveBackground>
        <View style={styles.loadingContainer}>
          <LoadingIndicator message="Đang tải..." />
        </View>
      </LoveBackground>
    );
  }

  return (
    <LoveBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#C2185B" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Tạo nhắc nhở mới</Text>

          <TouchableOpacity
            style={[styles.saveButton, submitting && styles.disabledButton]}
            onPress={handleCreateReminder}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <LoadingIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="checkmark" size={24} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Selector */}
          {renderCategorySelector()}

          {/* Type Selector */}
          {renderTypeSelector()}

          {/* Priority Selector */}
          {renderPrioritySelector()}

          {/* Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Tiêu đề nhắc nhở</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Nhập tiêu đề nhắc nhở..."
              placeholderTextColor="#CCC"
              maxLength={100}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          {/* Description Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Mô tả (tùy chọn)</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Thêm mô tả chi tiết..."
              placeholderTextColor="#CCC"
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{description.length}/500</Text>
          </View>

          {/* Date Time Selector */}
          {renderDateTimeSelector()}
        </ScrollView>
      </KeyboardAvoidingView>
    </LoveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#FCE4EC",
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C2185B",
    flex: 1,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#E91E63",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#CCC",
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  selectorSection: {
    marginBottom: 24,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C2185B",
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    width: 100,
    borderLeftWidth: 4,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategoryCard: {
    backgroundColor: "#FCE4EC",
    borderColor: "#E91E63",
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E24AA",
    textAlign: "center",
  },
  selectedCategoryName: {
    color: "#C2185B",
  },
  priorityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priorityCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    minWidth: "45%",
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E24AA",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#FCE4EC",
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedTypeButton: {
    backgroundColor: "#E91E63",
    borderColor: "#E91E63",
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E24AA",
    marginLeft: 8,
  },
  selectedTypeButtonText: {
    color: "#FFF",
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C2185B",
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#FCE4EC",
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#FCE4EC",
    minHeight: 100,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  dateTimeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#FCE4EC",
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C2185B",
    marginLeft: 8,
  },
  dateTimePreview: {
    fontSize: 14,
    color: "#8E24AA",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
});

export default CreateReminderScreen;

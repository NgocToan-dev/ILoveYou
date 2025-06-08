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
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../context/AuthContext";
import { LoveBackground, LoadingIndicator } from "../components";
import { formatDateString } from "../utils/dateUtils";
import {
  updateReminder,
  REMINDER_TYPES,
  REMINDER_PRIORITIES,
  REMINDER_CATEGORIES,
  getPriorityColor,
  getPriorityName,
  getCategoryDisplayInfo,
} from "../services/firebase/reminders";
import { getUserProfile } from "../services/firebase/firestore";
import { Reminder } from "../models";

const EditReminderScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { reminder } = route.params || {};

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create Reminder model instance for safe defaults
  const reminderModel = reminder ? new Reminder(reminder) : new Reminder();

  // Form state with model defaults
  const [title, setTitle] = useState(reminderModel.title);
  const [description, setDescription] = useState(reminderModel.description);
  const [selectedType, setSelectedType] = useState(reminderModel.type);
  const [selectedCategory, setSelectedCategory] = useState(
    reminderModel.category
  );
  const [selectedPriority, setSelectedPriority] = useState(
    reminderModel.priority
  );

  // Date and time state
  const [dateDay, setDateDay] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateYear, setDateYear] = useState("");
  const [timeHour, setTimeHour] = useState("");
  const [timeMinute, setTimeMinute] = useState("");

  useEffect(() => {
    loadUserProfile();

    // Initialize date/time values using Reminder model
    if (reminderModel.dueDate) {
      const dueDate = reminderModel.getSafeDueDate();

      if (dueDate) {
        setDateDay(dueDate.getDate().toString());
        setDateMonth((dueDate.getMonth() + 1).toString());
        setDateYear(dueDate.getFullYear().toString());
        setTimeHour(dueDate.getHours().toString());
        setTimeMinute(dueDate.getMinutes().toString());
      }
    }
  }, [user, reminder]);

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

  const validateDateTime = () => {
    // Validate and combine date and time
    const dayNum = parseInt(dateDay);
    const monthNum = parseInt(dateMonth);
    const yearNum = parseInt(dateYear);
    const hourNum = parseInt(timeHour);
    const minuteNum = parseInt(timeMinute);

    if (
      isNaN(dayNum) ||
      isNaN(monthNum) ||
      isNaN(yearNum) ||
      isNaN(hourNum) ||
      isNaN(minuteNum)
    ) {
      Alert.alert(
        "Thời gian không hợp lệ",
        "Vui lòng nhập đầy đủ ngày giờ hợp lệ."
      );
      return null;
    }

    if (
      dayNum < 1 ||
      dayNum > 31 ||
      monthNum < 1 ||
      monthNum > 12 ||
      hourNum < 0 ||
      hourNum > 23 ||
      minuteNum < 0 ||
      minuteNum > 59
    ) {
      Alert.alert(
        "Thời gian không hợp lệ",
        "Vui lòng nhập thời gian trong phạm vi hợp lệ."
      );
      return null;
    }

    const dueDateTime = new Date(
      yearNum,
      monthNum - 1,
      dayNum,
      hourNum,
      minuteNum
    );

    if (isNaN(dueDateTime.getTime()) || dueDateTime <= new Date()) {
      Alert.alert(
        "Thời gian không hợp lệ",
        "Vui lòng chọn thời gian trong tương lai."
      );
      return null;
    }

    return dueDateTime;
  };

  const handleUpdateReminder = async () => {
    if (!title.trim()) {
      Alert.alert("Thiếu tiêu đề", "Vui lòng nhập tiêu đề cho nhắc nhở.");
      return;
    }

    const dueDateTime = validateDateTime();
    if (!dueDateTime) {
      return; // Validation failed
    }

    // Check if changing from personal to couple or vice versa
    const isChangingType = selectedType !== reminder?.type;

    if (isChangingType) {
      const typeChangeMessage =
        selectedType === REMINDER_TYPES.COUPLE
          ? "Nhắc nhở sẽ được chia sẻ với người yêu của bạn."
          : "Nhắc nhở sẽ chỉ hiển thị cho bạn.";

      Alert.alert(
        "Thay đổi loại nhắc nhở",
        `Bạn có chắc chắn muốn thay đổi nhắc nhở này thành "${
          selectedType === REMINDER_TYPES.COUPLE ? "Cặp đôi" : "Cá nhân"
        }"?\n\n${typeChangeMessage}`,
        [
          { text: "Hủy", style: "cancel" },
          { text: "Xác nhận", onPress: () => performUpdate(dueDateTime) },
        ]
      );
    } else {
      performUpdate(dueDateTime);
    }
  };

  const performUpdate = async (dueDateTime) => {
    setSubmitting(true);
    try {
      // Create updated Reminder model instance
      const updatedReminderModel = new Reminder({
        ...reminderModel.toFirestore(), // Start with existing data
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        priority: selectedPriority,
        type: selectedType,
        dueDate: dueDateTime,
        // Update coupleId based on new type
        coupleId:
          selectedType === REMINDER_TYPES.COUPLE ? userProfile?.coupleId : null,
      });

      // Validate using model
      if (!updatedReminderModel.isValid()) {
        Alert.alert(
          "Dữ liệu không hợp lệ",
          "Vui lòng kiểm tra lại thông tin nhắc nhở."
        );
        return;
      }

      console.log(
        "Updating reminder with model:",
        updatedReminderModel.toFirestore()
      );
      await updateReminder(reminder.id, updatedReminderModel.toFirestore());

      const categoryInfo = getCategoryDisplayInfo(selectedCategory);
      Alert.alert(
        "Cập nhật thành công! ⏰",
        `Đã cập nhật nhắc nhở "${categoryInfo.name}" thành công!`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error updating reminder:", error);
      Alert.alert("Lỗi", `Có lỗi xảy ra: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    const hasChanges =
      title !== (reminder?.title || "") ||
      description !== (reminder?.description || "") ||
      selectedCategory !==
        (reminder?.category || REMINDER_CATEGORIES.SPECIAL_OCCASIONS) ||
      selectedPriority !== (reminder?.priority || REMINDER_PRIORITIES.MEDIUM) ||
      selectedType !== (reminder?.type || REMINDER_TYPES.PERSONAL);

    if (hasChanges) {
      Alert.alert(
        "Hủy chỉnh sửa",
        "Bạn có muốn hủy chỉnh sửa? Các thay đổi sẽ bị mất.",
        [
          { text: "Tiếp tục chỉnh sửa", style: "cancel" },
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

  const formatDateTime = () => {
    if (!dateDay || !dateMonth || !dateYear || !timeHour || !timeMinute) {
      return "Chưa đặt thời gian";
    }

    const dayNum = parseInt(dateDay);
    const monthNum = parseInt(dateMonth);
    const yearNum = parseInt(dateYear);
    const hourNum = parseInt(timeHour);
    const minuteNum = parseInt(timeMinute);

    if (
      isNaN(dayNum) ||
      isNaN(monthNum) ||
      isNaN(yearNum) ||
      isNaN(hourNum) ||
      isNaN(minuteNum)
    ) {
      return "Thời gian không hợp lệ";
    }
    const combined = new Date(
      yearNum,
      monthNum - 1,
      dayNum,
      hourNum,
      minuteNum
    );

    if (isNaN(combined.getTime())) {
      return "Thời gian không hợp lệ";
    }

    return formatDateString(combined, "datetime", "vi-VN");
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
              const categoryInfo = getCategoryDisplayInfo(category);
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
        <Text style={styles.typeHelperText}>
          Bạn có thể thay đổi nhắc nhở từ cá nhân thành chia sẻ với người yêu
        </Text>
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
            {selectedType === REMINDER_TYPES.PERSONAL && (
              <Text style={styles.typeDescription}>Chỉ bạn xem được</Text>
            )}
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
                  "Bạn cần kết nối với người yêu để chia sẻ nhắc nhở.",
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
            {selectedType === REMINDER_TYPES.COUPLE && (
              <Text style={styles.typeDescription}>Cả hai đều xem được</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Type Change Warning */}
        {selectedType !== reminder?.type && (
          <View style={styles.changeWarning}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.changeWarningText}>
              {selectedType === REMINDER_TYPES.COUPLE
                ? "Nhắc nhở sẽ được chia sẻ với người yêu sau khi lưu"
                : "Nhắc nhở sẽ chỉ hiển thị cho bạn sau khi lưu"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderDateTimeSelector = () => {
    return (
      <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>Thời gian nhắc nhở</Text>

        {/* Date Input */}
        <View style={styles.dateInputContainer}>
          <Text style={styles.dateLabel}>Ngày:</Text>
          <View style={styles.dateInputRow}>
            <TextInput
              style={styles.dateInput}
              value={dateDay}
              onChangeText={setDateDay}
              placeholder="DD"
              maxLength={2}
              keyboardType="numeric"
            />
            <Text style={styles.dateSeparator}>/</Text>
            <TextInput
              style={styles.dateInput}
              value={dateMonth}
              onChangeText={setDateMonth}
              placeholder="MM"
              maxLength={2}
              keyboardType="numeric"
            />
            <Text style={styles.dateSeparator}>/</Text>
            <TextInput
              style={[styles.dateInput, styles.yearInput]}
              value={dateYear}
              onChangeText={setDateYear}
              placeholder="YYYY"
              maxLength={4}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Time Input */}
        <View style={styles.dateInputContainer}>
          <Text style={styles.dateLabel}>Giờ:</Text>
          <View style={styles.dateInputRow}>
            <TextInput
              style={styles.dateInput}
              value={timeHour}
              onChangeText={setTimeHour}
              placeholder="HH"
              maxLength={2}
              keyboardType="numeric"
            />
            <Text style={styles.dateSeparator}>:</Text>
            <TextInput
              style={styles.dateInput}
              value={timeMinute}
              onChangeText={setTimeMinute}
              placeholder="MM"
              maxLength={2}
              keyboardType="numeric"
            />
            <Text style={styles.timeNote}>(24h)</Text>
          </View>
        </View>

        <Text style={styles.dateTimePreview}>
          Nhắc nhở vào: {formatDateTime()}
        </Text>
      </View>
    );
  };

  if (!reminder) {
    return (
      <LoveBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Không tìm thấy nhắc nhở</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </LoveBackground>
    );
  }

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

          <Text style={styles.headerTitle}>Chỉnh sửa nhắc nhở</Text>

          <TouchableOpacity
            style={[styles.saveButton, submitting && styles.disabledButton]}
            onPress={handleUpdateReminder}
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
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#999",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
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
  dateInputContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C2185B",
    marginBottom: 8,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dateInput: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#FCE4EC",
    textAlign: "center",
    minWidth: 50,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  yearInput: {
    minWidth: 80,
  },
  dateSeparator: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E91E63",
    marginHorizontal: 8,
  },
  timeNote: {
    fontSize: 12,
    color: "#8E24AA",
    marginLeft: 8,
    fontStyle: "italic",
  },
  dateTimePreview: {
    fontSize: 14,
    color: "#8E24AA",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  typeHelperText: {
    fontSize: 14,
    color: "#8E24AA",
    marginBottom: 12,
    fontStyle: "italic",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
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
    marginTop: 4,
  },
  selectedTypeButtonText: {
    color: "#FFF",
  },
  typeDescription: {
    fontSize: 12,
    color: "#FFF",
    marginTop: 4,
    textAlign: "center",
  },
  changeWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FF9800",
  },
  changeWarningText: {
    fontSize: 14,
    color: "#E65100",
    marginLeft: 8,
    flex: 1,
  },
});

export default EditReminderScreen;

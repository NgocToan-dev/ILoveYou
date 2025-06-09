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
import {
  updateNote,
  NOTE_TYPES,
  NOTE_CATEGORIES,
  getNoteCategoryDisplayInfo,
} from "@shared/services/firebase/notes";
import { getUserProfile } from "@shared/services/firebase/firestore";
import { Note } from "@shared/models";

const EditNoteScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { note } = route.params || {};

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create Note model instance for safe defaults
  const noteModel = note ? new Note(note) : new Note();

  // Form state with model defaults
  const [title, setTitle] = useState(noteModel.title);
  const [content, setContent] = useState(noteModel.content);
  const [selectedType, setSelectedType] = useState(noteModel.type);
  const [selectedCategory, setSelectedCategory] = useState(noteModel.category);

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

  const handleUpdateNote = async () => {
    if (!title.trim()) {
      Alert.alert("Thiếu tiêu đề", "Vui lòng nhập tiêu đề cho ghi chú.");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Thiếu nội dung", "Vui lòng nhập nội dung cho ghi chú.");
      return;
    }

    if (selectedType === NOTE_TYPES.SHARED && !userProfile?.coupleId) {
      Alert.alert(
        "Chưa kết nối",
        "Bạn cần kết nối với người yêu để chia sẻ ghi chú.",
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

    // Check if changing from private to shared or vice versa
    const isChangingType = selectedType !== note?.type;

    if (isChangingType) {
      const typeChangeMessage =
        selectedType === NOTE_TYPES.SHARED
          ? "Ghi chú sẽ được chia sẻ với người yêu của bạn."
          : "Ghi chú sẽ chỉ hiển thị cho bạn.";

      Alert.alert(
        "Thay đổi quyền riêng tư",
        `Bạn có chắc chắn muốn thay đổi ghi chú này thành "${selectedType === NOTE_TYPES.SHARED ? "Chia sẻ" : "Riêng tư"
        }"?\n\n${typeChangeMessage}`,
        [
          { text: "Hủy", style: "cancel" },
          { text: "Xác nhận", onPress: () => performUpdate() },
        ]
      );
    } else {
      performUpdate();
    }
  };

  const performUpdate = async () => {
    setSubmitting(true);
    try {
      // Create updated Note model instance
      const updatedNoteModel = new Note({
        ...noteModel.toFirestore(), // Start with existing data
        title: title.trim(),
        content: content.trim(),
        category: selectedCategory,
        type: selectedType,
        // Update coupleId based on new type
        coupleId:
          selectedType === NOTE_TYPES.SHARED ? userProfile?.coupleId : null,
      });

      // Validate using model
      if (!updatedNoteModel.isValid()) {
        Alert.alert(
          "Dữ liệu không hợp lệ",
          "Vui lòng kiểm tra lại thông tin ghi chú."
        );
        return;
      }

      console.log("Updating note with model:", updatedNoteModel.toFirestore());
      await updateNote(note.id, updatedNoteModel.toFirestore());

      const categoryInfo = getNoteCategoryDisplayInfo(selectedCategory);
      Alert.alert(
        "Cập nhật thành công! 💕",
        `Đã cập nhật ghi chú "${categoryInfo.name}" ${selectedType === NOTE_TYPES.SHARED ? "chia sẻ" : "riêng tư"
        } thành công!`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error updating note:", error);
      Alert.alert("Lỗi", `Có lỗi xảy ra: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    const hasChanges =
      title !== (note?.title || "") ||
      content !== (note?.content || "") ||
      selectedCategory !== (note?.category || NOTE_CATEGORIES.LOVE_LETTERS) ||
      selectedType !== (note?.type || NOTE_TYPES.PRIVATE);

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

  const renderCategorySelector = () => {
    const categories = [
      NOTE_CATEGORIES.LOVE_LETTERS,
      NOTE_CATEGORIES.MEMORIES,
      NOTE_CATEGORIES.DREAMS,
      NOTE_CATEGORIES.GRATITUDE,
    ];

    return (
      <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>Danh mục</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const categoryInfo = getNoteCategoryDisplayInfo(category);
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
      </View>
    );
  };

  const renderTypeSelector = () => {
    return (
      <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>Quyền riêng tư</Text>
        <Text style={styles.typeHelperText}>
          Bạn có thể thay đổi ghi chú từ riêng tư thành chia sẻ với người yêu
        </Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === NOTE_TYPES.PRIVATE && styles.selectedTypeButton,
            ]}
            onPress={() => setSelectedType(NOTE_TYPES.PRIVATE)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="person"
              size={20}
              color={selectedType === NOTE_TYPES.PRIVATE ? "#FFF" : "#8E24AA"}
            />
            <Text
              style={[
                styles.typeButtonText,
                selectedType === NOTE_TYPES.PRIVATE &&
                styles.selectedTypeButtonText,
              ]}
            >
              Riêng tư
            </Text>
            {selectedType === NOTE_TYPES.PRIVATE && (
              <Text style={styles.typeDescription}>Chỉ bạn xem được</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === NOTE_TYPES.SHARED && styles.selectedTypeButton,
              !userProfile?.coupleId && styles.disabledButton,
            ]}
            onPress={() => {
              if (userProfile?.coupleId) {
                setSelectedType(NOTE_TYPES.SHARED);
              } else {
                Alert.alert(
                  "Chưa kết nối",
                  "Bạn cần kết nối với người yêu để chia sẻ ghi chú.",
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
              color={selectedType === NOTE_TYPES.SHARED ? "#FFF" : "#E91E63"}
            />
            <Text
              style={[
                styles.typeButtonText,
                selectedType === NOTE_TYPES.SHARED &&
                styles.selectedTypeButtonText,
              ]}
            >
              Chia sẻ
            </Text>
            {selectedType === NOTE_TYPES.SHARED && (
              <Text style={styles.typeDescription}>Cả hai đều xem được</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Type Change Warning */}
        {selectedType !== note?.type && (
          <View style={styles.changeWarning}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.changeWarningText}>
              {selectedType === NOTE_TYPES.SHARED
                ? "Ghi chú sẽ được chia sẻ với người yêu sau khi lưu"
                : "Ghi chú sẽ chỉ hiển thị cho bạn sau khi lưu"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!note) {
    return (
      <LoveBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Không tìm thấy ghi chú</Text>
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

          <Text style={styles.headerTitle}>Chỉnh sửa ghi chú</Text>

          <TouchableOpacity
            style={[styles.saveButton, submitting && styles.disabledButton]}
            onPress={handleUpdateNote}
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

          {/* Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Tiêu đề</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Nhập tiêu đề ghi chú..."
              placeholderTextColor="#CCC"
              maxLength={100}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          {/* Content Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Nội dung</Text>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Viết nội dung ghi chú của bạn..."
              placeholderTextColor="#CCC"
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.characterCount}>{content.length}/2000</Text>
          </View>
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
  typeHelperText: {
    fontSize: 14,
    color: "#8E24AA",
    marginBottom: 12,
    fontStyle: "italic",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "48%",
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
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E24AA",
    textAlign: "center",
  },
  selectedCategoryName: {
    color: "#C2185B",
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
  contentInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#FCE4EC",
    minHeight: 150,
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
});

export default EditNoteScreen;

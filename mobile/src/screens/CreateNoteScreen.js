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
  createNote,
  NOTE_CATEGORIES,
  NOTE_TYPES,
  getNoteCategoryDisplayInfo,
} from "@shared/services/firebase";
import { getUserProfile } from "@shared/services/firebase/firestore";
import { Note } from "@shared/models";

const CreateNoteScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { type: initialType, category: initialCategory } = route.params || {};

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] = useState(
    initialType || NOTE_TYPES.PRIVATE
  );
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || NOTE_CATEGORIES.LOVE_LETTERS
  );

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

  const handleCreateNote = async () => {
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
        "Bạn cần kết nối với người yêu để tạo ghi chú chia sẻ.",
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

    setSubmitting(true);
    try {
      // Create Note model instance with validation
      const noteModel = new Note({
        title: title.trim(),
        content: content.trim(),
        category: selectedCategory,
        type: selectedType,
        userId: user.uid,
        coupleId:
          selectedType === NOTE_TYPES.SHARED ? userProfile?.coupleId : null,
      });

      // Validate using model
      if (!noteModel.isValid()) {
        Alert.alert(
          "Dữ liệu không hợp lệ",
          "Vui lòng kiểm tra lại thông tin ghi chú."
        );
        return;
      }

      console.log("Creating note with model:", noteModel.toFirestore());
      console.log("User profile coupleId:", userProfile?.coupleId);
      console.log("Selected type:", selectedType);
      console.log("Final note data:", {
        ...noteModel.toFirestore(),
        userId: user.uid,
        coupleId:
          selectedType === NOTE_TYPES.SHARED ? userProfile?.coupleId : null,
      });
      const result = await createNote(noteModel.toFirestore());
      console.log("Create note result:", result);

      if (result.success) {
        const categoryInfo = getNoteCategoryDisplayInfo(selectedCategory);
        Alert.alert(
          "Tạo thành công! 💕",
          `Đã tạo ghi chú "${categoryInfo.name}" ${
            selectedType === NOTE_TYPES.SHARED ? "chia sẻ" : "riêng tư"
          } thành công!`,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        console.error("Create note failed:", result.error);
        Alert.alert(
          "Lỗi",
          result.error || "Không thể tạo ghi chú. Vui lòng thử lại."
        );
      }
    } catch (error) {
      console.error("Error creating note:", error);
      Alert.alert("Lỗi", `Có lỗi xảy ra: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        "Hủy tạo ghi chú",
        "Bạn có muốn hủy tạo ghi chú? Nội dung đã nhập sẽ bị mất.",
        [
          { text: "Tiếp tục viết", style: "cancel" },
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
                  "Bạn cần kết nối với người yêu để tạo ghi chú chia sẻ.",
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
          </TouchableOpacity>
        </View>
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

          <Text style={styles.headerTitle}>Tạo ghi chú mới</Text>

          <TouchableOpacity
            style={[styles.saveButton, submitting && styles.disabledButton]}
            onPress={handleCreateNote}
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

export default CreateNoteScreen;

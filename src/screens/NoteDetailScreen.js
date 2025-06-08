import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../context/AuthContext";
import { LoveBackground, LoadingIndicator } from "../components";
import {
  deleteNote,
  getCategoryDisplayInfo,
  NOTE_TYPES,
} from "../services/firebase/notes";
import { Note } from "../models";
import { formatDateString } from "../utils/dateUtils";

const NoteDetailScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { note } = route.params || {};

  const [loading, setLoading] = useState(false);

  const handleDeleteNote = () => {
    Alert.alert(
      "Xóa ghi chú",
      `Bạn có chắc chắn muốn xóa ghi chú "${note.title}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteNote(note.id);
              Alert.alert("Thành công", "Đã xóa ghi chú.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error("Error deleting note:", error);
              Alert.alert("Lỗi", "Không thể xóa ghi chú.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditNote = () => {
    navigation.navigate("EditNote", {
      note,
    });
  };

  const handleShareNote = async () => {
    try {
      const shareContent = `📝 ${note.title}\n\n${note.content}\n\n💕 Từ ILoveYou App`;

      await Share.share({
        message: shareContent,
        title: note.title,
      });
    } catch (error) {
      console.error("Error sharing note:", error);
      Alert.alert("Lỗi", "Không thể chia sẻ ghi chú.");
    }
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

  // Use Note model for safe data access
  const noteModel = new Note(note);
  const categoryInfo = getCategoryDisplayInfo(noteModel.category);

  // Safe date handling using model methods
  const createdDateString = noteModel.getFormattedCreatedDate();
  const updatedDateString = noteModel.getFormattedUpdatedDate();
  const isEdited = noteModel.wasEdited();
  // Get formatted dates for display using the new formatDateString utility
  const displayDate =
    formatDateString(
      noteModel.updatedAt || noteModel.createdAt,
      "medium",
      "vi-VN"
    ) || "Không xác định";
  const displayTime =
    formatDateString(
      noteModel.updatedAt || noteModel.createdAt,
      "time",
      "vi-VN"
    ) || "";
  const relativeTime =
    formatDateString(
      noteModel.updatedAt || noteModel.createdAt,
      "relative",
      "vi-VN"
    ) || "";

  return (
    <LoveBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#C2185B" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Chi tiết ghi chú</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShareNote}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={24} color="#C2185B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleEditNote}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={24} color="#C2185B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDeleteNote}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <LoadingIndicator size="small" color="#FF5722" />
              ) : (
                <Ionicons name="trash-outline" size={24} color="#FF5722" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Badge */}
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryInfo.color + "20" },
            ]}
          >
            <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
            <Text style={[styles.categoryText, { color: categoryInfo.color }]}>
              {categoryInfo.name}
            </Text>
          </View>

          {/* Note Content */}
          <View style={styles.noteCard}>
            {/* Title */}
            <Text style={styles.noteTitle}>
              {noteModel.title || "Không có tiêu đề"}
            </Text>

            {/* Meta Info */}
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Ionicons
                  name={noteModel.isShared() ? "people" : "person"}
                  size={16}
                  color="#8E24AA"
                />
                <Text style={styles.metaText}>
                  {noteModel.isShared()
                    ? "Ghi chú chia sẻ"
                    : "Ghi chú riêng tư"}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color="#8E24AA" />
                <Text style={styles.metaText}>
                  {displayDate} {displayTime && `${displayTime}`}
                </Text>
              </View>

              {isEdited && (
                <View style={styles.metaItem}>
                  <Ionicons name="create-outline" size={16} color="#FF9800" />
                  <Text style={[styles.metaText, { color: "#FF9800" }]}>
                    Đã chỉnh sửa
                  </Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              <Text style={styles.noteContent}>
                {noteModel.content || "Không có nội dung"}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareNote}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={20} color="#E91E63" />
              <Text style={styles.actionButtonText}>Chia sẻ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditNote}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color="#8E24AA" />
              <Text style={styles.actionButtonText}>Chỉnh sửa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDeleteNote}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <LoadingIndicator size="small" color="#FF5722" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#FF5722" />
              )}
              <Text style={[styles.actionButtonText, { color: "#FF5722" }]}>
                Xóa
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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
    backgroundColor: "#E91E63",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C2185B",
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noteCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FCE4EC",
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#C2185B",
    marginBottom: 16,
    lineHeight: 32,
  },
  metaInfo: {
    marginBottom: 20,
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 14,
    color: "#8E24AA",
    marginLeft: 8,
  },
  contentSection: {
    borderTopWidth: 1,
    borderTopColor: "#FCE4EC",
    paddingTop: 20,
  },
  noteContent: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  actionsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCE4EC",
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButton: {
    borderColor: "#FFCDD2",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E24AA",
    marginLeft: 8,
  },
});

export default NoteDetailScreen;

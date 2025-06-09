import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuthContext } from "../context/AuthContext";
import { LoveBackground, LoadingIndicator } from "../components";
import {
  subscribeToUserNotesByCategory,
  subscribeToCoupleNotesByCategory,
  getNoteCategoryDisplayInfo,
  deleteNote,
  NOTE_TYPES,
} from "@shared/services/firebase/notes";
import { formatDateString } from "@shared/utils/dateUtils";
import { getUserProfile } from "@shared/services/firebase/firestore";

const NotesListScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { type, category, coupleId } = route.params || {};

  const [userProfile, setUserProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    let unsubscribe = null;

    if (user && category) {
      if (type === NOTE_TYPES.PRIVATE) {
        unsubscribe = subscribeToUserNotesByCategory(
          user.uid,
          category,
          setNotes
        );
      } else if (type === NOTE_TYPES.SHARED && coupleId) {
        unsubscribe = subscribeToCoupleNotesByCategory(
          coupleId,
          category,
          setNotes
        );
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, type, category, coupleId]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleDeleteNote = (note) => {
    Alert.alert(
      "Xóa ghi chú",
      `Bạn có chắc chắn muốn xóa ghi chú "${note.title}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteNote(note.id);
              Alert.alert("Thành công", "Đã xóa ghi chú.");
            } catch (error) {
              console.error("Error deleting note:", error);
              Alert.alert("Lỗi", "Không thể xóa ghi chú.");
            }
          },
        },
      ]
    );
  };

  const navigateToCreateNote = () => {
    navigation.navigate("CreateNote", {
      type,
      category,
      coupleId: userProfile?.coupleId,
    });
  };
  const renderNoteCard = (note) => {
    const displayDate =
      formatDateString(note.updatedAt || note.createdAt, "smart", "vi-VN") ||
      "Không xác định";

    return (
      <View key={note.id} style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <View style={styles.noteInfo}>
            <Text style={styles.noteTitle} numberOfLines={2}>
              {note.title}
            </Text>
            <Text style={styles.noteDate}>{displayDate}</Text>
          </View>

          <View style={styles.noteActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("NoteDetail", { note })}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={20} color="#8E24AA" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteNote(note)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color="#FF5722" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.noteContent} numberOfLines={3}>
          {note.content}
        </Text>

        <View style={styles.noteFooter}>
          <View style={styles.noteType}>
            <Ionicons
              name={note.type === NOTE_TYPES.SHARED ? "people" : "person"}
              size={14}
              color="#8E24AA"
            />
            <Text style={styles.noteTypeText}>
              {note.type === NOTE_TYPES.SHARED ? "Chia sẻ" : "Riêng tư"}
            </Text>
          </View>

          {note.updatedAt &&
            note.updatedAt.seconds > note.createdAt?.seconds && (
              <Text style={styles.editedLabel}>Đã chỉnh sửa</Text>
            )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <LoveBackground>
        <View style={styles.loadingContainer}>
          <LoadingIndicator message="Đang tải ghi chú..." />
        </View>
      </LoveBackground>
    );
  }

        const categoryInfo = getNoteCategoryDisplayInfo(category);

  return (
    <LoveBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#C2185B" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{categoryInfo.name}</Text>
            <Text style={styles.headerSubtitle}>
              {type === NOTE_TYPES.SHARED
                ? "Ghi chú chia sẻ"
                : "Ghi chú riêng tư"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={navigateToCreateNote}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#E91E63"]}
              tintColor="#E91E63"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Category Header */}
          <View
            style={[
              styles.categoryHeader,
              { backgroundColor: categoryInfo.color + "20" },
            ]}
          >
            <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
            <Text style={styles.categoryName}>{categoryInfo.name}</Text>
            <Text style={styles.categoryDescription}>
              {categoryInfo.description}
            </Text>
          </View>

          {/* Notes List */}
          <View style={styles.notesSection}>
            {notes.length > 0 ? (
              <View style={styles.notesContainer}>
                {notes.map((note) => renderNoteCard(note))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
                <Text style={styles.emptyTitle}>
                  Chưa có ghi chú {categoryInfo.name.toLowerCase()}
                </Text>
                <Text style={styles.emptySubtitle}>
                  Hãy tạo ghi chú đầu tiên cho danh mục này!
                </Text>

                <TouchableOpacity
                  style={styles.createFirstButton}
                  onPress={navigateToCreateNote}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={styles.createFirstButtonText}>
                    Tạo ghi chú đầu tiên
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C2185B",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8E24AA",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#E91E63",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  categoryHeader: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  categoryEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#C2185B",
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 16,
    color: "#8E24AA",
    textAlign: "center",
    lineHeight: 22,
  },
  notesSection: {
    flex: 1,
  },
  notesContainer: {
    gap: 16,
  },
  noteCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#FCE4EC",
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  noteInfo: {
    flex: 1,
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C2185B",
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 12,
    color: "#999",
  },
  noteActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  noteContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noteType: {
    flexDirection: "row",
    alignItems: "center",
  },
  noteTypeText: {
    fontSize: 12,
    color: "#8E24AA",
    marginLeft: 4,
  },
  editedLabel: {
    fontSize: 12,
    color: "#FF9800",
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#C2185B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8E24AA",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: "#E91E63",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createFirstButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default NotesListScreen;

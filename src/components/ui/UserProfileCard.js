import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "../../utils";

const UserProfileCard = ({
  user,
  isCurrentUser = false,
  onPress,
  showActions = true,
  onEdit,
  onDelete,
  style,
}) => {
  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {getInitials(user?.displayName || user?.email)}
              </Text>
            </View>
          )}
          {isCurrentUser && (
            <View style={styles.currentUserBadge}>
              <Ionicons name="heart" size={12} color="#FFF" />
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.displayName || "Anonymous"}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {isCurrentUser && <Text style={styles.currentUserLabel}>You ❤️</Text>}
        </View>

        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <Ionicons name="create-outline" size={20} color="#FF69B4" />
              </TouchableOpacity>
            )}
            {onDelete && !isCurrentUser && (
              <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
      <View style={styles.footer}>
        <Text style={styles.joinDate}>
          Joined {user?.createdAt ? formatDate(user.createdAt) : "Recently"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#E91E63",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F8BBD9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#F8BBD9",
  },
  avatarPlaceholder: {
    backgroundColor: "#E91E63",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  currentUserBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#E91E63",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#680000",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#444",
    marginBottom: 2,
  },
  currentUserLabel: {
    fontSize: 12,
    color: "#FF69B4",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },  bio: {
    fontSize: 14,
    color: "#222",
    fontStyle: "italic",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#FFE4E6",
    paddingTop: 8,
  },
  joinDate: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});

export default UserProfileCard;

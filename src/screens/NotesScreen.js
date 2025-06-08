import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../context/AuthContext';
import { LoveBackground, LoadingIndicator } from '../components';
import {
  NOTE_CATEGORIES,
  NOTE_TYPES,
  subscribeToUserPrivateNotes,
  subscribeToCoupleSharedNotes,
  getUserNotesCountByCategory,
  getCoupleNotesCountByCategory,
  getCategoryDisplayInfo,
  searchNotes
} from '../services/firebase/notes';
import { getUserProfile } from '../services/firebase/firestore';

const NotesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Notes data
  const [privateNotes, setPrivateNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [privateCounts, setPrivateCounts] = useState({});
  const [sharedCounts, setSharedCounts] = useState({});
  
  // UI state
  const [activeTab, setActiveTab] = useState('private'); // 'private' or 'shared'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    let privateUnsubscribe = null;
    let sharedUnsubscribe = null;

    if (user) {
      // Subscribe to private notes
      privateUnsubscribe = subscribeToUserPrivateNotes(
        user.uid,
        selectedCategory,
        setPrivateNotes
      );

      // Subscribe to shared notes if user has a couple
      if (userProfile?.coupleId) {
        sharedUnsubscribe = subscribeToCoupleSharedNotes(
          userProfile.coupleId,
          selectedCategory,
          setSharedNotes
        );
      }
    }

    return () => {
      if (privateUnsubscribe) privateUnsubscribe();
      if (sharedUnsubscribe) sharedUnsubscribe();
    };
  }, [user, userProfile?.coupleId, selectedCategory]);

  useEffect(() => {
    loadCategoryCounts();
  }, [user, userProfile?.coupleId]);

  useEffect(() => {
    // Perform search when search term changes
    if (searchTerm.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryCounts = async () => {
    if (!user) return;

    try {
      // Load private notes count
      const privateCounts = await getUserNotesCountByCategory(user.uid);
      setPrivateCounts(privateCounts);

      // Load shared notes count if user has a couple
      if (userProfile?.coupleId) {
        const sharedCounts = await getCoupleNotesCountByCategory(userProfile.coupleId);
        setSharedCounts(sharedCounts);
      }
    } catch (error) {
      console.error('Error loading category counts:', error);
    }
  };

  const performSearch = async () => {
    if (!searchTerm.trim() || !user) return;

    setIsSearching(true);
    try {
      const results = await searchNotes(
        user.uid,
        userProfile?.coupleId,
        searchTerm.trim()
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching notes:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm ghi chú.');
    } finally {
      setIsSearching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await loadCategoryCounts();
    setRefreshing(false);
  };

  const navigateToCreateNote = (type, category) => {
    navigation.navigate('CreateNote', {
      type,
      category,
      coupleId: userProfile?.coupleId
    });
  };

  const navigateToNoteDetail = (note) => {
    // TODO: Implement NoteDetail screen
    Alert.alert(
      'Chi tiết ghi chú',
      `Tính năng xem chi tiết ghi chú "${note.title}" sẽ sớm được hoàn thiện!\n\nBạn có thể xem danh sách ghi chú ngay tại màn hình này.`,
      [{ text: 'Đã hiểu' }]
    );
  };

  const navigateToNotesList = (type, category) => {
    navigation.navigate('NotesList', {
      type,
      category,
      coupleId: userProfile?.coupleId
    });
  };

  const renderCategoryCard = (category, type) => {
    const categoryInfo = getCategoryDisplayInfo(category);
    const count = type === NOTE_TYPES.PRIVATE 
      ? privateCounts[category] || 0 
      : sharedCounts[category] || 0;

    return (
      <TouchableOpacity
        key={`${type}-${category}`}
        style={[styles.categoryCard, { borderLeftColor: categoryInfo.color }]}
        onPress={() => navigateToNotesList(type, category)}
        activeOpacity={0.8}
      >
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color }]}>
            <Ionicons name={categoryInfo.icon} size={24} color="#FFF" />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{categoryInfo.name}</Text>
            <Text style={styles.categoryDescription}>{categoryInfo.description}</Text>
          </View>
          <View style={styles.categoryCount}>
            <Text style={styles.countNumber}>{count}</Text>
            <Text style={styles.countLabel}>ghi chú</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: categoryInfo.color }]}
          onPress={() => navigateToCreateNote(type, category)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Thêm mới</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderRecentNote = (note) => {
    const categoryInfo = getCategoryDisplayInfo(note.category);
    
    return (
      <TouchableOpacity
        key={note.id}
        style={styles.noteCard}
        onPress={() => navigateToNoteDetail(note)}
        activeOpacity={0.8}
      >
        <View style={styles.noteHeader}>
          <View style={[styles.noteIcon, { backgroundColor: categoryInfo.color }]}>
            <Ionicons name={categoryInfo.icon} size={16} color="#FFF" />
          </View>
          <View style={styles.noteInfo}>
            <Text style={styles.noteTitle} numberOfLines={1}>
              {note.title || 'Không có tiêu đề'}
            </Text>
            <Text style={styles.noteCategory}>{categoryInfo.name}</Text>
          </View>
          <View style={styles.noteType}>
            <Ionicons 
              name={note.type === NOTE_TYPES.SHARED ? 'people' : 'person'} 
              size={16} 
              color="#8E24AA" 
            />
          </View>
        </View>
        
        <Text style={styles.noteContent} numberOfLines={2}>
          {note.content || 'Không có nội dung'}
        </Text>
        
        <Text style={styles.noteDate}>
          {note.updatedAt ? 
            new Date(note.updatedAt.seconds * 1000).toLocaleDateString('vi-VN') :
            'Ngày không xác định'
          }
        </Text>
      </TouchableOpacity>
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

  const currentNotes = activeTab === 'private' ? privateNotes : sharedNotes;
  const recentNotes = searchTerm.trim() ? searchResults : currentNotes.slice(0, 5);

  return (
    <LoveBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E91E63']}
            tintColor="#E91E63"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ghi chú tình yêu 💕</Text>
          <Text style={styles.subtitle}>
            Lưu giữ những khoảnh khắc và cảm xúc đẹp nhất
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E24AA" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm ghi chú..."
              placeholderTextColor="#C2185B"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchTerm('')}
                style={styles.clearButton}
              >
                <Ionicons name="close" size={20} color="#8E24AA" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!searchTerm.trim() && (
          <>
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'private' && styles.activeTab]}
                onPress={() => setActiveTab('private')}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={activeTab === 'private' ? '#FFF' : '#8E24AA'} 
                />
                <Text style={[
                  styles.tabText, 
                  activeTab === 'private' && styles.activeTabText
                ]}>
                  Riêng tư
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'shared' && styles.activeTab]}
                onPress={() => setActiveTab('shared')}
                activeOpacity={0.8}
                disabled={!userProfile?.coupleId}
              >
                <Ionicons 
                  name="people" 
                  size={20} 
                  color={activeTab === 'shared' ? '#FFF' : '#8E24AA'} 
                />
                <Text style={[
                  styles.tabText, 
                  activeTab === 'shared' && styles.activeTabText,
                  !userProfile?.coupleId && styles.disabledText
                ]}>
                  Chia sẻ
                </Text>
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Danh mục</Text>
              <View style={styles.categoriesContainer}>
                {Object.values(NOTE_CATEGORIES).map(category => 
                  renderCategoryCard(category, activeTab)
                )}
              </View>
            </View>
          </>
        )}

        {/* Recent Notes or Search Results */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>
            {searchTerm.trim() ? (
              isSearching ? 'Đang tìm kiếm...' : `Kết quả tìm kiếm (${searchResults.length})`
            ) : (
              'Ghi chú gần đây'
            )}
          </Text>
          
          {recentNotes.length > 0 ? (
            <View style={styles.notesContainer}>
              {recentNotes.map(note => renderRecentNote(note))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={searchTerm.trim() ? 'search' : 'document-outline'} 
                size={48} 
                color="#F06292" 
              />
              <Text style={styles.emptyTitle}>
                {searchTerm.trim() ? 'Không tìm thấy ghi chú' : 'Chưa có ghi chú nào'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm.trim() ? 
                  'Thử tìm kiếm với từ khóa khác' : 
                  'Hãy tạo ghi chú đầu tiên của bạn!'
                }
              </Text>
            </View>
          )}
        </View>

        {/* No Couple Connection Message */}
        {!userProfile?.coupleId && activeTab === 'shared' && (
          <View style={styles.noCoupleContainer}>
            <Ionicons name="heart-outline" size={48} color="#F06292" />
            <Text style={styles.noCoupleTitle}>Chưa kết nối với người yêu</Text>
            <Text style={styles.noCoupleSubtitle}>
              Kết nối với người yêu để chia sẻ ghi chú cùng nhau
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => navigation.navigate('Couple')}
              activeOpacity={0.8}
            >
              <Ionicons name="link" size={20} color="#FFF" />
              <Text style={styles.connectButtonText}>Kết nối ngay</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LoveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginTop: 60,
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C2185B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E24AA',
    textAlign: 'center',
    lineHeight: 24,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#C2185B',
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#E91E63',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E24AA',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FFF',
  },
  disabledText: {
    color: '#CCC',
  },
  categoriesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 16,
  },
  categoriesContainer: {
    gap: 16,
  },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FCE4EC',
    borderLeftWidth: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#8E24AA',
    lineHeight: 20,
  },
  categoryCount: {
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  countLabel: {
    fontSize: 12,
    color: '#8E24AA',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  recentSection: {
    marginBottom: 32,
  },
  notesContainer: {
    gap: 12,
  },
  noteCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C2185B',
    marginBottom: 2,
  },
  noteCategory: {
    fontSize: 12,
    color: '#8E24AA',
  },
  noteType: {
    marginLeft: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#8E24AA',
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C2185B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E24AA',
    textAlign: 'center',
    lineHeight: 20,
  },
  noCoupleContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#F06292',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#FCE4EC',
  },
  noCoupleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C2185B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noCoupleSubtitle: {
    fontSize: 16,
    color: '#8E24AA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#E91E63',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default NotesScreen;
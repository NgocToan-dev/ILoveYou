import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Alert,
  RefreshControl 
} from 'react-native';
import { 
  LoveButton, 
  LoadingIndicator, 
  LoveBackground,
  UserProfileCard 
} from '../../components';
import { getCurrentUser } from '../../services/firebase/auth';
import { getOrCreateUser, getCouple } from '../../services/firebase/firestore';
import { formatDate } from '../../utils';

const UserListScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [coupleData, setCoupleData] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCoupleData();
  }, []);
  const loadCoupleData = async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        
        // Load couple data
        const { couple, error } = await getCouple(user.uid);
        if (couple) {
          setCoupleData(couple);
          
          // Find partner's ID
          const partnerId = couple.members?.find(id => id !== user.uid);
          if (partnerId) {
            // Load partner's profile using getOrCreateUser with fallback data
            const { user: partner, error: partnerError } = await getOrCreateUser(partnerId, {
              uid: partnerId,
              displayName: 'Partner',
              email: 'partner@example.com' // This will be overridden if partner exists
            });
            if (partner) {
              setPartnerProfile(partner);
            } else if (partnerError) {
              console.warn('Partner profile error:', partnerError);
              // Set a placeholder partner profile
              setPartnerProfile({
                id: partnerId,
                displayName: 'Partner',
                email: 'Loading...',
                bio: 'Partner profile is being set up...'
              });
            }
          }
        } else {
          console.log('No couple found for user');
        }
      }
    } catch (error) {
      console.error('Error loading couple data:', error);
      Alert.alert(
        'Connection Error',
        'Unable to load couple information. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCoupleData();
  };

  const handleUserPress = (user, isCurrentUser) => {
    if (isCurrentUser) {
      navigation.navigate('UserProfile');
    } else {
      // Show partner profile details
      Alert.alert(
        `${user.displayName || 'Partner'}'s Profile 💕`,
        user.bio || 'No bio available yet.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  };

  const handleEditCurrentUser = () => {
    navigation.navigate('UserEdit', { 
      user: currentUser, 
      profile: null // Will be loaded in UserEdit screen
    });
  };

  const handleConnectPartner = () => {
    Alert.alert(
      'Connect with Partner 💕',
      'Feature coming soon! You\'ll be able to send an invitation to your partner.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  if (loading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator 
            message="Loading your love connection..." 
            size="large" 
          />
        </SafeAreaView>
      </LoveBackground>
    );
  }

  return (
    <LoveBackground variant="soft">
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF69B4"
              colors={['#FF69B4']}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Our Love Story 👫</Text>
            <Text style={styles.subtitle}>
              {coupleData ? 'Your beautiful connection' : 'Start your connection'}
            </Text>
          </View>

          {coupleData && (            <View style={styles.coupleInfo}>
              <Text style={styles.coupleTitle}>💕 Couple Since</Text>
              <Text style={styles.coupleDate}>
                {formatDate(coupleData.createdAt)}
              </Text>
            </View>
          )}

          <View style={styles.usersContainer}>
            <Text style={styles.sectionTitle}>
              {coupleData ? 'Our Profiles' : 'My Profile'}
            </Text>

            {/* Current User Card */}
            <UserProfileCard
              user={currentUser}
              isCurrentUser={true}
              onPress={() => handleUserPress(currentUser, true)}
              onEdit={handleEditCurrentUser}
              style={styles.userCard}
            />

            {/* Partner Card */}
            {partnerProfile ? (
              <UserProfileCard
                user={partnerProfile}
                isCurrentUser={false}
                onPress={() => handleUserPress(partnerProfile, false)}
                showActions={false}
                style={styles.userCard}
              />
            ) : coupleData ? (
              <View style={styles.partnerPlaceholder}>
                <Text style={styles.partnerPlaceholderEmoji}>💔</Text>
                <Text style={styles.partnerPlaceholderText}>
                  Partner profile not found
                </Text>
                <Text style={styles.partnerPlaceholderSubtext}>
                  They might not have completed their profile yet
                </Text>
              </View>
            ) : (
              <View style={styles.partnerPlaceholder}>
                <Text style={styles.partnerPlaceholderEmoji}>💘</Text>
                <Text style={styles.partnerPlaceholderText}>
                  No partner connected yet
                </Text>
                <Text style={styles.partnerPlaceholderSubtext}>
                  Invite your partner to join your love story
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionsContainer}>
            {!coupleData && (
              <LoveButton
                title="Connect with Partner 💕"
                onPress={handleConnectPartner}
                variant="primary"
                size="large"
                icon="heart-outline"
                style={styles.actionButton}
              />
            )}

            <LoveButton
              title="Refresh Connection 🔄"
              onPress={handleRefresh}
              variant="secondary"
              size="medium"
              icon="refresh-outline"
              style={styles.actionButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {coupleData 
                ? 'Love grows stronger together! 💝' 
                : 'Every love story starts with a single step 💕'
              }
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LoveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C2185B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6D4C41',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  coupleInfo: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',    shadowColor: '#E91E63',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F8BBD9',
  },
  coupleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 8,
  },
  coupleDate: {
    fontSize: 16,
    color: '#C2185B',
    fontWeight: '600',
  },
  usersContainer: {
    marginBottom: 32,
  },  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A01050',
    textAlign: 'center',
    marginBottom: 20,
  },
  userCard: {
    marginBottom: 16,
  },
  partnerPlaceholder: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 16,
    alignItems: 'center',    shadowColor: '#E91E63',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#F8BBD9',
    borderStyle: 'dashed',
  },
  partnerPlaceholderEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },  partnerPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A01050',
    textAlign: 'center',
    marginBottom: 8,
  },
  partnerPlaceholderSubtext: {
    fontSize: 14,
    color: '#4F2E24',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },  footerText: {
    fontSize: 14,
    color: '#5D4037',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default UserListScreen;
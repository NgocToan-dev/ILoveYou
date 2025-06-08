import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Alert 
} from 'react-native';
import { 
  LoveButton, 
  LoadingIndicator, 
  LoveBackground,
  UserProfileCard 
} from '../../components';
import { getCurrentUser, logOut } from '../../services/firebase/auth';
import { getOrCreateUser } from '../../services/firebase/firestore';
import { getDaysSince } from '../../utils';

const UserProfileScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);
  const loadUserProfile = async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        
        // Load additional user profile data from Firestore using getOrCreateUser
        const { user: profile, error } = await getOrCreateUser(user.uid, user);
        if (profile) {
          setUserProfile(profile);
        } else if (error) {
          console.error('Error loading user profile:', error);
          // Show a more user-friendly error message
          Alert.alert(
            'Profile Load Error',
            'We had trouble loading your profile. Please try refreshing or contact support if the problem persists.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // User is not authenticated, redirect to login
        console.log('No authenticated user found');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to our servers. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('UserEdit', { user: currentUser, profile: userProfile });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? We\'ll miss you! 💔',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logOut();
              // Navigation will be handled by auth state listener
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator 
            message="Loading your lovely profile..." 
            size="large" 
          />
        </SafeAreaView>
      </LoveBackground>
    );
  }

  const displayUser = {
    ...currentUser,
    ...userProfile,
    displayName: currentUser?.displayName || userProfile?.displayName,
    email: currentUser?.email,
    photoURL: currentUser?.photoURL || userProfile?.photoURL,
  };

  return (
    <LoveBackground variant="soft">
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>My Profile 💕</Text>
            <Text style={styles.subtitle}>
              Your beautiful details at a glance
            </Text>
          </View>

          <UserProfileCard
            user={displayUser}
            isCurrentUser={true}
            showActions={false}
            style={styles.profileCard}
          />

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💌</Text>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Messages Sent</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💕</Text>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Love Points</Text>
            </View>
              <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📅</Text>
              <Text style={styles.statNumber}>
                {userProfile?.createdAt 
                  ? getDaysSince(userProfile.createdAt)
                  : 0
                }
              </Text>
              <Text style={styles.statLabel}>Days with Love</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <LoveButton
              title="Edit My Profile ✏️"
              onPress={handleEditProfile}
              variant="primary"
              size="large"
              icon="create-outline"
              style={styles.actionButton}
            />

            <LoveButton
              title="View Couple Profile 👫"
              onPress={() => navigation.navigate('UserList')}
              variant="secondary"
              size="medium"
              icon="people-outline"
              style={styles.actionButton}
            />

            <LoveButton
              title="Sign Out"
              onPress={handleLogout}
              variant="outline"
              size="medium"
              icon="log-out-outline"
              style={styles.logoutButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Keep spreading love and kindness! 💝
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
    color: '#A01050',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4F2E24',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 32,
  },  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#E91E63',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F8BBD9',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#4F2E24',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 8,
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

export default UserProfileScreen;
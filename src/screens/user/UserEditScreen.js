import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert,
  SafeAreaView 
} from 'react-native';
import { 
  LoveInput, 
  LoveButton, 
  LoadingIndicator, 
  LoveBackground 
} from '../../components';
import { updateProfile } from 'firebase/auth';
import { getCurrentUser } from '../../services/firebase/auth';
import { updateUser, getOrCreateUser } from '../../services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';

const UserEditScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const user = route.params?.user;

  useEffect(() => {
    loadUserData();
  }, []);
  const loadUserData = async () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Load user profile from Firestore using getOrCreateUser
        const { user: profile, error } = await getOrCreateUser(currentUser.uid, currentUser);
        
        setFormData({
          displayName: currentUser.displayName || profile?.displayName || '',
          bio: profile?.bio || '',
          phoneNumber: profile?.phoneNumber || '',
        });
        
        if (error) {
          console.warn('Warning loading user data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert(
        'Loading Error',
        'Unable to load your profile data. Using default values.',
        [{ text: 'OK' }]
      );
    } finally {
      setInitialLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }
    
    if (formData.bio.length > 200) {
      newErrors.bio = 'Bio must be less than 200 characters';
    }
    
    if (formData.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
      try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        Alert.alert(
          'Authentication Error', 
          'You need to be signed in to update your profile. Please sign in again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
            },
          ]
        );
        return;
      }

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: formData.displayName.trim(),
      });      // Update Firestore user document
      const userData = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        updatedAt: Timestamp.now(),
      };

      const { error } = await updateUser(currentUser.uid, userData);
      
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert(
          'Profile Updated! 💕',
          'Your lovely profile has been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (initialLoading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator 
            message="Loading your profile..." 
            size="large" 
          />
        </SafeAreaView>
      </LoveBackground>
    );
  }

  if (loading) {
    return (
      <LoveBackground>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingIndicator 
            message="Saving your lovely changes..." 
            size="large" 
          />
        </SafeAreaView>
      </LoveBackground>
    );
  }

  return (
    <LoveBackground variant="soft">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Edit Profile 💕</Text>
              <Text style={styles.subtitle}>
                Update your lovely information
              </Text>
            </View>

            <View style={styles.form}>
              <LoveInput
                value={formData.displayName}
                onChangeText={(value) => updateFormData('displayName', value)}
                placeholder="Your lovely name"
                autoCapitalize="words"
                icon="person-outline"
                error={errors.displayName}
              />

              <View style={styles.inputWithLabel}>
                <Text style={styles.inputLabel}>Bio (Optional)</Text>
                <LoveInput
                  value={formData.bio}
                  onChangeText={(value) => updateFormData('bio', value)}
                  placeholder="Tell your partner something sweet about yourself..."
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                  icon="heart-outline"
                  error={errors.bio}
                  style={styles.bioInput}
                />
                <Text style={styles.characterCount}>
                  {formData.bio.length}/200 characters
                </Text>
              </View>

              <LoveInput
                value={formData.phoneNumber}
                onChangeText={(value) => updateFormData('phoneNumber', value)}
                placeholder="Phone number (Optional)"
                keyboardType="phone-pad"
                icon="call-outline"
                error={errors.phoneNumber}
              />
            </View>

            <View style={styles.buttonsContainer}>
              <LoveButton
                title="Save Changes 💖"
                onPress={handleSave}
                variant="primary"
                size="large"
                icon="checkmark-circle-outline"
                style={styles.saveButton}
              />

              <LoveButton
                title="Cancel"
                onPress={handleCancel}
                variant="outline"
                size="medium"
                icon="close-outline"
                style={styles.cancelButton}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LoveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  form: {
    marginBottom: 32,
  },
  inputWithLabel: {
    marginBottom: 16,
  },  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C2185B',
    marginBottom: 8,
    marginLeft: 4,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },  characterCount: {
    fontSize: 12,
    color: '#8D6E63',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
  buttonsContainer: {
    marginTop: 16,
  },
  saveButton: {
    marginBottom: 16,
  },
  cancelButton: {
    marginBottom: 16,
  },
});

export default UserEditScreen;
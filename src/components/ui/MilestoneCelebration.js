import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const MilestoneCelebration = ({ visible, milestone, onDismiss }) => {
  const { t } = useTranslation();
  
  // Animation values
  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const heartScale1 = useRef(new Animated.Value(0)).current;
  const heartScale2 = useRef(new Animated.Value(0)).current;
  const heartScale3 = useRef(new Animated.Value(0)).current;
  const confettiY = useRef(new Animated.Value(-100)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Main modal animation
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Heart animations with staggered timing
      setTimeout(() => {
        Animated.spring(heartScale1, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, 200);

      setTimeout(() => {
        Animated.spring(heartScale2, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, 400);

      setTimeout(() => {
        Animated.spring(heartScale3, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, 600);

      // Confetti animation
      Animated.timing(confettiY, {
        toValue: height + 100,
        duration: 3000,
        useNativeDriver: true,
      }).start();

      // Sparkle rotation
      Animated.loop(
        Animated.timing(sparkleRotate, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
      // Reset animations
      scaleValue.setValue(0);
      fadeValue.setValue(0);
      heartScale1.setValue(0);
      heartScale2.setValue(0);
      heartScale3.setValue(0);
      confettiY.setValue(-100);
      sparkleRotate.setValue(0);
    });
  };

  const getMilestoneMessage = (days) => {
    if (days === 7) return 'Một tuần tuyệt vời! 🌟';
    if (days === 30) return 'Một tháng bình yên! 🎊';
    if (days === 50) return 'Nửa trăm ngày hạnh phúc! ✨';
    if (days === 100) return 'Một trăm ngày tình yêu! 🎆';
    if (days === 200) return 'Hai trăm ngày ngọt ngào! 💖';
    if (days === 365) return 'Một năm bình yên! 🎉';
    if (days === 500) return 'Năm trăm ngày kỳ diệu! 🌈';
    if (days === 1000) return 'Một nghìn ngày tình yêu! 🎊';
    return `${days} ngày bình yên tuyệt vời! 🎉`;
  };

  const getMilestoneEmoji = (days) => {
    if (days <= 7) return '🌟';
    if (days <= 30) return '🎊';
    if (days <= 100) return '🎆';
    if (days <= 365) return '🎉';
    return '👑';
  };

  const sparkleRotation = sparkleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        {/* Background */}
        <Animated.View 
          style={[
            styles.background,
            { opacity: fadeValue }
          ]}
        />

        {/* Confetti Effects */}
        <Animated.View
          style={[
            styles.confetti,
            { transform: [{ translateY: confettiY }] }
          ]}
        >
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.confettiPiece,
                {
                  left: Math.random() * width,
                  backgroundColor: ['#E91E63', '#F06292', '#FF69B4', '#FFB6C1', '#FFC1CC'][Math.floor(Math.random() * 5)],
                }
              ]}
            />
          ))}
        </Animated.View>

        {/* Floating Hearts */}
        <Animated.View
          style={[
            styles.heartContainer,
            styles.heart1,
            { transform: [{ scale: heartScale1 }] }
          ]}
        >
          <Ionicons name="heart" size={30} color="#E91E63" />
        </Animated.View>

        <Animated.View
          style={[
            styles.heartContainer,
            styles.heart2,
            { transform: [{ scale: heartScale2 }] }
          ]}
        >
          <Ionicons name="heart" size={25} color="#F06292" />
        </Animated.View>

        <Animated.View
          style={[
            styles.heartContainer,
            styles.heart3,
            { transform: [{ scale: heartScale3 }] }
          ]}
        >
          <Ionicons name="heart" size={35} color="#FF69B4" />
        </Animated.View>

        {/* Sparkles */}
        <Animated.View
          style={[
            styles.sparkle,
            styles.sparkle1,
            { transform: [{ rotate: sparkleRotation }] }
          ]}
        >
          <Ionicons name="sparkles" size={20} color="#FFD700" />
        </Animated.View>

        <Animated.View
          style={[
            styles.sparkle,
            styles.sparkle2,
            { transform: [{ rotate: sparkleRotation }] }
          ]}
        >
          <Ionicons name="sparkles" size={16} color="#FFA500" />
        </Animated.View>

        {/* Main Modal */}
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ scale: scaleValue }],
              opacity: fadeValue,
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.emoji}>
              {getMilestoneEmoji(milestone.days)}
            </Text>
            <Text style={styles.title}>
              {t('peacefulDays.celebration')}
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.milestoneNumber}>
              {milestone.days}
            </Text>
            <Text style={styles.milestoneLabel}>
              NGÀY BÌNH YÊN
            </Text>
            <Text style={styles.message}>
              {getMilestoneMessage(milestone.days)}
            </Text>
            <Text style={styles.description}>
              {t('peacefulDays.milestone', { count: milestone.days })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissText}>Tuyệt vời! 💕</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  confetti: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heartContainer: {
    position: 'absolute',
  },
  heart1: {
    top: '20%',
    left: '15%',
  },
  heart2: {
    top: '25%',
    right: '20%',
  },
  heart3: {
    bottom: '30%',
    left: '20%',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: '15%',
    right: '15%',
  },
  sparkle2: {
    bottom: '25%',
    right: '25%',
  },
  modal: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 24,
    shadowColor: '#E91E63',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
    borderWidth: 2,
    borderColor: '#FCE4EC',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  milestoneNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#E91E63',
    textAlign: 'center',
    lineHeight: 64,
  },
  milestoneLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8E24AA',
    letterSpacing: 2,
    marginBottom: 16,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#C2185B',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#8E24AA',
    textAlign: 'center',
    lineHeight: 24,
  },
  dismissButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignSelf: 'center',
    shadowColor: '#E91E63',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dismissText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MilestoneCelebration;
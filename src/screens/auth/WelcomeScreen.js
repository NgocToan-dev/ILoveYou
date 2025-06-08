import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  SafeAreaView 
} from 'react-native';
import { 
  LoveButton, 
  LoveBackground 
} from '../../components';

const WelcomeScreen = ({ navigation, route }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const user = route.params?.user;

  useEffect(() => {
    // Start the welcome animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const navigateToMain = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <LoveBackground variant="accent">
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.welcomeContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ]
              }
            ]}
          >
            <Text style={styles.welcomeEmoji}>💕✨💖</Text>
            
            <Text style={styles.title}>Welcome to Love!</Text>
            
            <Text style={styles.greeting}>
              Hello, {user?.displayName || 'Beautiful'} 💝
            </Text>
            
            <Text style={styles.subtitle}>
              Your romantic journey starts here. Connect with your partner 
              and create beautiful memories together.
            </Text>
            
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Text style={styles.featureEmoji}>💌</Text>
                <Text style={styles.featureText}>Send Love Messages</Text>
              </View>
              
              <View style={styles.feature}>
                <Text style={styles.featureEmoji}>👫</Text>
                <Text style={styles.featureText}>Connect as a Couple</Text>
              </View>
              
              <View style={styles.feature}>
                <Text style={styles.featureEmoji}>💕</Text>
                <Text style={styles.featureText}>Share Special Moments</Text>
              </View>
            </View>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <LoveButton
              title="Start My Love Journey 💖"
              onPress={navigateToMain}
              variant="primary"
              size="large"
              icon="heart"
              style={styles.startButton}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </LoveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  greeting: {
    fontSize: 20,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 16,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    paddingHorizontal: 16,
  },  startButton: {
    shadowColor: '#E91E63',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
});

export default WelcomeScreen;
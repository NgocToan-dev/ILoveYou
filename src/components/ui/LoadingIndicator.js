import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const LoadingIndicator = ({ message = "Loading...", size = 'medium' }) => {
  const heartAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const heartBeat = () => {
      Animated.sequence([
        Animated.timing(heartAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(heartAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => heartBeat());
    };

    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    heartBeat();
    pulse();
  }, []);

  const heartScale = heartAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const getHeartSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 48;
      default:
        return 32;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.heartContainer,
          {
            transform: [
              { scale: heartScale },
              { scale: pulseAnimation },
            ],
          },
        ]}
      >
        <Text style={[styles.heart, { fontSize: getHeartSize() }]}>💕</Text>
      </Animated.View>
      {message && (
        <Text style={[styles.message, styles[`${size}Message`]]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  heartContainer: {
    marginBottom: 12,
  },
  heart: {
    textAlign: 'center',
  },  message: {
    color: '#D81B60',
    fontWeight: '500',
    textAlign: 'center',
  },
  smallMessage: {
    fontSize: 12,
  },
  mediumMessage: {
    fontSize: 14,
  },
  largeMessage: {
    fontSize: 16,
  },
});

export default LoadingIndicator;
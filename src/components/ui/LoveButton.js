import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const LoveButton = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  icon,
  loading = false,
  disabled = false,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];

    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    } else {
      baseStyle.push(styles[variant]);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];

    if (disabled || loading) {
      baseStyle.push(styles.disabledText);
    } else {
      baseStyle.push(styles[`${variant}Text`]);
    }

    return baseStyle;
  };
  return (
    <TouchableOpacity
      style={[getButtonStyle(), props.style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={disabled || loading ? ['#DDD', '#CCC'] : ['#E91E63', '#AD1457']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientButton, styles[size]]}
        >
          <View style={styles.content}>
            {loading ? (
              <Text style={getTextStyle()}>💕</Text>
            ) : (
              <>
                {icon && (
                  <Ionicons
                    name={icon}
                    size={size === "small" ? 16 : size === "large" ? 24 : 20}
                    color="#FFF"
                    style={styles.icon}
                  />
                )}
                <Text style={getTextStyle()}>{title}</Text>
              </>
            )}
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.content}>
          {loading ? (
            <Text style={getTextStyle()}>💕</Text>
          ) : (
            <>
              {icon && (
                <Ionicons
                  name={icon}
                  size={size === "small" ? 16 : size === "large" ? 24 : 20}
                  color={
                    variant === "danger"
                      ? "#FFF"
                      : variant === "secondary"
                      ? "#E91E63"
                      : variant === "outline"
                      ? "#AD1457"
                      : "#E91E63"
                  }
                  style={styles.icon}
                />
              )}
              <Text style={getTextStyle()}>{title}</Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  // Variants
  primary: {
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E91E63",
    shadowColor: "#E91E63",
    shadowOpacity: 0.1,
  },
  outline: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1.5,
    borderColor: "#AD1457",
    shadowColor: "#AD1457",
    shadowOpacity: 0.1,
  },
  danger: {
    backgroundColor: "#F44336",
    borderWidth: 0,
    shadowColor: "#F44336",
  },
  // Sizes
  small: {
    paddingVertical: 10,
    minHeight: 40,
  },
  medium: {
    paddingVertical: 14,
    minHeight: 50,
  },
  large: {
    paddingVertical: 18,
    minHeight: 58,
  },
  // Text styles
  text: {
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
    fontWeight: "700",
  },
  primaryText: {
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  secondaryText: {
    color: "#E91E63",
    fontWeight: "700",
  },
  outlineText: {
    color: "#AD1457",
    fontWeight: "600",
  },
  dangerText: {
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Disabled state
  disabled: {
    backgroundColor: "#E0E0E0",
    borderColor: "#E0E0E0",
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: "#9E9E9E",
  },
});

export default LoveButton;

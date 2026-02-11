import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme";
import { Ionicons } from "@expo/vector-icons";

interface HomeProps {
  onNewProject: () => void;
  onExistingProjects: () => void;
}

export const Home: React.FC<HomeProps> = ({
  onNewProject,
  onExistingProjects,
}) => {
  const [progress1, setProgress1] = useState(0);
  const [progress2, setProgress2] = useState(0);
  const [progress3, setProgress3] = useState(0);

  useEffect(() => {
    const interval = 50; // Update every 50ms for smooth animation
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      // Different speeds for each layer to create mixing effect - slowed down for smoother, longer animation
      setProgress1((elapsed / 30000) % 1); // Slower wave (30 seconds)
      setProgress2((elapsed / 20000) % 1); // Medium wave (20 seconds)
      setProgress3((elapsed / 25000) % 1); // Another wave (25 seconds)
    };

    const intervalId = setInterval(animate, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Create wave-like positions using sine/cosine for organic flow
  const getWavePosition = (progress: number, offset: number = 0) => {
    const angle = (progress + offset) * Math.PI * 2;
    // Create S-curve/wave pattern
    const waveX = 0.5 + Math.sin(angle) * 0.3;
    const waveY = 0.5 + Math.cos(angle * 0.7) * 0.3;

    return {
      start: {
        x: Math.max(0, Math.min(1, waveX - 0.2)),
        y: Math.max(0, Math.min(1, waveY - 0.2)),
      },
      end: {
        x: Math.max(0, Math.min(1, waveX + 0.2)),
        y: Math.max(0, Math.min(1, waveY + 0.2)),
      },
    };
  };

  const pos1 = getWavePosition(progress1, 0);
  const pos2 = getWavePosition(progress2, 0.33);
  const pos3 = getWavePosition(progress3, 0.66);

  return (
    <View style={styles.container}>
      {/* Base layer - mostly black */}
      <LinearGradient
        colors={["#000000", "#050505", "#0A0A0A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* First flowing layer - subtle light mixing */}
      <LinearGradient
        colors={["#000000", "#252525", "#4A4A4A", "#252525", "#000000"]}
        start={pos1.start}
        end={pos1.end}
        style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
      />

      {/* Second flowing layer - creates wave effect */}
      <LinearGradient
        colors={["#000000", "#2F2F2F", "#5F5F5F", "#2F2F2F", "#000000"]}
        start={pos2.start}
        end={pos2.end}
        style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
      />

      {/* Third flowing layer - subtle accent */}
      <LinearGradient
        colors={["#000000", "#2A2A2A", "#6A6A6A", "#2A2A2A", "#000000"]}
        start={pos3.start}
        end={pos3.end}
        style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Haven</Text>
        <Text style={styles.subtitle}>
          Making interior design easy through collaboration
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onNewProject}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={theme.colors.textInverse}
            />
            <Text style={styles.buttonText}>New Project</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onExistingProjects}
          >
            <Ionicons
              name="folder-outline"
              size={24}
              color={theme.colors.textInverse}
            />
            <Text style={styles.buttonText}>Existing Projects</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    paddingHorizontal: theme.spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
    color: theme.colors.purple,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 24,
    color: theme.colors.purple,
    marginBottom: theme.spacing.xxl * 2,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
    gap: theme.spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.purple,
  },
  secondaryButton: {
    backgroundColor: theme.colors.purple,
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontSize: 18,
    fontWeight: "600",
  },
});

export default Home;

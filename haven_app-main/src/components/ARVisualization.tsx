import React, { useState, useEffect } from "react";
import {
  Viro360Image,
  ViroVRSceneNavigator,
  ViroScene,
  ViroBox,
  ViroAmbientLight,
  ViroMaterials,
} from "@reactvision/react-viro";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { theme } from "../theme";
import { RoomCapture } from "./ARScanner";

interface ARVisualizationProps {
  roomCapture: RoomCapture;
  onBack: () => void;
}

const VisualizationScene: React.FC<{
  capturedImage: string | null;
  planes: any[];
}> = ({ capturedImage, planes }) => {
  // Initialize materials
  React.useEffect(() => {
    try {
      ViroMaterials.createMaterials({
        floorMaterial: {
          diffuseColor: "#4CAF50", // Green floor
        },
        wallMaterial: {
          diffuseColor: "#2196F3", // Blue walls
        },
        testMaterial: {
          diffuseColor: "#FF5722", // Orange test object
        },
      });
      console.log("✅ Materials initialized");
    } catch (error) {
      console.warn("Materials error:", error);
    }
  }, []);

  React.useEffect(() => {
    console.log("📦 VisualizationScene:", {
      hasImage: !!capturedImage,
      imageUri: capturedImage,
      planes: planes.length,
    });
  }, [capturedImage, planes]);

  return (
    <ViroScene>
      <ViroAmbientLight color="#ffffff" intensity={300} />

      {/* ALWAYS show a test object - if you see this orange box, scene is working */}
      <ViroBox
        position={[0, 1.5, -3]}
        scale={[1, 1, 1]}
        materials={["testMaterial"]}
        opacity={1.0}
      />

      {/* Render detected planes as 3D room structure */}
      {planes.map((plane, index) => {
        const pos = plane.position || [0, 0, 0];
        const ext = plane.extent || [1, 1];
        const isHorizontal = plane.alignment === "Horizontal";

        console.log(`🎨 Rendering plane ${index}:`, {
          position: pos,
          extent: ext,
          alignment: plane.alignment,
        });

        return (
          <ViroBox
            key={plane.id || `plane-${index}`}
            position={pos}
            scale={
              isHorizontal ? [ext[0], 0.02, ext[1]] : [ext[0], ext[1], 0.02]
            }
            materials={[isHorizontal ? "floorMaterial" : "wallMaterial"]}
            opacity={0.7}
          />
        );
      })}

      {/* Fallback room structure if no planes */}
      {planes.length === 0 && (
        <>
          <ViroBox
            position={[0, -1, 0]}
            scale={[6, 0.02, 6]}
            materials={["floorMaterial"]}
            opacity={0.8}
          />
          <ViroBox
            position={[0, 1, -3]}
            scale={[6, 4, 0.02]}
            materials={["wallMaterial"]}
            opacity={0.8}
          />
          <ViroBox
            position={[-3, 1, 0]}
            scale={[0.02, 4, 6]}
            materials={["wallMaterial"]}
            opacity={0.8}
          />
          <ViroBox
            position={[3, 1, 0]}
            scale={[0.02, 4, 6]}
            materials={["wallMaterial"]}
            opacity={0.8}
          />
        </>
      )}
    </ViroScene>
  );
};

export const ARVisualization: React.FC<ARVisualizationProps> = ({
  roomCapture,
  onBack,
}) => {
  const [show3D, setShow3D] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);

  console.log("🏠 ARVisualization rendering:", {
    images: roomCapture.capturedImages.length,
    planes: roomCapture.planes.length,
    planeIds: roomCapture.planes.map((p) => p.id),
    firstImage: roomCapture.capturedImages[0],
  });

  // Mark scene as ready after a short delay (when ViroVRSceneNavigator has initialized)
  useEffect(() => {
    if (show3D && !sceneReady) {
      const timer = setTimeout(() => {
        setSceneReady(true);
        console.log("✅ Scene marked as ready");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [show3D, sceneReady]);

  // Auto-switch to gallery if 3D scene doesn't load in 3 seconds
  useEffect(() => {
    if (show3D && !sceneReady) {
      const timeout = setTimeout(() => {
        console.warn("⚠️ 3D scene didn't load, switching to gallery view");
        setShow3D(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [show3D, sceneReady]);

  // Create scene function (no setState here!)
  const sceneFunction = React.useCallback(() => {
    console.log("🎬 Scene function called");
    return (
      <VisualizationScene
        capturedImage={roomCapture.capturedImages[0] || null}
        planes={roomCapture.planes}
      />
    );
  }, [roomCapture.capturedImages, roomCapture.planes]);

  // Show image gallery as fallback or alternative view
  const showGallery = !show3D;

  if (showGallery) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.imageGallery}>
          <Text style={styles.galleryTitle}>
            Captured Images ({roomCapture.capturedImages.length})
          </Text>
          {roomCapture.capturedImages.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.capturedImage} />
              <Text style={styles.imageLabel}>Photo {index + 1}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.overlay}>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.button} onPress={onBack}>
              <Text style={styles.buttonText}>Back to Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.toggleButton]}
              onPress={() => setShow3D(true)}
            >
              <Text style={styles.buttonText}>Show 3D View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!sceneReady && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading 3D scene...</Text>
        </View>
      )}
      <ViroVRSceneNavigator
        vrModeEnabled={false}
        initialScene={{
          scene: sceneFunction,
        }}
        style={styles.arScene}
      />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            Room 3D View ({roomCapture.capturedImages.length} photos,{" "}
            {roomCapture.planes.length} surfaces)
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.button} onPress={onBack}>
            <Text style={styles.buttonText}>Back to Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.toggleButton]}
            onPress={() => setShow3D(false)}
          >
            <Text style={styles.buttonText}>Show Image Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.infoTitle}>Room 3D Visualization</Text>
          <Text style={styles.infoText}>
            • {roomCapture.capturedImages.length} photos captured
          </Text>
          <Text style={styles.infoText}>
            • {roomCapture.planes.length} surfaces detected
          </Text>
          <Text style={styles.infoSubtext}>
            Move your device to look around the 3D room. This is a fixed capture
            - you can look around but can't move past what wasn't captured.
          </Text>
          <Text style={styles.infoSubtext}>
            Furniture placement coming soon!
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  arScene: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none",
  },
  statusBar: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: theme.spacing.md,
    paddingTop: 60,
    alignItems: "center",
  },
  statusText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  button: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: 150,
    alignItems: "center",
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  infoPanel: {
    position: "absolute",
    top: 120,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  infoTitle: {
    color: theme.colors.textInverse,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  infoSubtext: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: theme.spacing.sm,
    opacity: 0.8,
  },
  imageGallery: {
    flex: 1,
    backgroundColor: "#000",
    padding: theme.spacing.md,
  },
  galleryTitle: {
    color: theme.colors.textInverse,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  imageContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: "center",
  },
  capturedImage: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
    backgroundColor: "#333",
    borderRadius: theme.borderRadius.md,
  },
  imageLabel: {
    color: theme.colors.textInverse,
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    marginTop: theme.spacing.md,
  },
  toggleButton: {
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
});

export default ARVisualization;

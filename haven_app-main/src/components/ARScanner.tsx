import React, { useState, useRef, useEffect } from "react";
import {
  ViroARScene,
  ViroARPlane,
  ViroBox,
  ViroAmbientLight,
  ViroARSceneNavigator,
  ViroMaterials,
} from "@reactvision/react-viro";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { captureRef } from "react-native-view-shot";
import { Paths, File as ExpoFile } from "expo-file-system";
import { theme } from "../theme";

export interface DetectedPlane {
  id: string;
  position: [number, number, number];
  extent: [number, number];
  alignment: "Horizontal" | "Vertical";
}

interface ARSceneProps {
  onPlaneDetected?: (planes: DetectedPlane[]) => void;
  isScanning: boolean;
  savedPlanes?: DetectedPlane[]; // For visualization mode
  isVisualizationMode?: boolean; // Show saved planes instead of detecting new ones
}

const ARScene: React.FC<ARSceneProps> = ({
  onPlaneDetected,
  isScanning,
  savedPlanes = [],
  isVisualizationMode = false,
}) => {
  const [detectedPlanes, setDetectedPlanes] = useState<DetectedPlane[]>([]);
  const [materialsReady, setMaterialsReady] = useState(false);

  // Initialize materials when AR scene is ready
  useEffect(() => {
    // Wait for native module to be ready
    const initMaterials = () => {
      try {
        ViroMaterials.createMaterials({
          planeMaterial: {
            diffuseColor: "#00FF00", // Green for horizontal planes
          },
          wallMaterial: {
            diffuseColor: "#0066FF", // Blue for vertical planes
          },
        });
        setMaterialsReady(true);
      } catch (error) {
        console.warn(
          "Error creating materials (native module may not be ready):",
          error
        );
        // Retry after a delay
        setTimeout(initMaterials, 500);
      }
    };

    // Start initialization after a short delay
    const timer = setTimeout(initMaterials, 200);
    return () => clearTimeout(timer);
  }, []);

  // Notify parent of plane changes (outside of setState to avoid render error)
  useEffect(() => {
    if (onPlaneDetected && !isVisualizationMode) {
      onPlaneDetected(detectedPlanes);
    }
  }, [detectedPlanes, onPlaneDetected, isVisualizationMode]);

  const handlePlaneDetected = (anchor: any) => {
    // Guard against undefined/null anchor
    if (!anchor) {
      console.warn("handlePlaneDetected received undefined anchor");
      return;
    }

    const newPlane: DetectedPlane = {
      id: anchor.anchorId || `plane-${Date.now()}-${Math.random()}`,
      position: anchor.center || [0, 0, 0],
      extent: anchor.extent || [1, 1],
      alignment:
        anchor.alignment === "HorizontalUp" ||
        anchor.alignment === "HorizontalDown" ||
        anchor.alignment === "Horizontal"
          ? "Horizontal"
          : "Vertical",
    };

    setDetectedPlanes((prev) => {
      // Avoid duplicates
      const exists = prev.find((p) => p.id === newPlane.id);
      if (exists) {
        return prev.map((p) => (p.id === newPlane.id ? newPlane : p));
      }
      return [...prev, newPlane];
    });
  };

  const handlePlaneUpdated = (anchor: any) => {
    // Guard against undefined/null anchor
    if (!anchor) {
      console.warn("handlePlaneUpdated received undefined anchor");
      return;
    }

    const updatedPlane: DetectedPlane = {
      id: anchor.anchorId || `plane-${Date.now()}-${Math.random()}`,
      position: anchor.center || [0, 0, 0],
      extent: anchor.extent || [1, 1],
      alignment:
        anchor.alignment === "HorizontalUp" ||
        anchor.alignment === "HorizontalDown" ||
        anchor.alignment === "Horizontal"
          ? "Horizontal"
          : "Vertical",
    };

    setDetectedPlanes((prev) => {
      return prev.map((p) => (p.id === updatedPlane.id ? updatedPlane : p));
    });
  };

  // Use saved planes in visualization mode, otherwise use detected planes
  const planesToRender = isVisualizationMode ? savedPlanes : detectedPlanes;

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffff" intensity={200} />

      {/* Only detect planes if not in visualization mode */}
      {!isVisualizationMode && (
        <>
          {/* Detect horizontal planes (floors, tables, etc.) */}
          <ViroARPlane
            minHeight={0.1}
            minWidth={0.1}
            alignment="Horizontal"
            onAnchorFound={handlePlaneDetected}
            onAnchorUpdated={handlePlaneUpdated}
            onAnchorRemoved={(anchor: any) => {
              if (!anchor || !anchor.anchorId) {
                console.warn("onAnchorRemoved received invalid anchor");
                return;
              }
              setDetectedPlanes((prev) => {
                return prev.filter((p) => p.id !== anchor.anchorId);
              });
            }}
          >
            {/* Visualize detected horizontal planes */}
            {isScanning && materialsReady && (
              <ViroBox
                position={[0, 0, 0]}
                scale={[1, 0.01, 1]}
                materials={["planeMaterial"]}
                opacity={0.5}
              />
            )}
          </ViroARPlane>

          {/* Detect vertical planes (walls) */}
          <ViroARPlane
            minHeight={0.1}
            minWidth={0.1}
            alignment="Vertical"
            onAnchorFound={handlePlaneDetected}
            onAnchorUpdated={handlePlaneUpdated}
            onAnchorRemoved={(anchor: any) => {
              if (!anchor || !anchor.anchorId) {
                console.warn("onAnchorRemoved received invalid anchor");
                return;
              }
              setDetectedPlanes((prev) => {
                return prev.filter((p) => p.id !== anchor.anchorId);
              });
            }}
          >
            {/* Visualize detected vertical planes */}
            {isScanning && materialsReady && (
              <ViroBox
                position={[0, 0, 0]}
                scale={[1, 1, 0.01]}
                materials={["wallMaterial"]}
                opacity={0.5}
              />
            )}
          </ViroARPlane>
        </>
      )}

      {/* Render all planes as visualizations (detected or saved) */}
      {materialsReady &&
        planesToRender.map((plane) => (
          <ViroBox
            key={plane.id}
            position={plane.position}
            scale={[
              plane.extent[0],
              plane.alignment === "Horizontal" ? 0.01 : plane.extent[1],
              plane.alignment === "Horizontal" ? plane.extent[1] : 0.01,
            ]}
            materials={[
              plane.alignment === "Horizontal"
                ? "planeMaterial"
                : "wallMaterial",
            ]}
            opacity={0.5}
          />
        ))}
    </ViroARScene>
  );
};

export interface RoomCapture {
  planes: DetectedPlane[];
  capturedImages: string[]; // URIs of captured photos
  scanTimestamp: number;
}

interface ARScannerProps {
  onScanComplete?: (planes: DetectedPlane[]) => void;
  onVisualize?: (capture: RoomCapture) => void; // New callback with full room capture
}

export const ARScanner: React.FC<ARScannerProps> = ({
  onScanComplete,
  onVisualize,
}) => {
  const [scanStatus, setScanStatus] = useState<
    "idle" | "scanning" | "complete"
  >("idle");
  const [detectedPlanes, setDetectedPlanes] = useState<DetectedPlane[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const sceneRef = useRef<any>(null);
  const containerRef = useRef<View>(null);

  const handlePlaneUpdate = (planes: DetectedPlane[]) => {
    setDetectedPlanes(planes);
  };

  const startScanning = () => {
    setScanStatus("scanning");
    setDetectedPlanes([]);
    setCapturedImage(null);
  };

  const capturePhoto = async () => {
    if (!containerRef.current) {
      console.warn("Container ref not available");
      return;
    }

    console.log("📸 Capturing photo...");

    try {
      // Capture the AR view
      const uri = await captureRef(containerRef, {
        format: "jpg",
        quality: 0.9,
        result: "tmpfile",
      });

      if (uri) {
        await savePhoto(uri);
      } else {
        console.warn("Capture returned no URI");
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
    }
  };

  const finishScan = () => {
    setScanStatus("complete");
    if (onScanComplete) {
      onScanComplete(detectedPlanes);
    }
  };

  const savePhoto = async (uri: string) => {
    try {
      const timestamp = Date.now();
      const filename = `room_scan_${timestamp}.jpg`;

      // Create source and destination files using new API
      const sourceFile = new ExpoFile(uri);
      const destFile = new ExpoFile(Paths.document, filename);

      // Copy file to document directory
      sourceFile.copy(destFile);

      // Verify file exists
      const fileInfo = await Paths.info(destFile.uri);
      if (fileInfo.exists) {
        setCapturedImage(destFile.uri);
        console.log(`✅ Photo captured: ${destFile.uri}`);
      } else {
        console.warn(`File was not created at: ${destFile.uri}`);
      }
    } catch (error) {
      console.error("Error saving photo:", error);
    }
  };

  const enterVisualizationMode = () => {
    if (!capturedImage) {
      console.warn("No image captured yet");
      return;
    }

    // Create room capture with planes and the single image
    const roomCapture: RoomCapture = {
      planes: [...detectedPlanes],
      capturedImages: [capturedImage], // Single image
      scanTimestamp: Date.now(),
    };

    // Call the callback to navigate to visualization screen
    if (onVisualize) {
      onVisualize(roomCapture);
    }
  };

  return (
    <View ref={containerRef} style={styles.container} collapsable={false}>
      <ViroARSceneNavigator
        ref={sceneRef}
        initialScene={{
          scene: () => (
            <ARScene
              onPlaneDetected={handlePlaneUpdate}
              isScanning={scanStatus === "scanning"}
            />
          ),
        }}
        style={styles.arScene}
      />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {scanStatus === "idle" && "Ready to scan room"}
            {scanStatus === "scanning" &&
              `Scanning... ${detectedPlanes.length} surface${
                detectedPlanes.length !== 1 ? "s" : ""
              } detected`}
            {scanStatus === "complete" &&
              `Scan complete! ${capturedImage ? "Photo captured" : "No photo"}`}
          </Text>
        </View>

        <View style={styles.controls}>
          {scanStatus === "idle" && (
            <TouchableOpacity style={styles.button} onPress={startScanning}>
              <Text style={styles.buttonText}>Start Scanning</Text>
            </TouchableOpacity>
          )}

          {scanStatus === "scanning" && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.captureButton]}
                onPress={capturePhoto}
              >
                <Text style={styles.buttonText}>
                  {capturedImage ? "Retake Photo" : "Capture Photo"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={finishScan}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </>
          )}

          {scanStatus === "complete" && capturedImage && (
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={enterVisualizationMode}
            >
              <Text style={styles.buttonText}>View Room</Text>
            </TouchableOpacity>
          )}

          {scanStatus === "complete" && !capturedImage && (
            <TouchableOpacity style={[styles.button]} onPress={startScanning}>
              <Text style={styles.buttonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {scanStatus === "idle" &&
              "Tap 'Start Scanning' to detect room surfaces, then tap 'Capture Photo' to take a photo."}
            {scanStatus === "scanning" &&
              "Move your device slowly to detect surfaces. When ready, tap 'Capture Photo'."}
            {scanStatus === "complete" &&
              capturedImage &&
              "Photo captured! Tap 'View Room' to see your room in 3D."}
            {scanStatus === "complete" &&
              !capturedImage &&
              "No photo captured. Tap 'Scan Again' to try again."}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black", // Ensure container has background for capture
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
    paddingTop: 60, // Account for status bar
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
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: 150,
    alignItems: "center",
  },
  buttonHalf: {
    flex: 1,
    maxWidth: 150,
    marginHorizontal: theme.spacing.xs,
  },
  captureButton: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  stopButton: {
    backgroundColor: theme.colors.error,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  instructions: {
    position: "absolute",
    bottom: 120,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  instructionText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  progressBarContainer: {
    position: "absolute",
    top: 120,
    left: theme.spacing.md,
    right: theme.spacing.md,
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    textAlign: "center",
  },
});

export default ARScanner;

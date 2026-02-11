import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import Home from "./src/components/Home";
import ARFurniturePlacer from "./src/components/ARFurniturePlacer";
import ImageGallery from "./src/components/ImageGallery";
import ExistingProjects from "./src/components/ExistingProjects";
import { theme } from "./src/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Screen = "home" | "ar" | "gallery" | "existingProjects" | "arExisting";

const SAVED_IMAGES_KEY = "@haven_saved_images";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isNewProjectStart, setIsNewProjectStart] = useState(false); // Track if coming from home (new project)

  const handleNewProject = async () => {
    // Clear gallery images when starting a new project
    try {
      await AsyncStorage.setItem(SAVED_IMAGES_KEY, JSON.stringify([]));
    } catch (error) {
      console.error("Error clearing images:", error);
    }
    setIsNewProjectStart(true); // Mark as new project start
    setCurrentScreen("ar");
  };

  return (
    <View style={styles.container}>
      {currentScreen === "home" ? (
        <Home
          onNewProject={handleNewProject}
          onExistingProjects={() => setCurrentScreen("existingProjects")}
        />
      ) : currentScreen === "ar" ? (
        <ARFurniturePlacer
          onBack={() => {
            setIsNewProjectStart(false); // Reset flag when going back
            setCurrentScreen("home");
          }}
          onSave={() => {}} // No-op since we show modal in ARFurniturePlacer
          onViewGallery={() => {
            setIsNewProjectStart(false); // Reset flag when going to gallery
            setCurrentScreen("gallery");
          }}
          isNewProjectStart={isNewProjectStart} // Only true when coming from home
        />
      ) : currentScreen === "gallery" ? (
        <ImageGallery
          onBack={() => {
            setIsNewProjectStart(false); // Not a new project start when coming back from gallery
            setCurrentScreen("ar");
          }}
          onNavigateHome={() => {
            setIsNewProjectStart(false);
            setCurrentScreen("home");
          }}
        />
      ) : currentScreen === "arExisting" ? (
        <ARFurniturePlacer
          onBack={() => {
            // Navigate back to the project detail view, not the list
            setCurrentScreen("existingProjects");
            // Keep currentProjectId so ExistingProjects can restore the selected project
          }}
          onSave={() => {}} // No-op since we show modal in ARFurniturePlacer
          onViewGallery={() => {
            // TODO: Navigate to project-specific gallery
            setCurrentScreen("existingProjects");
          }}
          projectId={currentProjectId || undefined}
          isExistingProject={true}
        />
      ) : (
        <ExistingProjects
          onBack={() => {
            setCurrentProjectId(null);
            setCurrentScreen("home");
          }}
          onSelectProject={(project) => {
            // TODO: Load project images into gallery and navigate to AR
            console.log("Selected project:", project);
            setCurrentScreen("ar");
          }}
          onAddScene={(project) => {
            setCurrentProjectId(project.id);
            setCurrentScreen("arExisting");
          }}
          initialSelectedProjectId={currentProjectId}
        />
      )}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../theme";
import { SecondaryButton } from "./SecondaryButton";
import { DeleteModal } from "./DeleteModal";

interface ImageGalleryProps {
  onBack: () => void;
  onNavigateHome?: () => void;
}

import {
  ensureImageUri,
  deleteImageFile,
  SAVED_IMAGES_KEY,
  SAVED_PROJECTS_KEY,
} from "../utils/storage";

interface SavedProject {
  id: string;
  name: string;
  description: string;
  images: string[];
  createdAt: number;
  sharedWith?: string[]; // Recipients the project is shared with
  shareMessage?: string; // Message sent when project was shared
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  onBack,
  onNavigateHome,
}) => {
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [modalStep, setModalStep] = useState<"save" | "share" | "message">(
    "save"
  );
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [shareMessage, setShareMessage] = useState<string>(""); // Message to send with share
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [sharedRecipients, setSharedRecipients] = useState<string[]>([]);
  const [savedProjectName, setSavedProjectName] = useState<string>(""); // Store the saved project name
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  // Mock recipients list - replace with actual data
  const recipients = [
    "John Doe",
    "Jane Smith",
    "Bob Johnson",
    "Alice Williams",
    "Charlie Brown",
    "Diana Prince",
    "Edward Norton",
    "Fiona Apple",
    "George Washington",
    "Hannah Montana",
    "Isaac Newton",
    "Julia Roberts",
    "Kevin Hart",
    "Laura Palmer",
    "Michael Jordan",
    "Nancy Drew",
    "Oliver Twist",
    "Patricia Smith",
    "Quinn Fabray",
    "Rachel Green",
  ];

  useEffect(() => {
    loadSavedImages();
    loadCurrentProjectInfo();
  }, []);

  const loadCurrentProjectInfo = async () => {
    try {
      const name = await AsyncStorage.getItem("@haven_current_project_name");
      const description = await AsyncStorage.getItem(
        "@haven_current_project_description"
      );
      if (name) {
        setProjectName(name);
      }
      if (description) {
        setProjectDescription(description);
      }
      // Keep project name in storage so it can be displayed in gallery
      // Only clear when project is saved
    } catch (error) {
      console.error("Error loading project info:", error);
    }
  };

  const loadSavedImages = async () => {
    try {
      // Load saved image URIs from AsyncStorage
      const saved = await AsyncStorage.getItem(SAVED_IMAGES_KEY);
      if (saved) {
        const images = JSON.parse(saved);
        setSavedImages(images);
        console.log(`📸 Loaded ${images.length} saved images`);
      } else {
        setSavedImages([]);
      }
    } catch (error) {
      console.error("Error loading images:", error);
      setSavedImages([]);
    }
  };

  const saveProject = async (
    name: string,
    description: string,
    images: string[],
    sharedWith: string[] = [],
    shareMessage?: string
  ) => {
    try {
      const project: SavedProject = {
        id: `project-${Date.now()}-${Math.random()}`,
        name: name.trim(),
        description: description.trim(),
        images: [...images],
        createdAt: Date.now(),
        sharedWith: sharedWith.length > 0 ? [...sharedWith] : undefined,
        shareMessage:
          shareMessage && shareMessage.trim() ? shareMessage.trim() : undefined,
      };

      // Load existing projects
      const existing = await AsyncStorage.getItem(SAVED_PROJECTS_KEY);
      const projects: SavedProject[] = existing ? JSON.parse(existing) : [];

      // Add new project
      projects.push(project);

      // Save back to storage
      await AsyncStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(projects));
      console.log(`✅ Saved project: ${name}`);
    } catch (error) {
      console.error("Error saving project:", error);
      Alert.alert("Error", "Failed to save project");
    }
  };

  const handleSaveAndShare = async (recipients: string[]) => {
    // Set shared recipients
    if (recipients.length > 0) {
      setSharedRecipients([...recipients]);
    } else {
      setSharedRecipients([]);
    }

    // Save the project - use provided name or default to "New Project" with timestamp
    const nameToSave =
      projectName.trim() || `New Project ${new Date().toLocaleDateString()}`;
    const descriptionToSave = projectDescription.trim() || "";

    if (savedImages.length > 0) {
      await saveProject(
        nameToSave,
        descriptionToSave,
        savedImages,
        recipients,
        shareMessage // Pass the share message when saving
      );
      setSavedProjectName(nameToSave); // Store the saved project name
      // Clear gallery images after saving
      setSavedImages([]);
      await AsyncStorage.setItem(SAVED_IMAGES_KEY, JSON.stringify([]));
      // Clear project name from storage after saving
      await AsyncStorage.removeItem("@haven_current_project_name");
      await AsyncStorage.removeItem("@haven_current_project_description");
    }

    setShowShareModal(false);
    setShowConfirmationModal(true);
    setModalStep("save");
    setProjectName("");
    setProjectDescription("");
    setSelectedRecipients([]);
    setShareMessage("");
  };

  const handleDeleteImagePress = (imageUri: string) => {
    setImageToDelete(imageUri);
    setShowDeleteModal(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      // Delete the actual image file from storage
      await deleteImageFile(imageToDelete);

      const updated = savedImages.filter((uri) => uri !== imageToDelete);
      setSavedImages(updated);
      await AsyncStorage.setItem(SAVED_IMAGES_KEY, JSON.stringify(updated));
      if (selectedImage === imageToDelete) {
        setSelectedImage(null);
      }
      setImageToDelete(null);
    } catch (error) {
      console.error("Error deleting image:", error);
      Alert.alert("Error", "Failed to delete image");
      setImageToDelete(null);
    }
  };

  if (selectedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.imageViewer}>
          <Image
            source={{ uri: ensureImageUri(selectedImage) }}
            style={styles.fullImage}
            resizeMode="contain"
          />
          <View style={styles.viewerControls}>
            <TouchableOpacity
              style={styles.viewerIconWithLabel}
              onPress={() => setSelectedImage(null)}
            >
              <View style={styles.viewerBackButton}>
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </View>
              <Text style={styles.viewerIconLabel}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewerIconWithLabel}
              onPress={() => handleDeleteImagePress(selectedImage)}
            >
              <View style={styles.viewerDeleteButton}>
                <Ionicons
                  name="trash-outline"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </View>
              <Text style={styles.viewerIconLabel}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Image Confirmation Modal */}
        <DeleteModal
          visible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setImageToDelete(null);
          }}
          onConfirm={confirmDeleteImage}
          title="Delete Image"
          message="Are you sure you want to delete this image? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{projectName || "New Project"}</Text>
        <Text style={styles.subtitle}>{savedImages.length} image(s)</Text>
      </View>

      {savedImages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No saved scenes yet</Text>
          <Text style={styles.emptySubtext}>
            Go back and place some furniture, then save your scene!
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.gallery}
          contentContainerStyle={styles.galleryContent}
        >
          {savedImages.map((uri, index) => (
            <TouchableOpacity
              key={index}
              style={styles.imageCard}
              onPress={() => setSelectedImage(uri)}
            >
              <Image
                source={{ uri: ensureImageUri(uri) }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerIconWithLabel} onPress={onBack}>
          <View style={styles.footerIconCircle}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.textInverse}
            />
          </View>
          <Text style={styles.footerIconLabel}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerIconWithLabel}
          onPress={() => setShowShareModal(true)}
        >
          <View style={styles.footerIconCircle}>
            <Ionicons
              name="download-outline"
              size={24}
              color={theme.colors.textInverse}
            />
          </View>
          <Text style={styles.footerIconLabel}>Save Project</Text>
        </TouchableOpacity>
      </View>

      {/* Save and Share Modal - Two Step */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowShareModal(false);
          setModalStep("save");
          setProjectName("");
          setProjectDescription("");
          setSelectedRecipients([]);
          setShareMessage("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalStep === "save"
                  ? "Save"
                  : modalStep === "share"
                  ? "Share"
                  : "Message"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowShareModal(false);
                  setModalStep("save");
                  setProjectName("");
                  setProjectDescription("");
                  setSelectedRecipients([]);
                  setShareMessage("");
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>

            {/* Step 1: Save - Removed name/description, go directly to share */}
            {modalStep === "save" && (
              <>
                <Text style={styles.modalSubtitle}>
                  Ready to save and share your project?
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={() => {
                      setModalStep("share");
                    }}
                  >
                    <Text style={styles.nextButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Step 2: Share */}
            {modalStep === "share" && (
              <>
                <Text style={styles.inputLabel}>Your Friends</Text>
                <ScrollView
                  style={styles.recipientsList}
                  nestedScrollEnabled={true}
                >
                  {recipients.map((recipient, index) => {
                    const isSelected = selectedRecipients.includes(recipient);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.recipientItem,
                          isSelected && styles.recipientItemSelected,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedRecipients(
                              selectedRecipients.filter((r) => r !== recipient)
                            );
                          } else {
                            setSelectedRecipients([
                              ...selectedRecipients,
                              recipient,
                            ]);
                          }
                        }}
                      >
                        <View style={styles.checkboxContainer}>
                          <View
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxSelected,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color={theme.colors.textInverse}
                              />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.recipientText,
                              isSelected && styles.recipientTextSelected,
                            ]}
                          >
                            {recipient}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <SecondaryButton
                    title="Back"
                    onPress={() => setModalStep("save")}
                    style={styles.modalButton}
                    textStyle={styles.modalButtonText}
                  />
                  <TouchableOpacity
                    style={[styles.skipButton, styles.modalButton]}
                    onPress={() => {
                      if (selectedRecipients.length > 0) {
                        // If recipients selected, go to message step
                        setModalStep("message");
                      } else {
                        // If no recipients, skip to save
                        handleSaveAndShare([]);
                      }
                    }}
                  >
                    <Text style={styles.skipButtonText}>
                      {selectedRecipients.length > 0 ? "Next" : "Skip"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Step 3: Message */}
            {modalStep === "message" && (
              <>
                <Text style={styles.inputLabel}>Add a message (optional)</Text>
                <Text style={styles.inputSubtext}>
                  Write a message to send with your project
                </Text>
                <TextInput
                  style={styles.projectNameInput}
                  placeholder="Enter your message..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={shareMessage}
                  onChangeText={setShareMessage}
                  blurOnSubmit={true}
                  returnKeyType="done"
                />

                <View style={styles.modalButtons}>
                  <SecondaryButton
                    title="Back"
                    onPress={() => setModalStep("share")}
                    style={styles.modalButton}
                    textStyle={styles.modalButtonText}
                  />
                  <TouchableOpacity
                    style={[styles.skipButton, styles.modalButton]}
                    onPress={async () => {
                      handleSaveAndShare(selectedRecipients);
                    }}
                  >
                    <Text style={styles.skipButtonText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Send Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowConfirmationModal(false);
          if (onNavigateHome) {
            onNavigateHome();
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {sharedRecipients.length > 0
                  ? "Project Shared"
                  : "Project Saved"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowConfirmationModal(false);
                  setModalStep("save");
                  setProjectName("");
                  setProjectDescription("");
                  setSelectedRecipients([]);
                  setSharedRecipients([]);
                  setSavedProjectName(""); // Clear saved project name
                  if (onNavigateHome) {
                    onNavigateHome();
                  }
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.confirmationText}>
              {sharedRecipients.length > 0
                ? `Project "${savedProjectName}" has been shared with:`
                : `Project "${savedProjectName}" has been saved.`}
            </Text>

            {sharedRecipients.length > 0 && (
              <ScrollView
                style={styles.sharedRecipientsList}
                nestedScrollEnabled={true}
              >
                {sharedRecipients.map((recipient, index) => (
                  <View key={index} style={styles.sharedRecipientItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.purple}
                    />
                    <Text style={styles.sharedRecipientText}>{recipient}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmOkButton}
                onPress={() => {
                  setShowConfirmationModal(false);
                  setModalStep("save");
                  setProjectName("");
                  setProjectDescription("");
                  setSelectedRecipients([]);
                  setSharedRecipients([]);
                  setSavedProjectName(""); // Clear saved project name
                  if (onNavigateHome) {
                    onNavigateHome();
                  }
                }}
              >
                <Text style={styles.confirmOkButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setImageToDelete(null);
        }}
        onConfirm={confirmDeleteImage}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textInverse,
    opacity: 0.8,
  },
  gallery: {
    flex: 1,
  },
  galleryContent: {
    padding: theme.spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  imageCard: {
    width: "48%",
    marginBottom: theme.spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  footerIconWithLabel: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  footerIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  footerIconLabel: {
    color: theme.colors.textInverse,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  footerButton: {
    flex: 1,
    maxWidth: 150,
    marginBottom: 0, // Override SecondaryButton's marginBottom
  },
  nextButton: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  nextButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: theme.colors.purple,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: 120,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: theme.colors.purple,
  },
  secondaryButton: {
    backgroundColor: theme.colors.purple,
    opacity: 0.8,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  imageViewer: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullImage: {
    flex: 1,
    width: "100%",
  },
  viewerControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  viewerIconWithLabel: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  viewerIconLabel: {
    color: theme.colors.textInverse,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  viewerBackButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  viewerDeleteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.error,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 100, // Move modal up from center to avoid keyboard
  },
  modalContent: {
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: "85%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textInverse,
  },
  modalSubtitle: {
    color: theme.colors.textInverse,
    fontSize: 16,
    marginBottom: theme.spacing.lg,
    textAlign: "center",
    opacity: 0.9,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.sm,
  },
  inputSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  projectNameInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.textInverse,
    fontSize: 16,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalButton: {
    width: 110, // Fixed width instead of flex
    marginHorizontal: theme.spacing.sm,
    minWidth: 110, // Override SecondaryButton's minWidth: 150
    maxWidth: 110, // Ensure it doesn't exceed
    paddingHorizontal: theme.spacing.lg, // Override SecondaryButton's xl
    paddingVertical: theme.spacing.sm, // Override SecondaryButton's md
    marginBottom: 0, // Override SecondaryButton's marginBottom
    alignItems: "center",
    justifyContent: "center",
    height: 44, // Fixed height
    minHeight: 44, // Fixed min height
    maxHeight: 44, // Fixed max height
  },
  modalButtonText: {
    fontSize: 14,
  },
  skipButton: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2, // Match SecondaryButton's borderWidth
    borderColor: theme.colors.purple, // Same as background to match visual size
    width: 110, // Match modalButton exactly
    minWidth: 110, // Match modalButton exactly
    maxWidth: 110, // Match modalButton exactly
    paddingHorizontal: theme.spacing.lg, // Match modalButton exactly
    paddingVertical: theme.spacing.sm, // Match modalButton exactly
    alignItems: "center",
    justifyContent: "center",
    height: 44, // Match modalButton exactly
    minHeight: 44, // Match modalButton exactly
    maxHeight: 44, // Match modalButton exactly
  },
  skipButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14, // Match modalButtonText
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: theme.spacing.sm, // Reduced from md
  },
  modalIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  sharePlusButton: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  sharePlusButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  recipientsList: {
    maxHeight: 200,
    marginBottom: theme.spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: theme.borderRadius.md,
  },
  recipientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  recipientItemSelected: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
  },
  recipientText: {
    color: theme.colors.textInverse,
    fontSize: 16,
  },
  recipientTextSelected: {
    color: theme.colors.purple,
    fontWeight: "600",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.purple,
    backgroundColor: "transparent",
    marginRight: theme.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: theme.colors.purple,
    borderColor: theme.colors.purple,
  },
  confirmationText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    marginBottom: theme.spacing.md,
  },
  sharedRecipientsList: {
    maxHeight: 200,
    marginBottom: theme.spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  sharedRecipientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  sharedRecipientText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    marginLeft: theme.spacing.sm,
  },
  confirmOkButton: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmOkButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ImageGallery;

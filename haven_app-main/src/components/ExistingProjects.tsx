import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  LayoutChangeEvent,
  NativeTouchEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../theme";
import { SecondaryButton } from "./SecondaryButton";
import { DeleteModal } from "./DeleteModal";
import {
  ensureImageUri,
  deleteImageFile,
  SAVED_PROJECTS_KEY,
  cleanupInvalidImages,
  migrateProjectImages,
  initializeDemoProjects,
} from "../utils/storage";
import { CommentsScreen } from "./CommentsScreen";
import {
  Comment,
  getMockComments,
  loadProjectComments,
  saveProjectComments,
  getProjectComments,
} from "../utils/comments";

interface SavedProject {
  id: string;
  name: string;
  description: string;
  images: string[];
  createdAt: number;
  sharedWith?: string[]; // Recipients the project is shared with
  shareMessage?: string; // Message sent when project was shared
}

interface ExistingProjectsProps {
  onBack: () => void;
  onSelectProject?: (project: SavedProject) => void;
  onAddScene?: (project: SavedProject) => void;
  initialSelectedProjectId?: string | null;
}

// Mock recipients list - same as ImageGallery
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

// Helper function to get alert count based on unread comments
// This will be used inside the component where we have access to allComments

// Simple module-level flag: true once we've reset comments this app session
// This persists across component remounts but resets when app reloads (JavaScript context clears)
let commentsResetThisSession = false;

// Helper function to format date
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    // Format as "MMM DD, YYYY" (e.g., "Jan 15, 2024")
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }
};

export const ExistingProjects: React.FC<ExistingProjectsProps> = ({
  onBack,
  onSelectProject,
  onAddScene,
  initialSelectedProjectId,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalStep, setEditModalStep] = useState<
    "save" | "share" | "message"
  >("save");
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editSelectedRecipients, setEditSelectedRecipients] = useState<
    string[]
  >([]);
  const [editShareMessage, setEditShareMessage] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showCommentBubbles, setShowCommentBubbles] = useState(false); // Show comment bubbles on image
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null); // Selected comment for detail modal
  const [allComments, setAllComments] = useState<Comment[]>([]); // All comments for the project
  const [showReplyInput, setShowReplyInput] = useState(false); // Show reply input in comment modal
  const [replyText, setReplyText] = useState(""); // Reply text input
  const [showAddCommentModal, setShowAddCommentModal] = useState(false); // Show add comment modal
  const [newCommentText, setNewCommentText] = useState(""); // Text for new comment
  const [pendingCommentId, setPendingCommentId] = useState<string | null>(null); // Comment ID waiting for placement
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false); // Show delete comment confirmation
  const [commentToDelete, setCommentToDelete] = useState<{
    commentId: string;
    isReply: boolean;
  } | null>(null); // Comment or reply to delete
  const [projectUnreadCounts, setProjectUnreadCounts] = useState<
    Record<string, number>
  >({}); // Cache unread counts for all projects (object for better React state detection)

  useEffect(() => {
    // Initialize demo projects on first load, then migrate and load
    const initialize = async () => {
      await initializeDemoProjects();
      await migrateProjectImages();
      loadProjects();
    };
    initialize();
  }, []);

  // ONE-TIME CLEAR: Clear all stored comments to refresh with updated mock data
  // This will run once, then remove itself
  useEffect(() => {
    const clearStoredComments = async () => {
      try {
        const CLEAR_FLAG_KEY = "@haven_comments_cleared_v4"; // Change version to clear again if needed
        const hasCleared = await AsyncStorage.getItem(CLEAR_FLAG_KEY);

        if (!hasCleared) {
          // Clear all comment data
          const keys = await AsyncStorage.getAllKeys();
          const commentKeys = keys.filter((key) =>
            key.startsWith("@haven_comments_")
          );

          if (commentKeys.length > 0) {
            await AsyncStorage.multiRemove(commentKeys);
          }

          // Mark as cleared so this doesn't run again
          await AsyncStorage.setItem(CLEAR_FLAG_KEY, "true");
        }
      } catch (error) {
        console.error("Error clearing comments:", error);
      }
    };

    clearStoredComments();
  }, []);

  // Reset all mock comments to unread ONCE when app starts (simple session tracking)
  useEffect(() => {
    // Simple check: if we've already reset this session, skip
    if (commentsResetThisSession) {
      return;
    }

    const resetAllCommentsToUnread = async () => {
      try {
        // Get all projects
        const saved = await AsyncStorage.getItem(SAVED_PROJECTS_KEY);
        if (!saved) {
          commentsResetThisSession = true; // Mark as done even if no projects
          return;
        }

        const projectsData: SavedProject[] = JSON.parse(saved);

        // Reset comments for all demo projects
        for (const project of projectsData) {
          const normalizedName = project.name?.trim().toLowerCase() || "";
          const isDemoProject =
            (normalizedName.includes("greg") &&
              normalizedName.includes("house")) ||
            (normalizedName.includes("sera") &&
              normalizedName.includes("room"));

          if (isDemoProject) {
            // Load existing comments (from AsyncStorage)
            let comments = await getProjectComments(project.id);

            // If no comments exist yet, initialize with mock comments
            if (comments.length === 0) {
              const mockComments = getMockComments(
                project.name,
                project.images
              );
              if (mockComments.length > 0) {
                await saveProjectComments(project.id, mockComments);
                comments = mockComments;
              }
            }

            if (comments.length > 0) {
              // Reset ALL comments to unread and unresolved on new app session
              const resetComments = comments.map((comment) => ({
                ...comment,
                unread: true, // Always reset to unread on app reload
                resolved: false, // Reset resolved status so comments reappear in new session
              }));
              await saveProjectComments(project.id, resetComments);
            }
          }
        }

        // Mark as reset for this session (prevents reset on component remounts)
        commentsResetThisSession = true;
      } catch (error) {
        console.error("❌ Error resetting comments:", error);
        commentsResetThisSession = true; // Mark as done even on error to prevent retries
      }
    };

    resetAllCommentsToUnread();
  }, []); // Only runs once when component first mounts (app startup)

  // Load unread counts for all projects when projects change OR when returning to list (selectedProject becomes null)
  // Always calculate from persisted AsyncStorage (actual read/unread state)
  useEffect(() => {
    if (projects.length === 0) {
      setProjectUnreadCounts({});
      return;
    }

    const loadAllProjectCounts = async () => {
      // Small delay when returning to list to ensure AsyncStorage saves have completed
      if (!selectedProject) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const countsObj: Record<string, number> = {};

      // Load counts for all projects in parallel - ALWAYS from persisted state
      const countPromises = projects.map(async (project) => {
        // Skip loading comments for the currently selected project - they're already loaded
        if (selectedProject && project.id === selectedProject.id) {
          // Use the count from allComments if this is the selected project
          const unreadCount = allComments.filter(
            (comment) => !comment.resolved && comment.unread === true
          ).length;
          return { projectId: project.id, count: unreadCount };
        }

        // Use flexible matching for demo projects (same logic for both Greg's House and Sera's Room)
        const normalizedName = project.name?.trim().toLowerCase() || "";
        const isDemoProject =
          (normalizedName.includes("greg") &&
            normalizedName.includes("house")) ||
          (normalizedName.includes("sera") && normalizedName.includes("room"));

        if (isDemoProject) {
          try {
            // Load actual persisted comments to get accurate unread count
            const comments = await loadProjectComments(
              project.id,
              project.name,
              project.images
            );
            // Count ONLY unread comments (not all comments, not unresolved - just unread)
            // Same counting logic for both projects
            const unreadCount = comments.filter(
              (comment) => !comment.resolved && comment.unread === true
            ).length;
            return { projectId: project.id, count: unreadCount };
          } catch (error) {
            console.error(
              `Error loading unread count for ${project.name}:`,
              error
            );
            return { projectId: project.id, count: 0 };
          }
        } else {
          return { projectId: project.id, count: 0 };
        }
      });

      // Wait for all counts to load
      const results = await Promise.all(countPromises);

      // Build the counts object
      results.forEach(({ projectId, count }) => {
        countsObj[projectId] = count;
      });

      // Update counts with persisted state (always use actual unread count)
      // This ensures both Greg's House and Sera's Room have accurate counts
      setProjectUnreadCounts(countsObj);
    };

    // Load counts from persisted state
    loadAllProjectCounts();
  }, [projects, selectedProject]); // Recalculate when returning to list (selectedProject becomes null)

  useEffect(() => {
    // If initialSelectedProjectId is provided, select that project
    if (initialSelectedProjectId && projects.length > 0) {
      const project = projects.find((p) => p.id === initialSelectedProjectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [initialSelectedProjectId, projects]);

  // Load comments when a project is selected
  useEffect(() => {
    if (selectedProject) {
      loadComments();
    } else {
      // Clear comments when no project is selected
      setAllComments([]);
    }
  }, [selectedProject]);

  // Persist comments whenever they change
  useEffect(() => {
    if (selectedProject && allComments.length > 0) {
      saveProjectComments(selectedProject.id, allComments).catch((error) => {
        console.error("Error persisting comments:", error);
      });

      setProjectUnreadCounts((prev) => ({
        ...prev,
        [selectedProject.id]: allComments.filter(
          (c) => !c.resolved && c.unread === true
        ).length,
      }));
    }
  }, [allComments, selectedProject?.id]);

  // Load comments for the current project
  const loadComments = async () => {
    if (!selectedProject) return;

    try {
      const comments = await loadProjectComments(
        selectedProject.id,
        selectedProject.name,
        selectedProject.images
      );

      // Apply session read state to loaded comments
      const commentsWithSessionState = comments.map((comment) => {
        if (sessionReadCommentsRef.current.has(comment.id)) {
          return { ...comment, unread: false };
        }
        return comment;
      });

      setAllComments(commentsWithSessionState);

      setProjectUnreadCounts((prev) => ({
        ...prev,
        [selectedProject.id]: commentsWithSessionState.filter(
          (c) => !c.resolved && c.unread === true
        ).length,
      }));
    } catch (error) {
      console.error("Error loading comments:", error);
      setAllComments([]);
    }
  };

  // Track last loaded project to prevent unnecessary reloads
  const lastLoadedProjectIdRef = useRef<string | null>(null);

  // Load comments when selectedProject changes
  useEffect(() => {
    if (!selectedProject) {
      setAllComments([]); // Clear comments when no project is selected
      lastLoadedProjectIdRef.current = null;
      return;
    }

    // Only load if this is a different project than last time
    if (lastLoadedProjectIdRef.current === selectedProject.id) {
      return;
    }

    lastLoadedProjectIdRef.current = selectedProject.id;
    loadComments();
  }, [selectedProject?.id]); // Use selectedProject.id to avoid unnecessary reruns

  // Get comments for the currently selected image
  const getImageComments = (imageUri: string): Comment[] => {
    return allComments.filter((comment) => {
      if (!comment.imageUri || comment.resolved) return false; // Filter out resolved comments
      // Compare normalized URIs
      const commentUri = ensureImageUri(comment.imageUri);
      const currentUri = ensureImageUri(imageUri);
      return commentUri === currentUri;
    });
  };

  // Get unread comment count for a specific image
  const getImageAlertCount = (imageUri: string): number => {
    return allComments.filter((comment) => {
      if (!comment.imageUri || comment.resolved) return false;
      const commentUri = ensureImageUri(comment.imageUri);
      const currentUri = ensureImageUri(imageUri);
      return (
        commentUri === currentUri && comment.unread === true // Only count explicitly unread comments
      );
    }).length;
  };

  // Mark all comments as read
  const markAllCommentsAsRead = async () => {
    if (!selectedProject) return;
    const updatedComments = allComments.map((comment) => ({
      ...comment,
      unread: false,
    }));
    setAllComments(updatedComments);
    // Persist the changes
    await saveProjectComments(selectedProject.id, updatedComments);
    // Update cached unread count
    setProjectUnreadCounts((prev) => ({
      ...prev,
      [selectedProject.id]: 0,
    }));
  };

  // Mark a specific comment as read
  const markCommentAsRead = async (commentId: string) => {
    if (!selectedProject) return;

    // Add to session read tracking
    sessionReadCommentsRef.current.add(commentId);

    const updatedComments = allComments.map((comment) => {
      if (comment.id === commentId) {
        return { ...comment, unread: false };
      }
      return comment;
    });
    setAllComments(updatedComments);
    await saveProjectComments(selectedProject.id, updatedComments);

    const newUnreadCount = updatedComments.filter(
      (comment) => !comment.resolved && comment.unread === true
    ).length;
    setProjectUnreadCounts((prev) => ({
      ...prev,
      [selectedProject.id]: newUnreadCount,
    }));
  };

  // Calculate total unread comment count for a project (matches footer icon count exactly)
  const getProjectUnreadCount = (project: SavedProject): number => {
    // Always prioritize cached count from projectUnreadCounts (loaded from persisted state)
    // This ensures consistency between tile badge and footer icon for all projects
    const cachedCount = projectUnreadCounts[project.id];
    if (cachedCount !== undefined) {
      return cachedCount;
    }
    // Fallback: If this is the selected project and we have loaded comments, calculate from them
    // This handles the case where counts haven't loaded yet but we have comments in memory
    if (
      selectedProject &&
      selectedProject.id === project.id &&
      allComments.length > 0
    ) {
      return allComments.filter(
        (comment) => !comment.resolved && comment.unread === true // Only count explicitly unread comments
      ).length;
    }
    // No cached count yet - return 0 until counts are loaded from persisted state
    return 0;
  };

  // Handle resolving a comment (delete it)
  const handleResolveComment = async () => {
    if (!selectedComment || !selectedProject) return;

    // Mark the comment as resolved instead of deleting (preserves history)
    const updatedComments = allComments.map((comment) => {
      if (comment.id === selectedComment.id) {
        return { ...comment, resolved: true };
      }
      return comment;
    });
    setAllComments(updatedComments);
    // Persist the changes
    await saveProjectComments(selectedProject.id, updatedComments);

    // Close modal and reset reply state
    setSelectedComment(null);
    setShowReplyInput(false);
    setReplyText("");
  };

  // Handle sending a reply
  const handleSendReply = async () => {
    if (!selectedComment || !replyText.trim() || !selectedProject) return;

    const reply: Comment = {
      id: `reply-${Date.now()}`,
      author: "You",
      message: replyText.trim(),
      timestamp: Date.now(),
    };

    // Update the comment with the reply
    const updatedComments = allComments.map((comment) => {
      if (comment.id === selectedComment.id) {
        return { ...comment, reply };
      }
      return comment;
    });

    setAllComments(updatedComments);
    // Persist the changes
    await saveProjectComments(selectedProject.id, updatedComments);

    // Update selectedComment to show the reply
    setSelectedComment({ ...selectedComment, reply });

    // Clear reply input
    setReplyText("");
    setShowReplyInput(false);
  };

  // Handle deleting a user comment or reply
  const handleDeleteComment = async () => {
    if (!commentToDelete || !selectedProject) return;

    if (commentToDelete.isReply) {
      // Delete the reply from the selected comment
      const updatedComments = allComments.map((comment) => {
        if (comment.id === commentToDelete.commentId) {
          return { ...comment, reply: undefined };
        }
        return comment;
      });
      setAllComments(updatedComments);
      await saveProjectComments(selectedProject.id, updatedComments);

      // Update selectedComment to remove reply
      if (selectedComment && selectedComment.id === commentToDelete.commentId) {
        setSelectedComment({ ...selectedComment, reply: undefined });
      }
    } else {
      // Delete the entire comment
      const updatedComments = allComments.filter(
        (comment) => comment.id !== commentToDelete.commentId
      );
      setAllComments(updatedComments);
      await saveProjectComments(selectedProject.id, updatedComments);

      // Update cached unread count
      const unreadCount = updatedComments.filter(
        (comment) => !comment.resolved && comment.unread === true
      ).length;
      setProjectUnreadCounts((prev) => ({
        ...prev,
        [selectedProject.id]: unreadCount,
      }));

      // Close the comment modal if we deleted the currently selected comment
      if (selectedComment && selectedComment.id === commentToDelete.commentId) {
        setSelectedComment(null);
        setShowReplyInput(false);
        setReplyText("");
      }
    }

    // Note: modal is closed by DeleteModal's onClose handler
    // Just clear the commentToDelete state
    setCommentToDelete(null);
  };

  // Handle adding a new comment to the current image
  const handleAddComment = async () => {
    if (!selectedProject || !selectedImage || !newCommentText.trim()) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random()}`,
      author: "You",
      message: newCommentText.trim(),
      timestamp: Date.now(),
      imageUri: selectedImage, // Link to the current scene/image
      position: undefined, // Will be set when user taps to place
      unread: true, // Automatically unread (from you)
    };

    // Add the new comment to all comments (without position initially)
    const updatedComments = [...allComments, newComment];
    setAllComments(updatedComments);

    // Close modal and clear input
    setShowAddCommentModal(false);
    setNewCommentText("");

    // Enter placement mode - user will tap to place the comment
    setPendingCommentId(newComment.id);
  };

  // State to track image container dimensions
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Track which comments have been read THIS SESSION (persists across project switches)
  const sessionReadCommentsRef = useRef<Set<string>>(new Set());

  // Handle tap on image to place comment
  const handleImageTap = (event: {
    nativeEvent: { pageX: number; pageY: number };
  }) => {
    if (!pendingCommentId || !selectedProject || !selectedImage) return;
    if (
      !imageDimensions ||
      imageDimensions.width === 0 ||
      imageDimensions.height === 0
    )
      return;

    // Get the image container's position on screen
    imageViewerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (width === 0 || height === 0) return;

      // Calculate relative position from tap coordinates
      const relativeX = event.nativeEvent.pageX - pageX;
      const relativeY = event.nativeEvent.pageY - pageY;

      // Calculate position as percentage (0-1) of image dimensions
      const positionX = Math.max(0, Math.min(1, relativeX / width));
      const positionY = Math.max(0, Math.min(1, relativeY / height));

      // Update the comment with the tap position
      const updatedComments = allComments.map((comment) => {
        if (comment.id === pendingCommentId) {
          return {
            ...comment,
            position: { x: positionX, y: positionY },
          };
        }
        return comment;
      });

      setAllComments(updatedComments);

      // Persist the changes
      saveProjectComments(selectedProject.id, updatedComments).then(() => {
        // Update cached unread count
        const unreadCount = updatedComments.filter(
          (comment) => !comment.resolved && comment.unread === true
        ).length;
        setProjectUnreadCounts((prev) => ({
          ...prev,
          [selectedProject.id]: unreadCount,
        }));
      });

      // Exit placement mode
      setPendingCommentId(null);
    });
  };

  // Handle image container layout to get dimensions
  const handleImageLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setImageDimensions({ width, height });
    }
  };

  // Ref for image container to measure dimensions
  const imageViewerRef = useRef<View>(null);

  const loadProjects = async () => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_PROJECTS_KEY);
      if (saved) {
        const projectsData: SavedProject[] = JSON.parse(saved);
        // Sort by creation date, newest first
        projectsData.sort((a, b) => b.createdAt - a.createdAt);
        setProjects(projectsData);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    }
  };

  const handleDeleteProjectPress = (projectId: string) => {
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      const updated = projects.filter((p) => p.id !== projectToDelete);
      setProjects(updated);
      await AsyncStorage.setItem(SAVED_PROJECTS_KEY, JSON.stringify(updated));
      if (selectedProject?.id === projectToDelete) {
        setSelectedProject(null);
      }
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      Alert.alert("Error", "Failed to delete project");
      setProjectToDelete(null);
    }
  };

  const updateProject = async (
    projectId: string,
    name: string,
    description: string,
    sharedWith: string[],
    shareMessage?: string
  ) => {
    try {
      const updatedProjects = projects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            name: name.trim(),
            description: description.trim(),
            sharedWith: sharedWith.length > 0 ? [...sharedWith] : undefined,
            shareMessage:
              shareMessage && shareMessage.trim()
                ? shareMessage.trim()
                : undefined,
          };
        }
        return p;
      });

      setProjects(updatedProjects);
      await AsyncStorage.setItem(
        SAVED_PROJECTS_KEY,
        JSON.stringify(updatedProjects)
      );

      // Update selectedProject if it's the one being edited
      if (selectedProject?.id === projectId) {
        const updated = updatedProjects.find((p) => p.id === projectId);
        if (updated) {
          setSelectedProject(updated);
        }
      }
    } catch (error) {
      console.error("Error updating project:", error);
      Alert.alert("Error", "Failed to update project");
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;

    const nameToSave = editProjectName.trim();
    if (!nameToSave) {
      Alert.alert("Required", "Please enter a project name");
      return;
    }

    await updateProject(
      selectedProject.id,
      nameToSave,
      editProjectDescription,
      editSelectedRecipients,
      editShareMessage
    );

    setShowEditModal(false);
    setEditModalStep("save");
    setEditProjectName("");
    setEditProjectDescription("");
    setEditSelectedRecipients([]);
    setEditShareMessage("");
  };

  const handleDeleteImagePress = (imageUri: string) => {
    setImageToDelete(imageUri);
    setShowDeleteImageModal(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete || !selectedProject) return;

    try {
      // Delete the actual image file from storage
      await deleteImageFile(imageToDelete);

      // Remove image from project
      const updatedImages = selectedProject.images.filter(
        (uri) => uri !== imageToDelete
      );

      // Update the project in the projects array
      const updatedProjects = projects.map((p) => {
        if (p.id === selectedProject.id) {
          return {
            ...p,
            images: updatedImages,
          };
        }
        return p;
      });

      setProjects(updatedProjects);
      await AsyncStorage.setItem(
        SAVED_PROJECTS_KEY,
        JSON.stringify(updatedProjects)
      );

      // Update selectedProject
      const updatedProject = {
        ...selectedProject,
        images: updatedImages,
      };
      setSelectedProject(updatedProject);

      // Close image viewer if it was the selected image
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

  // Format timestamp helper function
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    }
  };

  if (selectedProject) {
    // Show image viewer if an image is selected
    if (selectedImage) {
      return (
        <View style={styles.container}>
          <View
            style={styles.imageViewer}
            ref={imageViewerRef}
            onLayout={handleImageLayout}
          >
            <TouchableWithoutFeedback
              onPressIn={pendingCommentId ? handleImageTap : undefined}
              disabled={!pendingCommentId}
            >
              <View style={styles.imagePressable}>
                <Image
                  source={{ uri: ensureImageUri(selectedImage) }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableWithoutFeedback>
            {/* Add Comment Button - Top Right */}
            {showCommentBubbles && !pendingCommentId && (
              <TouchableOpacity
                style={styles.addCommentButton}
                onPress={() => setShowAddCommentModal(true)}
              >
                <Ionicons
                  name="add-circle"
                  size={32}
                  color={theme.colors.purple}
                />
                <Text style={styles.addCommentButtonText}>Add Comment</Text>
              </TouchableOpacity>
            )}

            {/* Placement Instruction Overlay */}
            {pendingCommentId && (
              <View style={styles.placementInstructionOverlay}>
                <View style={styles.placementInstructionBubble}>
                  <Text style={styles.placementInstructionText}>
                    Tap on the image to place your comment
                  </Text>
                </View>
              </View>
            )}

            {/* Comment Bubbles Overlay */}
            {showCommentBubbles && (
              <View
                style={styles.commentBubblesOverlay}
                pointerEvents={pendingCommentId ? "none" : "box-none"}
              >
                {getImageComments(selectedImage)
                  .filter((comment) => comment.position) // Only show comments with positions
                  .map((comment) => {
                    const isUnread = comment.unread === true; // Only show unread indicator for explicitly unread comments
                    return (
                      <TouchableOpacity
                        key={comment.id}
                        style={[
                          styles.commentBubble,
                          isUnread && styles.commentBubbleUnread,
                          comment.position && {
                            left: `${comment.position.x * 100}%`,
                            top: `${comment.position.y * 100}%`,
                          },
                        ]}
                        onPress={() => {
                          // Don't allow opening comments during placement mode
                          if (pendingCommentId) return;
                          // Mark comment as read when opened
                          markCommentAsRead(comment.id);
                          setSelectedComment(comment);
                        }}
                      >
                        <Ionicons
                          name="chatbubble"
                          size={24}
                          color={theme.colors.purple}
                        />
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}

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
                onPress={() => setShowCommentBubbles(!showCommentBubbles)}
              >
                <View
                  style={
                    showCommentBubbles
                      ? styles.viewerCommentButtonHide
                      : styles.viewerCommentButton
                  }
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={24}
                    color={
                      showCommentBubbles
                        ? theme.colors.purple
                        : theme.colors.textInverse
                    }
                  />
                </View>
                <Text style={styles.viewerIconLabel}>
                  {showCommentBubbles ? "Hide Comments" : "View Comments"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewerIconWithLabel}
                onPress={() => {
                  handleDeleteImagePress(selectedImage);
                }}
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
            visible={showDeleteImageModal}
            onClose={() => {
              setShowDeleteImageModal(false);
              setImageToDelete(null);
            }}
            onConfirm={confirmDeleteImage}
            title="Delete Image"
            message="Are you sure you want to delete this image? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
          />

          {/* Comment Detail Modal */}
          <Modal
            visible={selectedComment !== null}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              setSelectedComment(null);
              setShowReplyInput(false);
              setReplyText("");
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalOverlay}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
              <View style={styles.commentModalContent}>
                <TouchableOpacity
                  style={styles.commentModalCloseButton}
                  onPress={() => {
                    setSelectedComment(null);
                    setShowReplyInput(false);
                    setReplyText("");
                  }}
                >
                  <View style={styles.commentModalCloseCircle}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.purple}
                    />
                  </View>
                </TouchableOpacity>
                {selectedComment && (
                  <>
                    <View style={styles.commentHeaderRow}>
                      <Text style={styles.commentModalAuthor}>
                        {selectedComment.author}
                      </Text>
                      {selectedComment.author === "You" && (
                        <TouchableOpacity
                          style={styles.deleteCommentButton}
                          onPress={async () => {
                            // Delete the comment immediately
                            const updatedComments = allComments.filter(
                              (comment) => comment.id !== selectedComment.id
                            );
                            setAllComments(updatedComments);
                            if (selectedProject) {
                              await saveProjectComments(
                                selectedProject.id,
                                updatedComments
                              );
                              // Update cached unread count
                              const unreadCount = updatedComments.filter(
                                (comment) =>
                                  !comment.resolved && comment.unread === true
                              ).length;
                              setProjectUnreadCounts((prev) => ({
                                ...prev,
                                [selectedProject.id]: unreadCount,
                              }));
                            }
                            // Close the comment modal
                            setSelectedComment(null);
                            setShowReplyInput(false);
                            setReplyText("");
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={theme.colors.error}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentModalMessage}>
                      {selectedComment.message}
                    </Text>
                    <Text style={styles.commentModalTimestamp}>
                      {formatTimestamp(selectedComment.timestamp)}
                    </Text>

                    {/* Show reply if exists */}
                    {selectedComment.reply && (
                      <View style={styles.replyContainer}>
                        <View style={styles.replyHeader}>
                          <Text style={styles.replyAuthor}>
                            {selectedComment.reply.author}
                          </Text>
                          {selectedComment.reply.author === "You" && (
                            <TouchableOpacity
                              style={styles.deleteReplyButton}
                              onPress={async () => {
                                // Delete the reply immediately
                                const updatedComments = allComments.map(
                                  (comment) => {
                                    if (comment.id === selectedComment.id) {
                                      return { ...comment, reply: undefined };
                                    }
                                    return comment;
                                  }
                                );
                                setAllComments(updatedComments);
                                if (selectedProject) {
                                  await saveProjectComments(
                                    selectedProject.id,
                                    updatedComments
                                  );
                                }
                                // Update selectedComment to remove reply
                                setSelectedComment({
                                  ...selectedComment,
                                  reply: undefined,
                                });
                              }}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color={theme.colors.error}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.replyMessage}>
                          {selectedComment.reply.message}
                        </Text>
                        <Text style={styles.replyTimestamp}>
                          {formatTimestamp(selectedComment.reply.timestamp)}
                        </Text>
                      </View>
                    )}

                    {/* Reply input */}
                    {showReplyInput && (
                      <View style={styles.replyInputContainer}>
                        <TextInput
                          style={styles.replyInput}
                          placeholder="Type a reply..."
                          placeholderTextColor={theme.colors.textSecondary}
                          value={replyText}
                          onChangeText={(text) =>
                            setReplyText(text.replace(/[\n\r]/g, ""))
                          }
                          multiline={false}
                          returnKeyType="send"
                          blurOnSubmit={false}
                          onSubmitEditing={handleSendReply}
                        />
                        <TouchableOpacity
                          style={styles.replySendButton}
                          onPress={handleSendReply}
                        >
                          <Ionicons
                            name="send"
                            size={20}
                            color={theme.colors.purple}
                          />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Action buttons */}
                    {showReplyInput ? (
                      <View style={styles.commentModalActions}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => {
                            setShowReplyInput(false);
                            setReplyText("");
                          }}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.commentModalActions}>
                        <TouchableOpacity
                          style={styles.resolveButton}
                          onPress={handleResolveComment}
                        >
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={theme.colors.purple}
                          />
                          <Text style={styles.resolveButtonText}>Resolve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.replyButton}
                          onPress={() => {
                            setShowReplyInput(true);
                          }}
                        >
                          <Ionicons
                            name="chatbubble"
                            size={20}
                            color={theme.colors.purple}
                          />
                          <Text style={styles.replyButtonText}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Add Comment Modal */}
          <Modal
            visible={showAddCommentModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              setShowAddCommentModal(false);
              setNewCommentText("");
            }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalOverlay}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
              <View style={styles.commentModalContent}>
                <TouchableOpacity
                  style={styles.commentModalCloseButton}
                  onPress={() => {
                    setShowAddCommentModal(false);
                    setNewCommentText("");
                  }}
                >
                  <View style={styles.commentModalCloseCircle}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.purple}
                    />
                  </View>
                </TouchableOpacity>
                <Text style={styles.commentModalAuthor}>Add Comment</Text>
                <TextInput
                  style={styles.addCommentInput}
                  placeholder="Type your comment..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={newCommentText}
                  onChangeText={(text) =>
                    setNewCommentText(text.replace(/[\n\r]/g, ""))
                  }
                  multiline={false}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onSubmitEditing={handleAddComment}
                />
                <View style={styles.commentModalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowAddCommentModal(false);
                      setNewCommentText("");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addCommentSubmitButton,
                      !newCommentText.trim() &&
                        styles.addCommentSubmitButtonDisabled,
                    ]}
                    onPress={handleAddComment}
                    disabled={!newCommentText.trim()}
                  >
                    <Text style={styles.addCommentSubmitButtonText}>
                      Add Comment
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      );
    }

    // Show comments screen if requested
    if (showComments) {
      return (
        <CommentsScreen
          projectId={selectedProject.id}
          projectName={selectedProject.name}
          shareMessage={selectedProject.shareMessage}
          createdAt={selectedProject.createdAt}
          projectImages={selectedProject.images}
          comments={allComments}
          onCommentsChange={(updatedComments) => {
            // Track any comments that were marked as read in the session
            updatedComments.forEach((comment) => {
              const oldComment = allComments.find((c) => c.id === comment.id);
              if (oldComment?.unread === true && comment.unread === false) {
                sessionReadCommentsRef.current.add(comment.id);
              }
            });
            setAllComments(updatedComments);
          }}
          onBack={() => {
            // Mark all comments as read when closing comments screen
            markAllCommentsAsRead();
            setShowComments(false);
          }}
          onImagePress={(imageUri, commentId) => {
            setShowComments(false);
            setSelectedImage(imageUri);
            // Find and open the specific comment if commentId is provided
            if (commentId) {
              const commentToOpen = allComments.find((c) => c.id === commentId);
              if (commentToOpen) {
                // Mark comment as read when opened from comments screen
                markCommentAsRead(commentId);
                setSelectedComment(commentToOpen);
                setShowCommentBubbles(true);
              }
            } else {
              // If no commentId, just show comment bubbles
              setShowCommentBubbles(true);
            }
          }}
        />
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedProject(null)}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.textInverse}
            />
          </TouchableOpacity>
          <Text style={styles.title}>{selectedProject.name}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProjectPress(selectedProject.id)}
          >
            <Ionicons
              name="trash-outline"
              size={24}
              color={theme.colors.textInverse}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.projectInfoContainer}>
          {/* Description */}
          {selectedProject.description ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={theme.colors.purple}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText} numberOfLines={2}>
                {selectedProject.description}
              </Text>
            </View>
          ) : null}

          {/* Shared With */}
          {selectedProject.sharedWith &&
          selectedProject.sharedWith.length > 0 ? (
            <View style={styles.infoRow}>
              <Ionicons
                name="people-outline"
                size={20}
                color={theme.colors.purple}
                style={styles.infoIcon}
              />
              <Text style={styles.sharedWithText}>
                {selectedProject.sharedWith.join(", ")}
              </Text>
            </View>
          ) : (
            <View style={styles.infoRow}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.colors.purple}
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>Not shared</Text>
            </View>
          )}

          {/* Image Count */}
          <View style={styles.infoRow}>
            <Ionicons
              name="images-outline"
              size={20}
              color={theme.colors.purple}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              {selectedProject.images.length} image
              {selectedProject.images.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Created Date with Edit Button */}
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={theme.colors.purple}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Created: {formatDate(selectedProject.createdAt)}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.7}
              onPress={() => {
                const project = selectedProject;
                if (project) {
                  setEditProjectName(project.name);
                  setEditProjectDescription(project.description || "");
                  setEditSelectedRecipients(project.sharedWith || []);
                  setEditShareMessage("");
                  setEditModalStep("save");
                  setShowEditModal(true);
                }
              }}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={theme.colors.textInverse}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.gallery}
          contentContainerStyle={styles.galleryContent}
        >
          {selectedProject.images.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No images in this project</Text>
            </View>
          ) : (
            selectedProject.images.map((uri, index) => {
              const alertCount = getImageAlertCount(uri);
              return (
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
                  {alertCount > 0 && (
                    <View style={styles.imageAlertBadge}>
                      <Text style={styles.imageAlertBadgeText}>
                        {alertCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerIconWithLabel}
            onPress={() => setShowComments(true)}
          >
            <View style={styles.footerCommentButton}>
              <Ionicons
                name="chatbubbles-outline"
                size={24}
                color={theme.colors.textInverse}
              />
              {(() => {
                // Calculate total unread comments (all comments, not just image-specific)
                const totalAlerts = allComments.filter(
                  (comment) => !comment.resolved && comment.unread === true // Only count explicitly unread comments
                ).length;
                return totalAlerts > 0 ? (
                  <View style={styles.commentAlertBadge}>
                    <Text style={styles.commentAlertBadgeText}>
                      {totalAlerts}
                    </Text>
                  </View>
                ) : null;
              })()}
            </View>
            <Text style={styles.footerIconLabel}>Comments</Text>
          </TouchableOpacity>
          {onAddScene && (
            <TouchableOpacity
              style={styles.footerIconWithLabel}
              onPress={() => {
                if (onAddScene) {
                  onAddScene(selectedProject);
                }
              }}
            >
              <View style={styles.footerARButton}>
                <Ionicons
                  name="camera-outline"
                  size={24}
                  color={theme.colors.textInverse}
                />
              </View>
              <Text style={styles.footerIconLabel}>AR</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Edit Project Modal */}
        <Modal
          visible={showEditModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowEditModal(false);
            setEditModalStep("save");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editModalStep === "save"
                    ? "Edit Project"
                    : editModalStep === "share"
                    ? "Share"
                    : "Message"}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowEditModal(false);
                    setEditModalStep("save");
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textInverse}
                  />
                </TouchableOpacity>
              </View>

              {/* Step 1: Edit Name and Description */}
              {editModalStep === "save" && (
                <>
                  <Text style={styles.inputLabel}>Name this project</Text>
                  <TextInput
                    style={styles.projectNameInput}
                    placeholder="Enter project name"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={editProjectName}
                    onChangeText={setEditProjectName}
                    autoFocus={true}
                  />

                  <Text
                    style={[styles.inputLabel, { marginTop: theme.spacing.md }]}
                  >
                    Description (optional)
                  </Text>
                  <TextInput
                    style={styles.projectNameInput}
                    placeholder="Enter project description"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={editProjectDescription}
                    onChangeText={setEditProjectDescription}
                    blurOnSubmit={true}
                    returnKeyType="done"
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={() => {
                        if (!editProjectName.trim()) {
                          Alert.alert(
                            "Required",
                            "Please enter a project name"
                          );
                          return;
                        }
                        setEditModalStep("share");
                      }}
                    >
                      <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 2: Share */}
              {editModalStep === "share" && (
                <>
                  <Text style={styles.inputLabel}>Your Friends</Text>
                  <ScrollView
                    style={styles.recipientsList}
                    nestedScrollEnabled={true}
                  >
                    {recipients.map((recipient, index) => {
                      const isSelected =
                        editSelectedRecipients.includes(recipient);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.recipientItem,
                            isSelected && styles.recipientItemSelected,
                          ]}
                          onPress={() => {
                            if (isSelected) {
                              setEditSelectedRecipients(
                                editSelectedRecipients.filter(
                                  (r) => r !== recipient
                                )
                              );
                            } else {
                              setEditSelectedRecipients([
                                ...editSelectedRecipients,
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
                      onPress={() => setEditModalStep("save")}
                      style={styles.modalButton}
                      textStyle={styles.modalButtonText}
                    />
                    <TouchableOpacity
                      style={[styles.skipButton, styles.modalButton]}
                      onPress={() => {
                        if (editSelectedRecipients.length > 0) {
                          // If recipients selected, go to message step
                          setEditModalStep("message");
                        } else {
                          // If no recipients, save directly
                          handleUpdateProject();
                        }
                      }}
                    >
                      <Text style={styles.skipButtonText}>
                        {editSelectedRecipients.length > 0 ? "Next" : "Save"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 3: Message */}
              {editModalStep === "message" && (
                <>
                  <Text style={styles.inputLabel}>
                    Add a message (optional)
                  </Text>
                  <Text style={styles.inputSubtext}>
                    Write a message to send with your project
                  </Text>
                  <TextInput
                    style={styles.projectNameInput}
                    placeholder="Enter your message..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={editShareMessage}
                    onChangeText={setEditShareMessage}
                    blurOnSubmit={true}
                    returnKeyType="done"
                  />

                  <View style={styles.modalButtons}>
                    <SecondaryButton
                      title="Back"
                      onPress={() => setEditModalStep("share")}
                      style={styles.modalButton}
                      textStyle={styles.modalButtonText}
                    />
                    <TouchableOpacity
                      style={[styles.skipButton, styles.modalButton]}
                      onPress={handleUpdateProject}
                    >
                      <Text style={styles.skipButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteModal
          visible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setProjectToDelete(null);
          }}
          onConfirm={confirmDeleteProject}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.textInverse}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Existing Projects</Text>
        <View style={styles.placeholder} />
      </View>

      {projects.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No projects yet</Text>
          <Text style={styles.emptySubtext}>
            Create a new project to get started!
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.projectsGrid}
          contentContainerStyle={styles.projectsGridContent}
        >
          {projects.map((project) => {
            // Calculate total unread comment count for this project
            const totalAlerts = getProjectUnreadCount(project);
            // Show badge if there are any alerts (always calculate, don't wait for async)
            const showBadge = totalAlerts > 0;
            return (
              <TouchableOpacity
                key={project.id}
                style={styles.projectTile}
                onPress={() => setSelectedProject(project)}
              >
                {project.images.length > 0 ? (
                  <View style={styles.projectThumbnailContainer}>
                    <Image
                      source={{ uri: ensureImageUri(project.images[0]) }}
                      style={styles.projectThumbnail}
                      resizeMode="cover"
                    />
                    {showBadge && (
                      <View style={styles.projectAlertBadge}>
                        <Text style={styles.projectAlertBadgeText}>
                          {totalAlerts}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.projectThumbnailPlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={40}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                )}
                <View style={styles.projectInfo}>
                  <View style={styles.projectInfoTop}>
                    <Text style={styles.projectName} numberOfLines={1}>
                      {project.name}
                    </Text>
                    {project.description ? (
                      <Text style={styles.projectDescription} numberOfLines={2}>
                        {project.description}
                      </Text>
                    ) : (
                      <View style={styles.descriptionSpacer} />
                    )}
                  </View>
                  <View style={styles.projectInfoBottom}>
                    <View style={styles.projectFooter}>
                      <Ionicons
                        name="images-outline"
                        size={12}
                        color={theme.colors.purple}
                        style={styles.imageIcon}
                      />
                      <Text style={styles.projectImageCount}>
                        {project.images.length} image
                        {project.images.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View style={styles.projectDateContainer}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={theme.colors.purple}
                        style={styles.dateIcon}
                      />
                      <Text style={styles.projectDate}>
                        {formatDate(project.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Delete Comment Confirmation Modal - Rendered at root level to appear over all other modals */}
      <DeleteModal
        visible={showDeleteCommentModal}
        onClose={() => {
          setShowDeleteCommentModal(false);
          setCommentToDelete(null);
        }}
        onConfirm={handleDeleteComment}
        title={commentToDelete?.isReply ? "Delete Reply" : "Delete Comment"}
        message={
          commentToDelete?.isReply
            ? "Are you sure you want to delete this reply? This action cannot be undone."
            : "Are you sure you want to delete this comment? This action cannot be undone."
        }
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textInverse,
    flex: 1,
    textAlign: "center",
  },
  projectInfoContainer: {
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
    minHeight: 24,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  infoIcon: {
    marginRight: theme.spacing.sm,
  },
  infoText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  sharedWithText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  descriptionContainer: {
    padding: theme.spacing.lg,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  descriptionText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    lineHeight: 24,
  },
  projectsGrid: {
    flex: 1,
  },
  projectsGridContent: {
    padding: theme.spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  projectTile: {
    width: "48%",
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.grayBlack,
    borderRadius: theme.borderRadius.lg,
    overflow: "visible", // Allow badge to show
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectThumbnailContainer: {
    position: "relative",
    width: "100%",
    height: 150,
  },
  projectThumbnail: {
    width: "100%",
    height: 150,
    backgroundColor: "#000",
  },
  projectThumbnailPlaceholder: {
    width: "100%",
    height: 150,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  projectAlertBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444", // Red color
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 7,
    borderWidth: 2,
    borderColor: "#000",
    zIndex: 10,
  },
  projectAlertBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  projectInfo: {
    padding: theme.spacing.md,
    height: 140,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  projectInfoTop: {
    flex: 1,
    paddingBottom: theme.spacing.md,
  },
  projectName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.sm,
  },
  projectDescription: {
    fontSize: 14,
    color: theme.colors.textInverse,
    lineHeight: 20,
  },
  descriptionSpacer: {
    flex: 1,
  },
  projectInfoBottom: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  projectFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  imageIcon: {
    marginRight: theme.spacing.xs,
  },
  projectImageCount: {
    fontSize: 12,
    color: theme.colors.textInverse,
    opacity: 0.9,
    fontWeight: "500",
  },
  projectDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateIcon: {
    marginRight: theme.spacing.xs,
  },
  projectDate: {
    fontSize: 12,
    color: theme.colors.textInverse,
    opacity: 0.9,
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
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    borderRadius: theme.borderRadius.md,
  },
  imageAlertBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444", // Red color
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 7,
    borderWidth: 2,
    borderColor: "#000",
    zIndex: 10,
  },
  imageAlertBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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
  footerCommentButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  commentAlertBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444", // Red color
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#000",
    zIndex: 10,
  },
  commentAlertBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  footerARButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  footerIconWithLabel: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  footerIconLabel: {
    color: theme.colors.textInverse,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  footerARButtonText: {
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
  nextButton: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
  },
  modalButton: {
    width: 110,
    marginHorizontal: theme.spacing.sm,
    minWidth: 110,
    maxWidth: 110,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    minHeight: 44,
    maxHeight: 44,
  },
  modalButtonText: {
    fontSize: 14,
  },
  skipButton: {
    backgroundColor: theme.colors.purple,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.purple,
    width: 110,
    minWidth: 110,
    maxWidth: 110,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    minHeight: 44,
    maxHeight: 44,
  },
  skipButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: theme.spacing.sm,
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
  },
  viewerDeleteButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerCommentButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.purple, // Purple circle for "View Comments"
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  viewerCommentButtonHide: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.textInverse, // White circle for "Hide Comments"
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.colors.purple,
  },
  commentBubblesOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
  commentBubble: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  commentBubbleUnread: {
    borderWidth: 3,
    borderColor: "#EF4444", // Red color for unread comments
  },
  commentModalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: "85%",
    maxWidth: 400,
    position: "relative",
  },
  commentModalCloseButton: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 10,
  },
  commentModalCloseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  commentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  commentModalAuthor: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.purple,
  },
  deleteCommentButton: {
    padding: theme.spacing.xs,
  },
  commentModalMessage: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  commentModalTimestamp: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  replyContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.purple,
  },
  replyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  replyAuthor: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.purple,
  },
  deleteReplyButton: {
    padding: theme.spacing.xs,
  },
  replyMessage: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  replyTimestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  replyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.purple,
  },
  replyInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    paddingVertical: theme.spacing.xs,
  },
  replySendButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  commentModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  resolveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.purple,
    gap: theme.spacing.xs,
  },
  resolveButtonText: {
    color: theme.colors.purple,
    fontSize: 16,
    fontWeight: "600",
  },
  replyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.purple,
    gap: theme.spacing.xs,
  },
  replyButtonText: {
    color: theme.colors.purple,
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.purple,
  },
  cancelButtonText: {
    color: theme.colors.purple,
    fontSize: 16,
    fontWeight: "600",
  },
  addCommentButton: {
    position: "absolute",
    top: theme.spacing.xl * 2,
    right: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
    zIndex: 100,
  },
  addCommentButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: "600",
  },
  addCommentInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.purple,
    marginTop: theme.spacing.md,
    minHeight: 50,
  },
  addCommentSubmitButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    backgroundColor: "rgba(147, 51, 234, 0.1)",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.purple,
  },
  addCommentSubmitButtonDisabled: {
    opacity: 0.5,
  },
  addCommentSubmitButtonText: {
    color: theme.colors.purple,
    fontSize: 16,
    fontWeight: "600",
  },
  imagePressable: {
    flex: 1,
    width: "100%",
  },
  placementInstructionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "box-none",
  },
  placementInstructionBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.purple,
    maxWidth: "80%",
  },
  placementInstructionText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ExistingProjects;

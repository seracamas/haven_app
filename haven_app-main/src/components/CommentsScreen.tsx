import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import { ensureImageUri } from "../utils/storage";
import { Comment, getMockComments } from "../utils/comments";
import { DeleteModal } from "./DeleteModal";

interface CommentsScreenProps {
  projectId: string;
  projectName: string;
  shareMessage?: string; // Original message sent when project was shared
  createdAt?: number; // Project creation timestamp
  projectImages?: string[]; // All images in the project for navigation
  onBack: () => void;
  onImagePress?: (imageUri: string, commentId?: string) => void; // Callback when photo thumbnail is pressed, with optional comment ID to open
  comments?: Comment[]; // Optional comments prop to sync with parent component
  onCommentsChange?: (comments: Comment[]) => void; // Callback when comments change
}

// Comments are now loaded from shared utility

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

export const CommentsScreen: React.FC<CommentsScreenProps> = ({
  projectId,
  projectName,
  shareMessage,
  createdAt,
  projectImages,
  onBack,
  onImagePress,
  comments: externalComments,
  onCommentsChange,
}) => {
  // Combine the original share message (if exists) with other comments
  const initialComments: Comment[] = [];

  // Add the original share message as the first comment if it exists
  if (shareMessage && shareMessage.trim()) {
    initialComments.push({
      id: "original-share-message",
      author: "You",
      message: shareMessage,
      timestamp: createdAt || Date.now(),
    });
  }

  // Use external comments if provided, otherwise use local state
  const [localComments, setLocalComments] = useState<Comment[]>([
    ...initialComments,
    ...getMockComments(projectName, projectImages),
  ]);

  const comments = externalComments || localComments;
  const setComments =
    externalComments && onCommentsChange ? onCommentsChange : setLocalComments;
  const [newComment, setNewComment] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  ); // Track which comments have expanded replies
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{
    commentId: string;
    isReply: boolean;
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // Track which comment is being replied to
  const [replyText, setReplyText] = useState(""); // Reply text input

  const handleSendComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: "You", // In a real app, this would be the current user
        message: newComment.trim(),
        timestamp: Date.now(),
      };
      // Add new comment but keep original share message at the top
      const originalMessage = comments.find(
        (c) => c.id === "original-share-message"
      );
      const otherComments = comments.filter(
        (c) => c.id !== "original-share-message"
      );
      if (originalMessage) {
        setComments([originalMessage, comment, ...otherComments]);
      } else {
        setComments([comment, ...comments]);
      }
      setNewComment("");
    }
  };

  const handleSendReply = (commentId: string) => {
    if (replyText.trim()) {
      const reply: Comment = {
        id: `reply-${Date.now()}`,
        author: "You",
        message: replyText.trim(),
        timestamp: Date.now(),
      };
      const updatedComments = comments.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, reply };
        }
        return comment;
      });
      setComments(updatedComments);
      setReplyText("");
      setReplyingTo(null);
      // Expand the reply to show it
      const newExpanded = new Set(expandedReplies);
      newExpanded.add(commentId);
      setExpandedReplies(newExpanded);
    }
  };

  const handleDeleteComment = () => {
    if (!commentToDelete) return;

    if (commentToDelete.isReply) {
      // Delete the reply
      const updatedComments = comments.map((comment) => {
        if (comment.id === commentToDelete.commentId) {
          return { ...comment, reply: undefined };
        }
        return comment;
      });
      setComments(updatedComments);
    } else {
      // Delete the entire comment
      const updatedComments = comments.filter(
        (comment) => comment.id !== commentToDelete.commentId
      );
      setComments(updatedComments);
    }

    // Note: modal is closed by DeleteModal's onClose handler
    // Just clear the commentToDelete state
    setCommentToDelete(null);
  };

  const renderComment = ({ item }: { item: Comment }) => {
    // Filter out resolved comments
    if (item.resolved) return null;

    const hasReply = !!item.reply;
    const isExpanded = expandedReplies.has(item.id);

    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.author}</Text>
          {item.author === "You" && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                // Delete the comment immediately
                const updatedComments = comments.filter(
                  (comment) => comment.id !== item.id
                );
                setComments(updatedComments);
              }}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.colors.error}
              />
            </TouchableOpacity>
          )}
        </View>
        <View
          style={[
            styles.commentContent,
            item.imageUri && styles.commentContentWithImage,
          ]}
        >
          <View style={styles.commentTextContainer}>
            <Text style={styles.commentMessage}>{item.message}</Text>
            <Text style={styles.commentTimestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
            {hasReply && (
              <TouchableOpacity
                style={styles.replyIndicator}
                onPress={() => {
                  const newExpanded = new Set(expandedReplies);
                  if (isExpanded) {
                    newExpanded.delete(item.id);
                  } else {
                    newExpanded.add(item.id);
                  }
                  setExpandedReplies(newExpanded);
                }}
              >
                <Text style={styles.replyIndicatorText}>
                  {isExpanded ? "Hide reply" : "1 reply"}
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={theme.colors.purple}
                />
              </TouchableOpacity>
            )}
          </View>
          {item.imageUri && (
            <View style={styles.commentImageWrapper}>
              <TouchableOpacity
                style={styles.commentImageContainer}
                onPress={() => {
                  if (onImagePress) {
                    onImagePress(item.imageUri!, item.id);
                  }
                }}
              >
                <Image
                  source={{ uri: ensureImageUri(item.imageUri) }}
                  style={styles.commentImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={theme.colors.purple}
                style={styles.commentImageArrow}
              />
            </View>
          )}
        </View>
        {hasReply && isExpanded && item.reply && (
          <View style={styles.nestedReplyContainer}>
            <View style={styles.nestedReplyHeader}>
              <Text style={styles.nestedReplyAuthor}>{item.reply.author}</Text>
              {item.reply.author === "You" && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    // Delete the reply immediately
                    const updatedComments = comments.map((comment) => {
                      if (comment.id === item.id) {
                        return { ...comment, reply: undefined };
                      }
                      return comment;
                    });
                    setComments(updatedComments);
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
            <Text style={styles.nestedReplyMessage}>{item.reply.message}</Text>
            <Text style={styles.nestedReplyTimestamp}>
              {formatTimestamp(item.reply.timestamp)}
            </Text>
          </View>
        )}

        {/* Reply button or reply input */}
        {!hasReply &&
          (replyingTo === item.id ? (
            <View style={styles.replyInputContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type a reply..."
                placeholderTextColor={theme.colors.textSecondary}
                value={replyText}
                onChangeText={setReplyText}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={() => handleSendReply(item.id)}
                autoFocus
              />
              <TouchableOpacity
                style={styles.replyCancelButton}
                onPress={() => {
                  setReplyingTo(null);
                  setReplyText("");
                }}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => setReplyingTo(item.id)}
            >
              <Text style={styles.replyButtonText}>Reply</Text>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={theme.colors.purple}
              />
            </TouchableOpacity>
          ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.textInverse}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Comments</Text>
          <View style={styles.placeholder} />
        </View>

        {comments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubbles-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to comment on this project!
            </Text>
          </View>
        ) : (
          <FlatList
            data={comments.filter((c) => !c.resolved)}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.commentsList}
            inverted={false}
            style={styles.commentsFlatList}
          />
        )}

        {/* Only show main comment input when not replying */}
        {!replyingTo && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#FFFFFF"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newComment.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendComment}
              disabled={!newComment.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={
                  newComment.trim()
                    ? theme.colors.textInverse
                    : theme.colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Comment Confirmation Modal */}
        <DeleteModal
          visible={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
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
  projectNameContainer: {
    padding: theme.spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  projectName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textInverse,
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
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  commentsFlatList: {
    flex: 1,
  },
  commentsList: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  commentContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.purple,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentAuthor: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.purple,
    marginBottom: theme.spacing.xs,
    marginTop: 0,
  },
  commentContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentContentWithImage: {
    gap: theme.spacing.sm,
  },
  commentTextContainer: {
    flex: 1,
  },
  commentMessage: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  commentTimestamp: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  commentImageWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  commentImageContainer: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.purple,
  },
  commentImage: {
    width: "100%",
    height: "100%",
  },
  commentImageArrow: {
    marginTop: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    padding: theme.spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "flex-end",
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textInverse,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
    borderColor: theme.colors.purple,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.purple,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  replyIndicatorText: {
    color: theme.colors.purple,
    fontSize: 14,
    fontWeight: "600",
  },
  nestedReplyContainer: {
    marginTop: theme.spacing.md,
    marginLeft: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: "rgba(147, 51, 234, 0.2)",
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.purple,
  },
  nestedReplyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  nestedReplyAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.purple,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  nestedReplyMessage: {
    fontSize: 14,
    color: "#000000",
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  nestedReplyTimestamp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  replyButtonText: {
    color: theme.colors.purple,
    fontSize: 14,
    fontWeight: "600",
  },
  replyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  replyInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: "#000000",
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.colors.purple,
    minHeight: 36,
  },
  replySendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(147, 51, 234, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  replyCancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});

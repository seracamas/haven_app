import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import { SecondaryButton } from "./SecondaryButton";

interface DeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title = "Delete",
  message = "Are you sure you want to delete this item?",
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  const handleConfirm = () => {
    onClose(); // Close modal first
    onConfirm(); // Then execute delete
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.textInverse}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.iconContainer}>
            <Ionicons
              name="trash-outline"
              size={48}
              color={theme.colors.error}
            />
          </View>

          <Text style={styles.messageText}>{message}</Text>

          <View style={styles.modalButtons}>
            <SecondaryButton
              title={cancelText}
              onPress={onClose}
              style={styles.modalButton}
              textStyle={styles.modalButtonText}
            />
            <TouchableOpacity
              style={[styles.deleteButton, styles.modalButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.deleteButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
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
  iconContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  messageText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
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
  deleteButton: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.error,
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
  deleteButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default DeleteModal;

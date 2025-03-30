import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';

export function ProfileScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setShowDeleteModal(false);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#717171" />
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.displayName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-outline" size={24} color="#222222" />
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={24} color="#717171" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color="#222222" />
          <Text style={styles.menuItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={24} color="#717171" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#222222" />
          <Text style={styles.menuItemText}>Settings</Text>
          <Ionicons name="chevron-forward" size={24} color="#717171" />
        </TouchableOpacity>
      </View>

      {error && <ErrorMessage error={error} />}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => setShowDeleteModal(true)}
      >
        <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#717171',
  },
  section: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#222222',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 12,
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 12,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#717171',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
  },
  cancelButtonText: {
    color: '#222222',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
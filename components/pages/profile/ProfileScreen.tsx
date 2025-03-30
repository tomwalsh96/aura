import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';
import { SettingsScreen } from './SettingsScreen';

const AVATAR_OPTIONS = [
  require('../../../assets/avatars/uifaces-abstract-image-1.jpg'),
  require('../../../assets/avatars/uifaces-abstract-image-2.jpg'),
  require('../../../assets/avatars/uifaces-abstract-image-3.jpg'),
  require('../../../assets/avatars/uifaces-abstract-image-4.jpg'),
  require('../../../assets/avatars/uifaces-abstract-image-5.jpg'),
  require('../../../assets/avatars/uifaces-abstract-image-6.jpg'),
];

const AVATAR_NAMES = [
  'uifaces-abstract-image-1.jpg',
  'uifaces-abstract-image-2.jpg',
  'uifaces-abstract-image-3.jpg',
  'uifaces-abstract-image-4.jpg',
  'uifaces-abstract-image-5.jpg',
  'uifaces-abstract-image-6.jpg',
];

export default function ProfileScreen() {
  const { user, logout, deleteAccount, updateProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      // Find the index of the current avatar in the options
      const currentAvatarName = user.photoURL?.split('/').pop();
      const avatarIndex = AVATAR_NAMES.indexOf(currentAvatarName || '');
      if (avatarIndex !== -1) {
        setSelectedAvatar(avatarIndex);
      }
    }
  }, [user]);

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

  const handleSettingsPress = () => {
    setShowSettings(true);
  };

  const handleBackFromSettings = () => {
    setShowSettings(false);
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        displayName,
        photoURL: AVATAR_NAMES[selectedAvatar]
      });
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (showSettings) {
    return <SettingsScreen onBack={handleBackFromSettings} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={AVATAR_OPTIONS[selectedAvatar]}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.name}>{user?.displayName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => setShowEditProfile(true)}
        >
          <Ionicons name="person-outline" size={24} color="#222222" />
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={24} color="#717171" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleSettingsPress}
        >
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
            <Text style={styles.modalDescription}>
              Are you sure you want to delete your account? This action cannot be undone.
            </Text>
            <View style={styles.modalFooter}>
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

      <Modal
        visible={showEditProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setShowEditProfile(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#717171" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.avatarPreviewContainer}>
                <Image
                  source={AVATAR_OPTIONS[selectedAvatar]}
                  style={styles.avatarPreview}
                />
              </View>

              <View style={styles.avatarOptionsContainer}>
                {AVATAR_OPTIONS.map((avatar, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.avatarOption,
                      selectedAvatar === index && styles.selectedAvatar
                    ]}
                    onPress={() => setSelectedAvatar(index)}
                  >
                    <Image
                      source={avatar}
                      style={styles.avatarOptionImage}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor="#717171"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditProfile(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#f8f8f8',
  },
  avatar: {
    width: '100%',
    height: '100%',
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
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  avatarPreviewContainer: {
    marginBottom: 24,
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  avatarOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f8f8f8',
  },
  selectedAvatar: {
    borderColor: '#4A90E2',
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  input: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
  },
  cancelButtonText: {
    color: '#222222',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },
  modalDescription: {
    fontSize: 16,
    color: '#717171',
    lineHeight: 22,
    padding: 20,
    paddingTop: 0,
  },
  closeButton: {
    padding: 4,
  },
}); 
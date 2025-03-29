import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';

const dummyUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 123-4567",
  profileImage: "https://picsum.photos/200",
  memberSince: "January 2024",
  preferences: {
    notificationsEnabled: true,
    darkMode: false,
    language: "English"
  },
  upcomingAppointments: [
    {
      id: '1',
      businessName: "Classic Cuts Barbershop",
      service: "Haircut",
      date: "2024-04-01",
      time: "14:00"
    }
  ]
};

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: dummyUser.profileImage }} style={styles.profileImage} />
        <Text style={styles.name}>{dummyUser.name}</Text>
        <Text style={styles.email}>{dummyUser.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{dummyUser.phone}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>{dummyUser.memberSince}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        {dummyUser.upcomingAppointments.map(appointment => (
          <View key={appointment.id} style={styles.appointmentItem}>
            <Text style={styles.businessName}>{appointment.businessName}</Text>
            <Text style={styles.appointmentDetails}>
              {appointment.service} - {appointment.date} at {appointment.time}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Notifications</Text>
          <Text style={styles.value}>
            {dummyUser.preferences.notificationsEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Theme</Text>
          <Text style={styles.value}>
            {dummyUser.preferences.darkMode ? 'Dark Mode' : 'Light Mode'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Language</Text>
          <Text style={styles.value}>{dummyUser.preferences.language}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 15,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  appointmentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  appointmentDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
}); 
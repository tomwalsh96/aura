import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase-config';
import { Business } from '../../types/business';
import DateTimePicker from '@react-native-community/datetimepicker';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  bio: string;
  workingDays: string[];
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  staffIds: string[];
}

interface TimeSlot {
  staffId: string;
  startTime: string;
  endTime: string;
}

const BookingScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [business, setBusiness] = useState<Business | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Set up real-time listener for business document
    const unsubscribeBusiness = onSnapshot(
      doc(db, 'businesses', id as string),
      (doc) => {
        if (doc.exists()) {
          setBusiness({ id: doc.id, ...doc.data() } as Business);
        } else {
          setError('Business not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to business:', err);
        setError('Failed to load business details');
        setLoading(false);
      }
    );

    // Set up real-time listener for staff subcollection
    const unsubscribeStaff = onSnapshot(
      collection(db, 'businesses', id as string, 'staff'),
      (snapshot) => {
        const staffData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StaffMember[];
        setStaff(staffData);
      },
      (err) => {
        console.error('Error listening to staff:', err);
      }
    );

    // Set up real-time listener for services subcollection
    const unsubscribeServices = onSnapshot(
      collection(db, 'businesses', id as string, 'services'),
      (snapshot) => {
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[];
        setServices(servicesData);
      },
      (err) => {
        console.error('Error listening to services:', err);
      }
    );

    return () => {
      unsubscribeBusiness();
      unsubscribeStaff();
      unsubscribeServices();
    };
  }, [id]);

  useEffect(() => {
    if (selectedService && selectedStaff && selectedDate) {
      // Here you would typically fetch available time slots from your backend
      // For now, we'll generate some dummy slots
      const slots = generateTimeSlots(selectedStaff, selectedService);
      setAvailableTimeSlots(slots);
    }
  }, [selectedService, selectedStaff, selectedDate]);

  const generateTimeSlots = (staff: StaffMember, service: Service): TimeSlot[] => {
    // This is a simplified version. In a real app, you'd fetch this from your backend
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        staffId: staff.id,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`
      });
    }
    
    return slots;
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    // Reset staff selection when service changes
    setSelectedStaff(null);
    setSelectedTimeSlot(null);
  };

  const handleStaffSelect = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setSelectedTimeSlot(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedTimeSlot) {
      Alert.alert('Error', 'Please select a service, staff member, and time slot');
      return;
    }

    try {
      // Create booking in Firestore
      const bookingRef = collection(db, 'businesses', id as string, 'bookings');
      const bookingData = {
        staffId: selectedStaff.id,
        serviceId: selectedService.id,
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedTimeSlot.startTime,
        duration: selectedService.duration,
        createdAt: new Date().toISOString(),
        status: 'confirmed'
      };

      await addDoc(bookingRef, bookingData);

      Alert.alert(
        'Success',
        `Booking confirmed for ${selectedService.name} with ${selectedStaff.name} on ${selectedDate.toLocaleDateString()} at ${selectedTimeSlot.startTime}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (error || !business) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error || 'Business not found'}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: business ? `Book at ${business.name}` : 'Book Appointment',
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
          headerTintColor: '#333',
          headerBackTitle: 'Back',
        }} 
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>{business?.name}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Service</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesContainer}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    selectedService?.id === service.id && styles.selectedCard
                  ]}
                  onPress={() => handleServiceSelect(service)}
                >
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>€{service.price}</Text>
                  <Text style={styles.serviceDuration}>{service.duration} minutes</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedService && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Staff Member</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffContainer}>
                {staff
                  .filter(member => selectedService.staffIds.includes(member.id))
                  .map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.staffCard,
                        selectedStaff?.id === member.id && styles.selectedCard
                      ]}
                      onPress={() => handleStaffSelect(member)}
                    >
                      <Text style={styles.staffName}>{member.name}</Text>
                      <Text style={styles.staffRole}>{member.role}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}

          {selectedStaff && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Date</Text>
              {Platform.OS === 'ios' ? (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {selectedDate.toLocaleDateString('en-IE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </>
              )}
            </View>
          )}

          {selectedDate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Time</Text>
              <View style={styles.timeSlotsContainer}>
                {availableTimeSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      selectedTimeSlot?.startTime === slot.startTime && styles.selectedTimeSlot
                    ]}
                    onPress={() => handleTimeSlotSelect(slot)}
                  >
                    <Text style={styles.timeSlotText}>{slot.startTime}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.bookButton,
              (!selectedService || !selectedStaff || !selectedTimeSlot) && styles.bookButtonDisabled
            ]}
            onPress={handleBooking}
            disabled={!selectedService || !selectedStaff || !selectedTimeSlot}
          >
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  servicesContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  serviceCard: {
    width: 160,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#4A90E2',
    borderWidth: 2,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
  },
  staffContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  staffCard: {
    width: 120,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  dateButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedTimeSlot: {
    backgroundColor: '#4A90E2',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default BookingScreen; 
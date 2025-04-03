import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, collection, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../firebase-config';
import { Business } from '../../types/business';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

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

interface BookingData {
  id: string;
  businessId: string;
  businessName: string;
  businessAddress: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  userId: string;
  userEmail?: string;
  date: string;
  startTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

const useBusinessData = (businessId: string) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Set up real-time listener for business document
    const unsubscribeBusiness = onSnapshot(
      doc(db, 'businesses', businessId),
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

    // Set up real-time listener for bookings subcollection
    const unsubscribeBookings = onSnapshot(
      collection(db, 'businesses', businessId, 'bookings'),
      (snapshot) => {
        const bookingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBookings(bookingsData);
      },
      (err) => {
        console.error('Error listening to bookings:', err);
      }
    );

    // Set up real-time listener for staff subcollection
    const unsubscribeStaff = onSnapshot(
      collection(db, 'businesses', businessId, 'staff'),
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
      collection(db, 'businesses', businessId, 'services'),
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
      unsubscribeBookings();
    };
  }, [businessId]);

  return { business, staff, services, bookings, loading, error };
};

const useTimeSlots = (selectedStaff: StaffMember | null, selectedService: Service | null, selectedDate: Date, bookings: any[]) => {
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);

  const isTimeSlotAvailable = (slot: TimeSlot, date: string): boolean => {
    // Check if there are any existing bookings that overlap with this slot
    return !bookings.some(booking => {
      // Only check bookings for the same date and staff member that are not cancelled
      if (booking.date !== date || 
          booking.staffId !== slot.staffId || 
          booking.status === 'cancelled') {
        return false;
      }

      // Convert times to minutes for easier comparison
      const slotStart = slot.startTime.split(':').map(Number);
      const slotEnd = slot.endTime.split(':').map(Number);
      const bookingStart = booking.startTime.split(':').map(Number);
      const bookingEnd = booking.startTime.split(':').map(Number);
      
      const slotStartMinutes = slotStart[0] * 60 + slotStart[1];
      const slotEndMinutes = slotEnd[0] * 60 + slotEnd[1];
      const bookingStartMinutes = bookingStart[0] * 60 + bookingStart[1];
      const bookingEndMinutes = bookingStartMinutes + booking.duration;

      // Check for overlap
      return (
        (slotStartMinutes >= bookingStartMinutes && slotStartMinutes < bookingEndMinutes) ||
        (slotEndMinutes > bookingStartMinutes && slotEndMinutes <= bookingEndMinutes) ||
        (slotStartMinutes <= bookingStartMinutes && slotEndMinutes >= bookingEndMinutes)
      );
    });
  };

  const generateTimeSlots = (staff: StaffMember, service: Service): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Add slots for both :00 and :30
      const slot00 = {
        staffId: staff.id,
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${hour.toString().padStart(2, '0')}:${service.duration}`
      };
      
      const slot30 = {
        staffId: staff.id,
        startTime: `${hour.toString().padStart(2, '0')}:30`,
        endTime: `${hour.toString().padStart(2, '0')}:${30 + service.duration}`
      };

      // Only add slots that are available
      if (isTimeSlotAvailable(slot00, selectedDateStr)) {
        slots.push(slot00);
      }
      if (isTimeSlotAvailable(slot30, selectedDateStr)) {
        slots.push(slot30);
      }
    }
    
    return slots;
  };

  useEffect(() => {
    if (selectedService && selectedStaff && selectedDate) {
      // Generate time slots whenever bookings change
      const slots = generateTimeSlots(selectedStaff, selectedService);
      setAvailableTimeSlots(slots);
    }
  }, [selectedService, selectedStaff, selectedDate, bookings]);

  return { availableTimeSlots, isTimeSlotAvailable };
};

const usePayment = (
  selectedService: Service | null, 
  selectedStaff: StaffMember | null, 
  selectedTimeSlot: TimeSlot | null, 
  selectedDate: Date,
  businessId: string,
  business: Business | null,
  isTimeSlotAvailable: (slot: TimeSlot, date: string) => boolean
) => {
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processingBooking, setProcessingBooking] = useState(false);

  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedStaff || !selectedTimeSlot || !auth.currentUser) {
      Alert.alert('Error', 'Please fill in all booking details');
      return;
    }

    try {
      setProcessingBooking(true);

      // Check if the selected time slot is still available
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      if (!isTimeSlotAvailable(selectedTimeSlot, selectedDateStr)) {
        Alert.alert('Error', 'This time slot is no longer available. Please select another time.');
        return;
      }

      // Create a new booking ID that will be used in both locations
      const bookingId = doc(collection(db, 'bookings')).id;

      // Create the booking data object
      const bookingData: BookingData = {
        id: bookingId,
        businessId: businessId,
        businessName: business?.name || '',
        businessAddress: business?.address || '',
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || undefined,
        date: selectedDateStr,
        startTime: selectedTimeSlot.startTime,
        duration: selectedService.duration,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Use a batch write to ensure both writes succeed or both fail
      const batch = writeBatch(db);

      // Add to business's bookings collection
      const businessBookingRef = doc(db, 'businesses', businessId, 'bookings', bookingId);
      batch.set(businessBookingRef, bookingData);

      // Add to user's bookings collection
      const userBookingRef = doc(db, 'users', auth.currentUser.uid, 'bookings', bookingId);
      batch.set(userBookingRef, bookingData);

      // Commit the batch
      await batch.commit();

      setShowConfirmationModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setProcessingBooking(false);
    }
  };

  return {
    showConfirmationModal,
    setShowConfirmationModal,
    showSuccessModal,
    setShowSuccessModal,
    processingBooking,
    handleBookingSubmit
  };
};

const LoadingView = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#4A90E2" />
    <Text style={styles.loadingText}>Loading booking details...</Text>
  </View>
);

const ErrorView = ({ error }: { error: string }) => (
  <View style={styles.errorContainer}>
    <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
    <Text style={styles.errorText}>{error || 'Business not found'}</Text>
  </View>
);

const ServiceSelection = ({ 
  services, 
  selectedService, 
  onServiceSelect 
}: { 
  services: Service[], 
  selectedService: Service | null, 
  onServiceSelect: (service: Service) => void 
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>1</Text>
      </View>
      <Text style={styles.sectionTitle}>Select Service</Text>
    </View>
    <View style={styles.scrollContainer}>
      <LinearGradient
        colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeRight}
      />
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.servicesContainer}
        contentContainerStyle={styles.servicesContentContainer}
      >
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              selectedService?.id === service.id && styles.selectedCard
            ]}
            onPress={() => onServiceSelect(service)}
          >
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.servicePrice}>€{service.price}</Text>
            <Text style={styles.serviceDuration}>{service.duration} minutes</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeLeft}
      />
    </View>
  </View>
);

const StaffSelection = ({ 
  staff, 
  selectedService, 
  selectedStaff, 
  onStaffSelect 
}: { 
  staff: StaffMember[], 
  selectedService: Service | null, 
  selectedStaff: StaffMember | null, 
  onStaffSelect: (staff: StaffMember) => void 
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>2</Text>
      </View>
      <Text style={styles.sectionTitle}>Select Staff Member</Text>
    </View>
    <View style={styles.scrollContainer}>
      <LinearGradient
        colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeRight}
      />
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.staffContainer}
        contentContainerStyle={styles.staffContentContainer}
      >
        {staff
          .filter(member => selectedService?.staffIds.includes(member.id))
          .map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.staffCard,
                selectedStaff?.id === member.id && styles.selectedCard
              ]}
              onPress={() => onStaffSelect(member)}
            >
              <Text style={styles.staffName}>{member.name}</Text>
              <Text style={styles.staffRole}>{member.role}</Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fadeLeft}
      />
    </View>
  </View>
);

const DateTimeSelection = ({ 
  selectedDate, 
  onDateChange, 
  showDatePicker, 
  setShowDatePicker, 
  availableTimeSlots, 
  selectedTimeSlot, 
  onTimeSlotSelect 
}: { 
  selectedDate: Date, 
  onDateChange: (event: any, date?: Date) => void, 
  showDatePicker: boolean, 
  setShowDatePicker: (show: boolean) => void, 
  availableTimeSlots: TimeSlot[], 
  selectedTimeSlot: TimeSlot | null, 
  onTimeSlotSelect: (slot: TimeSlot) => void 
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>3</Text>
      </View>
      <Text style={styles.sectionTitle}>Select Date & Time</Text>
    </View>
    <View style={styles.dateTimeContainer}>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
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
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </>
      )}
      {selectedDate && (
        <View style={styles.timeSlotsGrid}>
          {availableTimeSlots.map((slot, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.timeSlot,
                selectedTimeSlot?.startTime === slot.startTime && styles.selectedTimeSlot
              ]}
              onPress={() => onTimeSlotSelect(slot)}
            >
              <Text style={[
                styles.timeSlotText,
                selectedTimeSlot?.startTime === slot.startTime && styles.selectedTimeSlotText
              ]}>
                {slot.startTime}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  </View>
);

const ConfirmationModal = ({
  visible,
  onClose,
  selectedService,
  selectedStaff,
  selectedDate,
  selectedTimeSlot,
  processingBooking,
  onSubmit
}: {
  visible: boolean,
  onClose: () => void,
  selectedService: Service | null,
  selectedStaff: StaffMember | null,
  selectedDate: Date,
  selectedTimeSlot: TimeSlot | null,
  processingBooking: boolean,
  onSubmit: () => void
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalContainer}
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Confirm Booking</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody}>
          <View style={styles.paymentSummary}>
            <Text style={styles.paymentSummaryTitle}>Booking Summary</Text>
            <Text style={styles.paymentSummaryText}>
              {selectedService?.name} - €{selectedService?.price}
            </Text>
            <Text style={styles.paymentSummaryText}>
              {selectedDate.toLocaleDateString('en-IE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.paymentSummaryText}>{selectedTimeSlot?.startTime}</Text>
            <Text style={styles.paymentSummaryText}>{selectedStaff?.name}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={24} color="#4A90E2" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Your booking will be confirmed immediately. You can complete the payment in the My Bookings tab.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.confirmButton, processingBooking && styles.confirmButtonDisabled]}
            onPress={onSubmit}
            disabled={processingBooking}
          >
            {processingBooking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>
                  Confirm Booking
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const SuccessModal = ({
  visible,
  onClose,
  selectedService,
  selectedStaff,
  selectedDate,
  selectedTimeSlot
}: {
  visible: boolean,
  onClose: () => void,
  selectedService: Service | null,
  selectedStaff: StaffMember | null,
  selectedDate: Date,
  selectedTimeSlot: TimeSlot | null
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.successModal}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#4A90E2" />
        </View>
        <Text style={styles.successTitle}>Booking Confirmed!</Text>
        <View style={styles.successDetails}>
          <Text style={styles.successDetailText}>
            <Text style={styles.successDetailLabel}>Service:</Text> {selectedService?.name}
          </Text>
          <Text style={styles.successDetailText}>
            <Text style={styles.successDetailLabel}>Staff:</Text> {selectedStaff?.name}
          </Text>
          <Text style={styles.successDetailText}>
            <Text style={styles.successDetailLabel}>Date:</Text> {selectedDate.toLocaleDateString('en-IE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.successDetailText}>
            <Text style={styles.successDetailLabel}>Time:</Text> {selectedTimeSlot?.startTime}
          </Text>
        </View>
        <View style={styles.paymentInfoContainer}>
          <Ionicons name="card-outline" size={24} color="#4A90E2" style={styles.paymentInfoIcon} />
          <Text style={styles.paymentInfoText}>
            Your booking is confirmed but not yet paid. You can complete the payment in the My Bookings tab.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.successButton}
          onPress={onClose}
        >
          <Text style={styles.successButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const BookingScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  
  // Booking state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Custom hooks
  const { business, staff, services, bookings, loading, error } = useBusinessData(id as string);
  const { availableTimeSlots, isTimeSlotAvailable } = useTimeSlots(selectedStaff, selectedService, selectedDate, bookings);
  const {
    showConfirmationModal,
    setShowConfirmationModal,
    showSuccessModal,
    setShowSuccessModal,
    processingBooking,
    handleBookingSubmit
  } = usePayment(
    selectedService,
    selectedStaff,
    selectedTimeSlot,
    selectedDate,
    id as string,
    business,
    isTimeSlotAvailable
  );

  // Event handlers
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

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  if (loading) {
    return <LoadingView />;
  }

  if (error || !business) {
    return <ErrorView error={error || 'Business not found'} />;
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
          <View style={styles.header}>
            <Text style={styles.businessName}>{business?.name}</Text>
            <Text style={styles.businessAddress}>{business?.address}</Text>
          </View>

          <ServiceSelection 
            services={services} 
            selectedService={selectedService} 
            onServiceSelect={handleServiceSelect} 
          />

          {selectedService && (
            <StaffSelection 
              staff={staff} 
              selectedService={selectedService} 
              selectedStaff={selectedStaff} 
              onStaffSelect={handleStaffSelect} 
            />
          )}

          {selectedStaff && (
            <DateTimeSelection 
              selectedDate={selectedDate} 
              onDateChange={handleDateChange} 
              showDatePicker={showDatePicker} 
              setShowDatePicker={setShowDatePicker} 
              availableTimeSlots={availableTimeSlots} 
              selectedTimeSlot={selectedTimeSlot} 
              onTimeSlotSelect={handleTimeSlotSelect} 
            />
          )}

          <TouchableOpacity
            style={[
              styles.bookButton,
              (!selectedService || !selectedStaff || !selectedTimeSlot) && styles.bookButtonDisabled
            ]}
            onPress={() => setShowConfirmationModal(true)}
            disabled={!selectedService || !selectedStaff || !selectedTimeSlot}
          >
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        selectedService={selectedService}
        selectedStaff={selectedStaff}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        processingBooking={processingBooking}
        onSubmit={handleBookingSubmit}
      />

      <SuccessModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        selectedService={selectedService}
        selectedStaff={selectedStaff}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
      />
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
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContainer: {
    position: 'relative',
    marginHorizontal: -16,
  },
  servicesContainer: {
    flexGrow: 1,
  },
  servicesContentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  serviceCard: {
    width: 200,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 16,
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
    color: '#333',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  staffContainer: {
    flexGrow: 1,
  },
  staffContentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  staffCard: {
    width: 140,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    color: '#333',
  },
  staffRole: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  dateTimeContainer: {
    gap: 16,
  },
  dateButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
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
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  timeSlot: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    width: '31%',
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
    textAlign: 'center',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  bookButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  fadeRight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 1,
  },
  fadeLeft: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
    zIndex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  successDetails: {
    width: '100%',
    marginBottom: 24,
  },
  successDetailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  successDetailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  successButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  paymentSummary: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  paymentSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  paymentSummaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  paymentInfoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});

export default BookingScreen; 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { doc, getDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase-config';
import { Ionicons } from '@expo/vector-icons';

interface BookingDetails {
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
  date: string;
  startTime: string;
  status: string;
  createdAt: string;
  isPaid: boolean;
  paymentDate?: string;
  updatedAt?: string;
}

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      router.replace('/login');
      return;
    }

    // Set up real-time listener for the booking
    const unsubscribe = onSnapshot(
      doc(db, 'users', auth.currentUser.uid, 'bookings', id as string),
      (doc) => {
        if (doc.exists()) {
          setBooking({ id: doc.id, ...doc.data() } as BookingDetails);
        } else {
          // Booking no longer exists
          Alert.alert('Error', 'Booking not found');
          router.back();
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching booking:', error);
        Alert.alert('Error', 'Failed to load booking details');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (showSuccessModal) {
      console.log('Success modal displayed for booking:', booking?.id);
    }
  }, [showSuccessModal, booking]);

  const handleCancelBooking = async () => {
    if (!booking || !auth.currentUser) return;

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const batch = writeBatch(db);

              // Update status to cancelled in both locations
              const userBookingRef = doc(db, 'users', auth.currentUser!.uid, 'bookings', booking.id);
              const businessBookingRef = doc(db, 'businesses', booking.businessId, 'bookings', booking.id);

              const bookingUpdate = {
                status: 'cancelled',
                updatedAt: new Date().toISOString(),
              };

              batch.update(userBookingRef, bookingUpdate);
              batch.update(businessBookingRef, bookingUpdate);

              await batch.commit();

              Alert.alert(
                'Booking Cancelled',
                'Your booking has been successfully cancelled.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const isPastBooking = () => {
    if (!booking) return false;
    const bookingDate = new Date(booking.date + 'T' + booking.startTime);
    return bookingDate < new Date();
  };

  const handlePaymentSubmit = async () => {
    if (!booking || !auth.currentUser) return;

    // Validate payment details
    if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.cardholderName) {
      Alert.alert('Error', 'Please fill in all payment details');
      return;
    }

    // Basic card number validation (16 digits)
    if (!/^\d{16}$/.test(paymentDetails.cardNumber.replace(/\s/g, ''))) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }

    // Basic expiry date validation (MM/YY format)
    if (!/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(paymentDetails.expiryDate)) {
      Alert.alert('Error', 'Please enter a valid expiry date (MM/YY)');
      return;
    }

    // Basic CVV validation (3 or 4 digits)
    if (!/^\d{3,4}$/.test(paymentDetails.cvv)) {
      Alert.alert('Error', 'Please enter a valid CVV');
      return;
    }

    try {
      setProcessingPayment(true);
      console.log('Processing payment for booking:', booking.id);

      // Here you would typically integrate with a payment processor
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Payment processed successfully');

      const batch = writeBatch(db);

      // Update booking status to confirmed and mark as paid
      const userBookingRef = doc(db, 'users', auth.currentUser.uid, 'bookings', booking.id);
      const businessBookingRef = doc(db, 'businesses', booking.businessId, 'bookings', booking.id);

      const bookingUpdate = {
        status: 'confirmed',
        isPaid: true,
        paymentDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Updating booking with:', bookingUpdate);
      
      batch.update(userBookingRef, bookingUpdate);
      batch.update(businessBookingRef, bookingUpdate);

      await batch.commit();
      console.log('Booking updated successfully');

      // Close payment modal and show success modal
      setShowPaymentModal(false);
      setShowSuccessModal(true);
      
      // Update local booking state to reflect payment
      setBooking({
        ...booking,
        status: 'confirmed',
        isPaid: true,
        paymentDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log('Local booking state updated');
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <Text>Booking not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Booking Details',
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
          headerTintColor: '#333',
        }}
      />
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
              <Text style={styles.statusText}>{booking.status}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: booking.isPaid ? '#E8F5E9' : '#FFEBEE', marginLeft: 8 }]}>
              <Text style={styles.statusText}>{booking.isPaid ? 'Paid' : 'Not Paid'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business</Text>
            <Text style={styles.businessName}>{booking.businessName}</Text>
            <Text style={styles.businessAddress}>{booking.businessAddress}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service</Text>
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
            <Text style={styles.serviceDetails}>
              €{booking.servicePrice} • {booking.serviceDuration} minutes
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Staff</Text>
            <Text style={styles.staffName}>{booking.staffName}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date & Time</Text>
            <Text style={styles.dateTime}>
              {new Date(booking.date).toLocaleDateString('en-IE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.dateTime}>{booking.startTime}</Text>
          </View>

          {!booking.isPaid && !isPastBooking() && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => setShowPaymentModal(true)}
            >
              <Text style={styles.payButtonText}>Pay Now</Text>
            </TouchableOpacity>
          )}

          {booking.status === 'confirmed' && !isPastBooking() && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelBooking}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color="#fff" />
                  <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Details</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.paymentSummary}>
                <Text style={styles.paymentSummaryTitle}>Booking Summary</Text>
                <Text style={styles.paymentSummaryText}>
                  {booking?.serviceName} - €{booking?.servicePrice}
                </Text>
                <Text style={styles.paymentSummaryText}>
                  {new Date(booking?.date || '').toLocaleDateString('en-IE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.paymentSummaryText}>{booking?.startTime}</Text>
                <View style={styles.paymentNote}>
                  <Ionicons name="information-circle-outline" size={16} color="#4A90E2" />
                  <Text style={styles.paymentNoteText}>
                    Upon successful payment, your booking will be marked as paid and confirmed.
                  </Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  value={paymentDetails.cardNumber}
                  onChangeText={(text) => {
                    // Remove any non-digit characters
                    const cleanedText = text.replace(/\D/g, '');
                    // Limit to 16 digits
                    const limitedText = cleanedText.slice(0, 16);
                    setPaymentDetails({ ...paymentDetails, cardNumber: limitedText });
                  }}
                  keyboardType="numeric"
                  maxLength={16}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    value={paymentDetails.expiryDate}
                    onChangeText={(text) => setPaymentDetails({ ...paymentDetails, expiryDate: text })}
                    maxLength={5}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    value={paymentDetails.cvv}
                    onChangeText={(text) => setPaymentDetails({ ...paymentDetails, cvv: text })}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cardholder Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={paymentDetails.cardholderName}
                  onChangeText={(text) => setPaymentDetails({ ...paymentDetails, cardholderName: text })}
                  autoCapitalize="words"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.payButton, processingPayment && styles.payButtonDisabled]}
                onPress={handlePaymentSubmit}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="card-outline" size={20} color="#fff" />
                    <Text style={styles.payButtonText}>
                      Pay €{booking?.servicePrice}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4A90E2" />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <View style={styles.successDetails}>
              <Text style={styles.successDetailText}>
                <Text style={styles.successDetailLabel}>Service:</Text> {booking?.serviceName}
              </Text>
              <Text style={styles.successDetailText}>
                <Text style={styles.successDetailLabel}>Date:</Text> {new Date(booking?.date || '').toLocaleDateString('en-IE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.successDetailText}>
                <Text style={styles.successDetailLabel}>Time:</Text> {booking?.startTime}
              </Text>
              <Text style={styles.successDetailText}>
                <Text style={styles.successDetailLabel}>Amount Paid:</Text> €{booking?.servicePrice}
              </Text>
            </View>
            <Text style={styles.successMessage}>
              Your booking has been confirmed and marked as paid.
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => {
                console.log('Success modal closed, returning to previous screen');
                setShowSuccessModal(false);
                router.back();
              }}
            >
              <Text style={styles.successButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return '#E3F2FD';
    case 'completed':
      return '#E8F5E9';
    case 'cancelled':
      return '#FFEBEE';
    default:
      return '#F5F5F5';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 14,
    color: '#666',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 14,
    color: '#666',
  },
  staffName: {
    fontSize: 16,
    color: '#333',
  },
  dateTime: {
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
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
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  paymentNoteText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 16,
    textAlign: 'center',
  },
  successDetails: {
    width: '100%',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  successDetailText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  successDetailLabel: {
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  successMessage: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 24,
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
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
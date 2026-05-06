import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/layout/Header';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  ZoomIn, 
  ZoomOut 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const MOCK_WFH: any[] = [];  // Empty initial data - will be fetched from API

const WFHCard = ({ item, index }: { item: any, index: number }) => {
  const status = item.status || 'Pending';
  const isApproved = status.toLowerCase() === 'approved';

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify()}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.dayText}>{item.day}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: isApproved ? '#ecfdf5' : '#fff7ed' }
        ]}>
          <Text style={[
            styles.statusText, 
            { color: isApproved ? '#059669' : '#d97706' }
          ]}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text style={styles.footerText}>{item.duration}</Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="location-outline" size={16} color="#64748b" />
          <Text style={styles.footerText}>Remote</Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default function UpcomingWFH() {
  const [wfhList, setWfhList] = useState(MOCK_WFH);
  const [modalVisible, setModalVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  
  // Form State
  const [selectedDate, setSelectedDate] = useState('');
  const [duration, setDuration] = useState('Full Day');
  const [reason, setReason] = useState('');

  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthName = useMemo(() => 
    now.toLocaleString('en-US', { month: 'long' }).toUpperCase(), 
    [now]
  );
  
  const shortMonthName = useMemo(() => 
    now.toLocaleString('en-US', { month: 'short' }), 
    [now]
  );

  // Simple Month Days Generator
  const monthDays = useMemo(() => {
    const days = [];
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(i);
    return days;
  }, [currentYear, currentMonth]);

  const resetForm = () => {
    setSelectedDate('');
    setDuration('Full Day');
    setReason('');
  };

  const getDayOfWeek = (dateString: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Workday' : days[d.getDay()];
  };

  const handleSubmit = () => {
    if (!selectedDate) return;
    const body = { date: selectedDate, duration, reason };

    // optimistic UI update
    const newRequest = {
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDate,
      day: getDayOfWeek(selectedDate),
      duration: duration,
      status: 'Pending',
    };
    setWfhList([newRequest, ...wfhList]);
    setModalVisible(false);
    resetForm();

    fetch(`${require('../../constants/api').ADMIN_API_URL}/wfh/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(() => {
      setSuccessVisible(true);
      setTimeout(() => setSuccessVisible(false), 2000);
    }).catch(() => {
      // on error, keep optimistic entry but you may want to refresh from server
    });
  };

  useEffect(() => {
    // Load WFH data from backend
    const loadWfhData = async () => {
      try {
        const api = require('../../constants/api').API_BASE_URL;
        const response = await fetch(`${api}/getemployeewfh`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const json = await response.json();
          if (json && json.data && Array.isArray(json.data)) {
            const mapped = json.data.map((d: any) => ({
              id: d.id || Math.random().toString(36).substr(2, 9),
              date: new Date(d.date || d.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              day: getDayOfWeek(d.date || d.Date),
              duration: d.duration || d.Duration || 'Full Day',
              status: d.status || d.Status || 'Pending'
            }));
            setWfhList(mapped);
          }
        }
      } catch (error) {
        console.log('Error fetching WFH data:', error);
        // Keep empty list if API fails
      }
    };
    
    loadWfhData();
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Upcoming WFH" showBack={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {wfhList.length > 0 ? (
          wfhList.map((item, index) => (
            <WFHCard key={item.id} item={item} index={index} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="home-outline" size={60} color="#e2e8f0" />
            </View>
            <Text style={styles.emptyTitle}>No upcoming WFH scheduled</Text>
            <Text style={styles.emptySub}>When you have approved WFH dates, they will appear here.</Text>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Button */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Request Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContentWrapper}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New WFH Request</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity 
                  style={styles.datePickerInput}
                  activeOpacity={0.7}
                  onPress={() => setIsCalendarVisible(true)}
                >
                  <Text style={selectedDate ? styles.inputText : styles.placeholderText}>
                    {selectedDate || 'Select Date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Duration</Text>
                <View style={styles.durationRow}>
                  {['Full Day', 'Half Day'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.durationOption,
                        duration === d && styles.durationSelected
                      ]}
                      onPress={() => setDuration(d)}
                    >
                      <Text style={[
                        styles.durationText,
                        duration === d && styles.durationTextSelected
                      ]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Reason (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us why..."
                  multiline
                  numberOfLines={3}
                  value={reason}
                  onChangeText={setReason}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, !selectedDate && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!selectedDate}
              >
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* Success Popup */}
      {successVisible && (
        <View style={styles.successOverlay} pointerEvents="none">
          <Animated.View 
            entering={ZoomIn.springify()}
            exiting={ZoomOut}
            style={styles.successBox}
          >
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.successText}>WFH Request Added Successfully ✅</Text>
          </Animated.View>
        </View>
      )}

      {/* Custom Calendar Modal */}
      <Modal
        visible={isCalendarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsCalendarVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { minHeight: 450 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select WFH Date</Text>
              <TouchableOpacity onPress={() => setIsCalendarVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#e2e8f0" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarContainer}>
              <View style={styles.calendarMonthHeader}>
                 <Text style={styles.calendarMonthText}>{monthName} {currentYear}</Text>
              </View>
              <View style={styles.calendarWeekRow}>
                 {['S','M','T','W','T_2','F','S_2'].map((d, i) => (
                   <Text key={d} style={styles.weekDayText}>
                     {['S','M','T','W','T','F','S'][i]}
                   </Text>
                 ))}
              </View>
              <View style={styles.calendarGrid}>
                {monthDays.map((day, idx) => {
                  const dayString = day ? `${shortMonthName} ${day.toString().padStart(2, '0')}, ${currentYear}` : '';
                  const isActive = day && selectedDate === dayString;
                  
                  return (
                    <TouchableOpacity 
                      key={idx} 
                      style={[
                        styles.calendarDay,
                        isActive ? styles.calendarDayActive : undefined
                      ]}
                      disabled={!day}
                      onPress={() => {
                        if (day) {
                          setSelectedDate(dayString);
                          setIsCalendarVisible(false);
                        }
                      }}
                    >
                      <Text style={[
                         styles.calendarDayText,
                         !day ? styles.calendarDayDisabled : undefined,
                         isActive ? styles.calendarDayActiveText : undefined
                      ]}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  dateInfo: {
    gap: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  dayText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContentWrapper: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  durationSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  durationTextSelected: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  successBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    width: Dimensions.get('window').width * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  successText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
  },
  datePickerInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    height: 54,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 12,
    alignSelf: 'center',
  },
  calendarContainer: {
    padding: 10,
  },
  calendarMonthHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 1,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    width: width / 9,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: width / 9,
    height: width / 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: width / 18,
  },
  calendarDayActive: {
    backgroundColor: '#4f46e5',
  },
  calendarDayText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  calendarDayActiveText: {
    color: '#fff',
  },
  calendarDayDisabled: {
    color: '#e2e8f0',
  },
});

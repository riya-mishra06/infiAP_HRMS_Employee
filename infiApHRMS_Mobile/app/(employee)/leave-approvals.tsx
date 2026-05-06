import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  FadeInDown,
  LinearTransition
} from 'react-native-reanimated';
import { useLeave, LeaveRequest } from '../../context/LeaveContext';
import { BottomNav } from '../../components/BottomNav';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/layout/Header';

const { width } = Dimensions.get('window');

const TABS = ['All', 'Approved', 'Rejected'];
const TAB_WIDTH = width / 3;

export default function LeaveApprovals() {
  const { leaves } = useLeave();
  const [activeTab, setActiveTab] = useState('All');
  const indicatorPosition = useSharedValue(0);

  // Animate tab indicator
  useEffect(() => {
    const tabIndex = TABS.indexOf(activeTab);
    indicatorPosition.value = withSpring(tabIndex * TAB_WIDTH, {
      damping: 20,
      stiffness: 150,
    });
  }, [activeTab]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
    };
  });

  // Filter leaves: only show APPROVED or REJECTED
  const relevantLeaves = leaves.filter(l => l.status === 'APPROVED' || l.status === 'REJECTED');
  
  const filteredLeaves = relevantLeaves.filter((leave) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Approved') return leave.status === 'APPROVED';
    if (activeTab === 'Rejected') return leave.status === 'REJECTED';
    return true;
  });

  const formatDateRange = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const m1 = d1.toLocaleString('en-US', { month: 'short' });
    const m2 = d2.toLocaleString('en-US', { month: 'short' });
    const day1 = d1.getDate().toString().padStart(2, '0');
    const day2 = d2.getDate().toString().padStart(2, '0');
    const year = d1.getFullYear();

    if (start === end) {
      return `${m1} ${day1}, ${year}`;
    }
    return `${m1} ${day1} - ${m2} ${day2}, ${year}`;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return { text: '#22c55e', bg: '#dcfce7' };
      case 'REJECTED': return { text: '#ef4444', bg: '#fee2e2' };
      default: return { text: '#64748b', bg: '#f1f5f9' };
    }
  };

  const getIconForType = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('sick')) return 'medkit-outline';
    if (lowerType.includes('personal') || lowerType.includes('casual')) return 'briefcase-outline';
    if (lowerType.includes('wfh')) return 'home-outline';
    return 'calendar-outline';
  };

  return (
    <View style={styles.root}>
      <Header title="Approvals & Rejections" showBack={true} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={styles.tab}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
        {/* Animated Indicator line */}
        <Animated.View style={[styles.indicatorContainer, animatedIndicatorStyle]}>
           <View style={styles.indicator} />
        </Animated.View>
      </View>

      {/* List */}
      <Animated.FlatList
        data={filteredLeaves}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={LinearTransition.springify().damping(15)}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No records found in this category.</Text>
          </View>
        )}
        renderItem={({ item, index }) => {
          const statusColors = getStatusColor(item.status);
          const iconName = getIconForType(item.type);

          return (
            <Animated.View 
              entering={FadeInDown.delay(index * 100).springify().damping(15)}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.employeeInfo}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{item.employeeName?.charAt(0) || 'E'}</Text>
                  </View>
                  <Text style={styles.employeeName}>{item.employeeName || 'Unknown Employee'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
                  <Text style={[styles.badgeText, { color: statusColors.text }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBody}>
                <View style={styles.iconBox}>
                  <Ionicons name={iconName} size={28} color="#4f39f6" />
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.cardTitle}>{item.type}</Text>
                  <Text style={styles.cardDates}>{formatDateRange(item.startDate, item.endDate)} • {item.days} day{item.days > 1 ? 's' : ''}</Text>
                </View>
              </View>

              {item.status === 'REJECTED' && item.rejectionReason && (
                <View style={styles.reasonBox}>
                   <Ionicons name="information-circle-outline" size={16} color="#ef4444" />
                   <Text style={styles.reasonText}>{item.rejectionReason}</Text>
                </View>
              )}
            </Animated.View>
          );
        }}
      />
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    position: 'relative',
    height: 48,
  },
  tab: {
    width: TAB_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#4f39f6',
    fontWeight: '700',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: TAB_WIDTH,
    alignItems: 'center',
    height: 3,
  },
  indicator: {
    width: 24, // Narrow indicator
    height: 3,
    backgroundColor: '#4f39f6',
    borderRadius: 2,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#4f39f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: 14,
    marginBottom: 14,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eef2ff', 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  infoBox: {
    marginLeft: 14,
    justifyContent: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDates: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  reasonBox: {
    marginTop: 14,
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonText: {
    fontSize: 13,
    color: '#991b1b',
    marginLeft: 6,
    flex: 1,
  },
});

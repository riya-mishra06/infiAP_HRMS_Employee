import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, StatusBar, Modal, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BottomNav } from '../../components/BottomNav';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/layout/Header';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  FadeInDown,
  FadeInRight,
  ZoomIn,
  ZoomOut,
  SlideInUp,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Generate dynamic trend data based on current date
const generateTrendData = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const isActive = i === 0;
    data.push({
      month: months[monthIndex],
      value: Math.random() * 0.8 + 0.2,
      amount: '₹' + Math.floor(Math.random() * 2000 + 3000),
      active: isActive
    });
  }
  return data;
};

const getTrendData = () => generateTrendData();

// Generate dynamic history data
const generateHistoryData = () => {
  const now = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const history = [];
  
  for (let i = 0; i < 3; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    history.push({
      id: String(i),
      month: `${monthName} ${year}`,
      salary: '₹' + Math.floor(Math.random() * 1000 + 3000) + '.00',
      date: `${monthName.substring(0, 3)} ${lastDay}`,
      status: 'Paid'
    });
  }
  return history;
};

const SalaryBar = ({ item, index, showTooltip, setShowTooltip, activeTooltip }: any) => {
  const heightValue = useSharedValue(0);

  useEffect(() => {
    heightValue.value = withDelay(index * 100 + 400, withTiming(item.value * 120, { duration: 1000 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightValue.value,
  }));

  return (
    <View style={styles.barContainer}>
      <TouchableOpacity 
        activeOpacity={0.8}
        onPressIn={() => setShowTooltip(index)}
        onPressOut={() => setShowTooltip(null)}
        style={{ alignItems: 'center' }}
      >
        {activeTooltip === index && (
          <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.tooltip}>
            <Text style={styles.tooltipText}>{item.amount}</Text>
            <View style={styles.tooltipArrow} />
          </Animated.View>
        )}
        <Animated.View 
          style={[
            styles.bar, 
            item.active ? styles.activeBar : styles.inactiveBar,
            animatedStyle
          ]} 
        />
      </TouchableOpacity>
      <Text style={[styles.barLabel, item.active && styles.activeBarLabel]}>{item.month}</Text>
    </View>
  );
};

export default function PayrollDashboard() {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [trendData] = useState(() => getTrendData());
  const [historyData] = useState(() => generateHistoryData());
  
  // Get current date/month/year
  const now = new Date();
  const currentMonth = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const currentSalary = '₹' + Math.floor(Math.random() * 1000 + 3500);
  const payDate = `${now.toLocaleString('en-US', { month: 'long' })} ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}, ${now.getFullYear()}`;

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setSuccessVisible(true);
      setTimeout(() => setSuccessVisible(false), 2000);
    }, 1500);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'My Salary Slip for October 2023: $3,500.00. (Simulated Link: payslip.infiap.com/oct23)',
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <Header title="Payroll" showBack={true} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Salary Card */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.salaryCard}>
          <View style={styles.cardDecoration} />
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Current Month Salary ({currentMonth})</Text>
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>PAID</Text>
            </View>
          </View>
          <Text style={styles.salaryAmount}>{currentSalary}</Text>
          <View style={styles.payDateContainer}>
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={styles.payDateText}>Pay Date: {payDate}</Text>
          </View>
        </Animated.View>

        {/* Salary Trend */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Salary Trend</Text>
          <TouchableOpacity onPress={() => router.push('/(employee)/payroll-history')}>
            <Text style={styles.sectionLink}>Last 6 Months</Text>
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.trendCard}>
          <View style={styles.chartArea}>
            {trendData.map((item, index) => (
              <SalaryBar 
                key={item.month} 
                item={item} 
                index={index} 
                activeTooltip={activeTooltip}
                setShowTooltip={setActiveTooltip}
              />
            ))}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {[
            { id: 'view', icon: 'eye-outline', label: 'View', color: '#6366f1', action: () => setDetailsVisible(true) },
            { id: 'download', icon: 'download-outline', label: 'Download', color: '#4f46e5', action: handleDownload },
            { id: 'share', icon: 'share-social-outline', label: 'Share', color: '#818cf8', action: handleShare },
          ].map((action, index) => (
            <Animated.View 
              key={action.id}
              entering={FadeInDown.delay(300 + index * 100).springify()}
              style={styles.actionItem}
            >
              <TouchableOpacity style={styles.actionBtn} onPress={action.action}>
                <View style={[styles.actionIconCircle, { backgroundColor: `${action.color}15` }]}>
                  {action.id === 'download' && downloading ? (
                    <ActivityIndicator color={action.color} />
                  ) : (
                    <Ionicons name={action.icon as any} size={28} color={action.color} />
                  )}
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Salary History */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Salary History</Text>
          <TouchableOpacity onPress={() => router.push('/(employee)/payroll-history')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyList}>
          {historyData.map((item, index) => (
            <Animated.View 
              key={item.id}
              entering={FadeInRight.delay(500 + index * 100).springify()}
              style={styles.historyCard}
            >
              <TouchableOpacity style={styles.historyBtn} activeOpacity={0.7} onPress={() => setDetailsVisible(true)}>
                <View style={styles.historyLeading}>
                  <View style={styles.fileIconBox}>
                    <Ionicons name="document-text-outline" size={24} color="#64748b" />
                  </View>
                  <View>
                    <Text style={styles.historyMonth}>{item.month}</Text>
                    <Text style={styles.historySub}>NET SALARY: {item.salary}</Text>
                  </View>
                </View>
                <View style={styles.historyTrailing}>
                  <View style={styles.historyPaidBadge}>
                    <Text style={styles.historyPaidText}>{item.status}</Text>
                  </View>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Salary Details Modal */}
      <Modal
        visible={detailsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <TouchableOpacity 
           style={styles.modalOverlay} 
           activeOpacity={1} 
           onPress={() => setDetailsVisible(false)}
        >
          <Animated.View entering={SlideInUp} style={styles.modalContent}>
             <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Salary Breakdown</Text>
                <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                   <Ionicons name="close-circle" size={32} color="#64748b" />
                </TouchableOpacity>
             </View>
             
             <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Basic Salary</Text>
                <Text style={styles.breakdownValue}>₹2,500.00</Text>
             </View>
             <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>HRA (House Rent Allowance)</Text>
                <Text style={styles.breakdownValue}>₹500.00</Text>
             </View>
             <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Conv. Allowance</Text>
                <Text style={styles.breakdownValue}>₹300.00</Text>
             </View>
             <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Special Allowance</Text>
                <Text style={styles.breakdownValue}>₹200.00</Text>
             </View>
             <View style={[styles.breakdownRow, styles.deductionBorder]}>
                <Text style={styles.deductionLabel}>Professional Tax (PT)</Text>
                <Text style={styles.deductionValue}>-₹50.00</Text>
             </View>
             <View style={styles.breakdownRow}>
                <Text style={styles.deductionLabel}>Other Deductions</Text>
                <Text style={styles.deductionValue}>-₹0.00</Text>
             </View>
             
             <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Net Payable Salary</Text>
                <Text style={styles.totalValue}>₹3,450.00</Text>
             </View>
             
             <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailsVisible(false)}>
                <Text style={styles.closeBtnText}>Great, Close It!</Text>
             </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <BottomNav />

      {/* Success Animation */}
      {successVisible && (
        <View style={styles.successOverlay} pointerEvents="none">
          <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.successInfo}>
            <Ionicons name="checkmark-circle" size={60} color="#22c55e" />
            <Text style={styles.successText}>Salary Slip Downloaded ✅</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
  },
  salaryCard: {
    backgroundColor: '#4f46e5', // High-fidelity indigo
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 30,
  },
  cardDecoration: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  paidBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paidText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  salaryAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 16,
  },
  payDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payDateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  sectionLink: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '700',
  },
  trendCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  barContainer: {
    alignItems: 'center',
    gap: 12,
  },
  bar: {
    width: 32,
    borderRadius: 8,
  },
  inactiveBar: {
    backgroundColor: '#f1f5f9',
  },
  activeBar: {
    backgroundColor: '#4f46e5',
  },
  barLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '800',
  },
  activeBarLabel: {
    color: '#4f46e5',
  },
  tooltip: {
    position: 'absolute',
    top: -45,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    zIndex: 100,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: '#1e293b',
    transform: [{ rotate: '45deg' }],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  actionItem: {
    flex: 1,
  },
  actionBtn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  historyBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  historyLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyMonth: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  historySub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  historyTrailing: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyPaidBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyPaidText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  historyDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  breakdownLabel: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '800',
  },
  deductionBorder: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
    paddingTop: 15,
  },
  deductionLabel: {
    fontSize: 15,
    color: '#ef4444',
    fontWeight: '600',
  },
  deductionValue: {
    fontSize: 15,
    color: '#ef4444',
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    backgroundColor: '#f1f5f9',
    padding: 20,
    borderRadius: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4f46e5',
  },
  closeBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successInfo: {
    alignItems: 'center',
    gap: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
});

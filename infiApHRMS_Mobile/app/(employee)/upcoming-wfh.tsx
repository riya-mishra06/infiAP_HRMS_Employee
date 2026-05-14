import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/layout/Header';
import Animated, { FadeInDown } from 'react-native-reanimated';

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

  const getDayOfWeek = (dateString: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Workday' : days[d.getDay()];
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
});

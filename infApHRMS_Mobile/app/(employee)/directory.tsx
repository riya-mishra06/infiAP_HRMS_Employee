import * as React from 'react';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, TextInput, Modal, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav } from '../../components/BottomNav';
import Header from '../../components/layout/Header';

const TEAMS = ['All Teams', 'Engineering', 'Design', 'Marketing', 'Product', 'HR'];

const EMPLOYEES = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    role: 'Senior Product Designer',
    team: 'PRODUCT DESIGN',
    teamColor: '#22c55e',
    image: require('../../assets/images/sarah.png'),
    status: 'active',
    bio: 'Creates thoughtful experiences with a strong focus on clarity, storytelling, and user trust.',
    rating: '4.8',
    email: 'sarah.jenkins@example.com',
    phone: '+919876543210',
    earned: '₹25k+',
    rate: '₹156/hr',
  },
  {
    id: '2',
    name: 'Marcus Zhao',
    role: 'Lead Backend Developer',
    team: 'ENGINEERING',
    teamColor: '#94a3b8',
    image: require('../../assets/images/marcus.png'),
    status: 'inactive',
    bio: 'Builds reliable systems and leads platform architecture for high-scale internal products.',
    rating: '4.9',
    email: 'marcus.zhao@example.com',
    phone: '+919876543211',
    earned: '₹25k+',
    rate: '₹156/hr',
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    role: 'Head of Growth',
    team: 'MARKETING',
    teamColor: '#22c55e',
    image: require('../../assets/images/elena.png'),
    status: 'active',
    bio: 'Leads growth strategy across campaigns, retention loops, and performance storytelling.',
    rating: '4.7',
    email: 'elena.rodriguez@example.com',
    phone: '+919876543212',
    earned: '₹25k+',
    rate: '₹156/hr',
  },
  {
    id: '4',
    name: 'David Chen',
    role: 'Senior Frontend Engineer',
    team: 'ENGINEERING',
    teamColor: '#22c55e',
    image: require('../../assets/images/david.png'),
    status: 'active',
    bio: 'Crafts fast, polished interfaces and turns product ideas into scalable frontend systems.',
    rating: '4.9',
    email: 'david.chen@example.com',
    phone: '+919876543213',
    earned: '₹25k+',
    rate: '₹156/hr',
  }
];

export default function DirectoryPage() {
  const [activeTeam, setActiveTeam] = useState('All Teams');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<(typeof EMPLOYEES)[number] | null>(null);

  const filteredEmployees = EMPLOYEES.filter(emp => {
    // Exact mapping for filter chips
    let teamMatch = false;
    if (activeTeam === 'All Teams') {
      teamMatch = true;
    } else if (activeTeam === 'Engineering') {
      teamMatch = emp.team === 'ENGINEERING';
    } else if (activeTeam === 'Design') {
      teamMatch = emp.team === 'PRODUCT DESIGN';
    } else if (activeTeam === 'Marketing') {
      teamMatch = emp.team === 'MARKETING';
    } else {
      teamMatch = emp.team.toLowerCase().includes(activeTeam.toLowerCase());
    }

    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    
    return teamMatch && matchesSearch;
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or role..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {TEAMS.map((team) => (
            <TouchableOpacity
              key={team}
              style={[styles.chip, activeTeam === team && styles.chipActive]}
              onPress={() => setActiveTeam(team)}
            >
              <Text style={[styles.chipText, activeTeam === team && styles.chipTextActive]}>
                {team}
              </Text>
              {(team === 'Engineering' || team === 'Design') && (
                <Ionicons name="chevron-down" size={14} color={activeTeam === team ? '#fff' : '#64748b'} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recommended Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recommended</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllLink}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* Employee Cards */}
        {filteredEmployees.map((employee) => (
          <TouchableOpacity
            key={employee.id}
            style={styles.card}
            activeOpacity={0.92}
            onPress={() => setSelectedEmployee(employee)}
          >
            <View style={styles.cardInfo}>
              <View style={styles.teamBadge}>
                <View style={[styles.statusDot, { backgroundColor: employee.teamColor }]} />
                <Text style={styles.teamLabel}>{employee.team}</Text>
              </View>
              <Text style={styles.employeeName}>{employee.name}</Text>
              <Text style={styles.employeeRole}>{employee.role}</Text>
              
              <View style={styles.cardButtons}>
                <TouchableOpacity 
                  style={styles.emailBtn}
                  onPress={() => Linking.openURL(`mailto:${employee.email}`)}
                >
                  <Ionicons name="mail" size={16} color="#fff" />
                  <Text style={styles.emailBtnText}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.slackBtn}
                  onPress={() => Linking.openURL(`tel:${employee.phone}`)}
                >
                  <Ionicons name="call" size={14} color="#1e293b" />
                  <Text style={styles.slackBtnText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Image 
              source={employee.image} 
              style={styles.employeePhoto} 
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal
        visible={Boolean(selectedEmployee)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEmployee(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedEmployee(null)} />
          {selectedEmployee && (
            <View style={styles.modalSheet}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedEmployee(null)}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>

              <Image source={selectedEmployee.image} style={styles.modalImage} resizeMode="cover" />

              <LinearGradient
                colors={['rgba(8, 15, 28, 0.02)', 'rgba(8, 15, 28, 0.46)', 'rgba(8, 15, 28, 0.92)']}
                locations={[0.15, 0.55, 1]}
                style={styles.modalGradient}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalTextBlock}>
                    <View style={styles.modalNameRow}>
                      <Text style={styles.modalName}>{selectedEmployee.name}</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#60a5fa" />
                    </View>
                    <Text style={styles.modalRole}>{selectedEmployee.role}</Text>
                    <Text style={styles.modalBio}>{selectedEmployee.bio}</Text>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <View style={styles.statTopRow}>
                        <Ionicons name="star" size={15} color="#fbbf24" />
                        <Text style={styles.statValue}>{selectedEmployee.rating}</Text>
                      </View>
                      <Text style={styles.statLabel}>Rating</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{selectedEmployee.earned}</Text>
                      <Text style={styles.statLabel}>Earned</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{selectedEmployee.rate}</Text>
                      <Text style={styles.statLabel}>Rate</Text>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.primaryAction} 
                      activeOpacity={0.9}
                      onPress={() => Linking.openURL(`mailto:${selectedEmployee.email}`)}
                    >
                      <Ionicons name="mail-outline" size={20} color="#111827" />
                      <Text style={styles.primaryActionText}>Get In Touch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.secondaryAction} 
                      activeOpacity={0.9}
                      onPress={() => Linking.openURL(`tel:${selectedEmployee.phone}`)}
                    >
                      <Ionicons name="call-outline" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  chipsScroll: {
    paddingBottom: 24,
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#4f46e5',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#fff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 360,
    height: 600,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 3,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalContent: {
    paddingHorizontal: 22,
    paddingBottom: 22,
    paddingTop: 120,
  },
  modalTextBlock: {
    marginBottom: 20,
  },
  modalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalName: {
    flexShrink: 1,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalRole: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 8,
  },
  modalBio: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 18,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
  },
  statDivider: {
    width: 1,
    marginVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryAction: {
    flex: 1,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  secondaryAction: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardInfo: {
    flex: 1,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  teamLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  emailBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  slackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  slackBtnText: {
    color: '#1e293b',
    fontSize: 13,
    fontWeight: '700',
  },
  employeePhoto: {
    width: 86,
    height: 100,
    borderRadius: 12,
    marginLeft: 12,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#2e4ce6',
  },
});

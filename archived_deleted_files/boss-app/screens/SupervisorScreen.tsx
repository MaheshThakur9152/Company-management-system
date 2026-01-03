
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Image, Alert, Platform } from 'react-native';
import { MapPin, Calendar, Search, Camera, Check, X as XIcon, LogOut, Wifi, RefreshCw, Lock, AlertTriangle } from 'lucide-react-native';
import { Employee, AttendanceRecord, AttendanceStatus, Site } from '../types';
import { getEmployees, syncAttendanceData, getSites } from '../services/mockData';
import CameraModal from '../components/CameraModal';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SupervisorScreenProps {
    onLogout: () => void;
    assignedSiteId: string;
}

const SupervisorScreen: React.FC<SupervisorScreenProps> = ({ onLogout, assignedSiteId }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [currentSite, setCurrentSite] = useState<Site | null>(null);
    const [localAttendanceMap, setLocalAttendanceMap] = useState<Record<string, AttendanceRecord>>({});

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOnline, setIsOnline] = useState(true); // Simplified for RN
    const [isSyncing, setIsSyncing] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | undefined>(undefined);

    const [distanceToSite, setDistanceToSite] = useState<number | null>(null);
    const [isWithinRange, setIsWithinRange] = useState<boolean>(false);

    useEffect(() => {
        const loadLocalBuffer = async () => {
            try {
                const saved = await AsyncStorage.getItem('offline_attendance_buffer');
                if (saved) setLocalAttendanceMap(JSON.parse(saved));
            } catch (e) { }
        };
        loadLocalBuffer();
    }, []);

    useEffect(() => {
        const saveLocalBuffer = async () => {
            await AsyncStorage.setItem('offline_attendance_buffer', JSON.stringify(localAttendanceMap));
        };
        saveLocalBuffer();
    }, [localAttendanceMap]);

    useEffect(() => {
        if (!assignedSiteId) return;

        const loadData = async () => {
            const sites = await getSites();
            const site = sites.find(s => s.id === assignedSiteId);
            if (site) setCurrentSite(site);

            const emps = await getEmployees();
            const siteEmps = emps.filter(e => e.siteId === assignedSiteId);
            setAllEmployees(siteEmps);
        };
        loadData();
    }, [assignedSiteId]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            if (currentSite) {
                const location = await Location.getCurrentPositionAsync({});
                setCurrentLocation({ lat: location.coords.latitude, lng: location.coords.longitude });

                const dist = calculateDistance(
                    location.coords.latitude,
                    location.coords.longitude,
                    currentSite.latitude,
                    currentSite.longitude
                );
                setDistanceToSite(dist);
                setIsWithinRange(dist <= currentSite.geofenceRadius);
            }
        })();
    }, [currentSite]);

    const handleSync = async () => {
        const unsyncedRecords = (Object.values(localAttendanceMap) as AttendanceRecord[]).filter(r => !r.isSynced);
        if (unsyncedRecords.length === 0) {
            Alert.alert("Sync", "No new records to sync.");
            return;
        }

        setIsSyncing(true);
        const success = await syncAttendanceData(unsyncedRecords);

        if (success) {
            setLocalAttendanceMap(prev => {
                const next = { ...prev };
                unsyncedRecords.forEach(rec => {
                    if (next[rec.employeeId]) {
                        next[rec.employeeId].isSynced = true;
                        next[rec.employeeId].isLocked = true;
                    }
                });
                return next;
            });
            Alert.alert("Success", "Sync Successful! Records locked and sent to Admin Panel.");
        } else {
            Alert.alert("Error", "Sync failed. Please try again.");
        }
        setIsSyncing(false);
    };

    const handleMarkAttendance = (empId: string) => {
        setActiveEmployeeId(empId);
        setIsCameraOpen(true);
    };

    const handlePhotoCaptured = (photoUrl: string) => {
        if (!activeEmployeeId) return;

        const record: AttendanceRecord = {
            id: Date.now().toString(),
            employeeId: activeEmployeeId,
            date: selectedDate,
            status: 'P',
            checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            photoUrl: photoUrl,
            location: currentLocation,
            isSynced: false,
            isLocked: false
        };

        setLocalAttendanceMap(prev => ({ ...prev, [activeEmployeeId]: record }));
        setActiveEmployeeId(null);
    };

    const toggleStatus = (empId: string, status: AttendanceStatus) => {
        const existing = localAttendanceMap[empId];
        if (existing && existing.isLocked) {
            Alert.alert("Locked", "This record is locked and synced. Contact Admin to edit.");
            return;
        }

        setLocalAttendanceMap(prev => ({
            ...prev,
            [empId]: {
                ...prev[empId],
                id: prev[empId]?.id || Date.now().toString(),
                employeeId: empId,
                date: selectedDate,
                status: status,
                isSynced: false,
                isLocked: false,
                photoUrl: prev[empId]?.photoUrl
            }
        }));
    };

    const filteredEmployees = allEmployees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.biometricCode.includes(searchTerm)
    );

    const pendingSyncCount = (Object.values(localAttendanceMap) as AttendanceRecord[]).filter(r => !r.isSynced).length;

    if (!assignedSiteId) return <View style={styles.center}><Text style={styles.errorText}>Access Denied: No Site Assigned</Text></View>;
    if (!currentSite) return <View style={styles.center}><Text>Loading Site Data...</Text></View>;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <Text style={styles.headerTitle}>Attendance</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={handleSync}
                                disabled={isSyncing || pendingSyncCount === 0}
                                style={[styles.syncButton, pendingSyncCount > 0 ? styles.syncActive : styles.syncInactive]}
                            >
                                {isSyncing ? <RefreshCw size={12} color="#20B2AA" /> : <Wifi size={12} color={pendingSyncCount > 0 ? '#20B2AA' : '#fff'} />}
                                <Text style={[styles.syncText, pendingSyncCount > 0 ? { color: '#20B2AA' } : { color: '#fff' }]}>
                                    {isSyncing ? 'Syncing...' : `${pendingSyncCount} Pending`}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onLogout}>
                                <LogOut size={20} color="rgba(255,255,255,0.8)" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Geofence Card */}
                    <View style={[styles.geoCard, isWithinRange ? styles.geoSuccess : styles.geoError]}>
                        <View style={styles.geoRow}>
                            <MapPin size={16} color="#fff" />
                            <Text style={styles.geoText}>{currentSite.name}</Text>
                        </View>
                        {distanceToSite !== null ? (
                            <View style={styles.geoBadge}>
                                <Text style={[styles.geoBadgeText, isWithinRange ? { color: 'green' } : { color: 'red' }]}>
                                    {isWithinRange ? 'In Range' : 'Out of Range'}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.geoLoading}>Locating...</Text>
                        )}
                    </View>

                    <View style={styles.dateRow}>
                        <View style={styles.dateInputContainer}>
                            <Calendar size={16} color="#fff" />
                            <Text style={styles.dateText}>{selectedDate}</Text>
                            {/* In a real app, use a DatePicker here */}
                        </View>
                        <Text style={styles.workerCount}>{filteredEmployees.length} Workers</Text>
                    </View>
                </SafeAreaView>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={18} color="#999" />
                    <TextInput
                        placeholder="Search worker..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        style={styles.searchInput}
                    />
                </View>
            </View>

            {/* List */}
            <ScrollView style={styles.list}>
                {filteredEmployees.map(emp => {
                    const record = localAttendanceMap[emp.id];
                    const isPresent = record?.status === 'P';
                    const isLocked = record?.isLocked;

                    return (
                        <View key={emp.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.empInfo}>
                                    <Image source={{ uri: record?.photoUrl || emp.photoUrl }} style={[styles.avatar, isPresent && styles.avatarPresent]} />
                                    <View>
                                        <Text style={styles.empName}>{emp.name}</Text>
                                        <Text style={styles.empDetail}>{emp.biometricCode} • {emp.role}</Text>
                                    </View>
                                </View>
                                <View style={styles.statusInfo}>
                                    {isPresent && (
                                        <View style={styles.checkTime}>
                                            <Check size={12} color="green" />
                                            <Text style={styles.checkTimeText}>{record.checkInTime}</Text>
                                        </View>
                                    )}
                                    {isLocked && (
                                        <View style={styles.lockedBadge}>
                                            <Lock size={10} color="#666" />
                                            <Text style={styles.lockedText}>Synced</Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {!isLocked ? (
                                <View style={styles.controls}>
                                    {!isPresent ? (
                                        <TouchableOpacity onPress={() => handleMarkAttendance(emp.id)} style={styles.markButton}>
                                            <Camera size={16} color="#fff" />
                                            <Text style={styles.markButtonText}>Mark Present</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity onPress={() => toggleStatus(emp.id, 'A')} style={styles.undoButton}>
                                            <XIcon size={16} color="#ff4444" />
                                            <Text style={styles.undoButtonText}>Undo / Absent</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.lockedMessage}>
                                    <Text style={styles.lockedMessageText}>Attendance Locked</Text>
                                </View>
                            )}
                        </View>
                    );
                })}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Sync Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleSync}
                    disabled={pendingSyncCount === 0 || isSyncing}
                    style={[styles.footerButton, pendingSyncCount > 0 ? styles.footerButtonActive : styles.footerButtonInactive]}
                >
                    <Text style={styles.footerButtonText}>
                        {isSyncing ? "Syncing..." : pendingSyncCount > 0 ? `SYNC ${pendingSyncCount} RECORDS` : "ALL SYNCED"}
                    </Text>
                </TouchableOpacity>
            </View>

            <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handlePhotoCaptured}
                location={currentLocation}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', fontWeight: 'bold' },
    header: { backgroundColor: '#20B2AA', paddingBottom: 20, paddingHorizontal: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    syncButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    syncActive: { backgroundColor: '#fff' },
    syncInactive: { backgroundColor: 'rgba(255,255,255,0.2)' },
    syncText: { fontSize: 10, fontWeight: 'bold' },
    geoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1 },
    geoSuccess: { backgroundColor: 'rgba(0,255,0,0.1)', borderColor: 'rgba(0,255,0,0.3)' },
    geoError: { backgroundColor: 'rgba(255,0,0,0.1)', borderColor: 'rgba(255,0,0,0.3)' },
    geoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    geoText: { color: '#fff', fontWeight: 'bold' },
    geoBadge: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    geoBadgeText: { fontSize: 10, fontWeight: 'bold' },
    geoLoading: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateInputContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateText: { color: '#fff', fontWeight: 'bold' },
    workerCount: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    searchContainer: { paddingHorizontal: 16, marginTop: -10, zIndex: 10 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8 },
    list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    empInfo: { flexDirection: 'row', gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
    avatarPresent: { borderWidth: 2, borderColor: 'green' },
    empName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    empDetail: { fontSize: 12, color: '#666', marginTop: 2 },
    statusInfo: { alignItems: 'flex-end', gap: 4 },
    checkTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    checkTimeText: { fontSize: 12, color: 'green', fontWeight: 'bold' },
    lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f5f5f5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    lockedText: { fontSize: 10, color: '#666' },
    controls: { flexDirection: 'row', gap: 8, marginTop: 12 },
    markButton: { flex: 1, backgroundColor: '#20B2AA', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    markButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    undoButton: { flex: 1, backgroundColor: '#ffebee', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    undoButtonText: { color: '#ff4444', fontWeight: 'bold', fontSize: 14 },
    lockedMessage: { marginTop: 12, backgroundColor: '#f9f9f9', padding: 8, borderRadius: 8, alignItems: 'center' },
    lockedMessageText: { color: '#999', fontSize: 12 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.9)', padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
    footerButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
    footerButtonActive: { backgroundColor: '#FF8C00' },
    footerButtonInactive: { backgroundColor: '#333' },
    footerButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default SupervisorScreen;

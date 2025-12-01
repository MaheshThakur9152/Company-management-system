
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Alert, Image, TextInput } from 'react-native';
import { FileText, Users, CalendarDays, LogOut, Menu, Receipt, FileSpreadsheet, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Download } from 'lucide-react-native';
import { getSharedAttendanceData, getInvoices, updateInvoice, getEmployees, addEmployee, updateEmployee, deleteEmployee, getSites } from '../services/mockData';
import { Invoice, Employee, AttendanceRecord, Site } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AdminScreenProps {
    onLogout: () => void;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'employees' | 'attendance'>('invoices');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');

    useEffect(() => {
        const loadData = async () => {
            setAttendanceData(await getSharedAttendanceData());
            setInvoices(await getInvoices());
            setEmployees(await getEmployees());
            setSites(await getSites());
        };
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleDownloadInvoice = (invoice: Invoice) => {
        Alert.alert("Download", "PDF generation not implemented in mobile yet.");
    };

    const togglePaymentStatus = async (invoice: Invoice) => {
        const updated = { ...invoice, status: invoice.status === 'Paid' ? 'Unpaid' : 'Paid' } as Invoice;
        setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
        await updateInvoice(updated);
    };

    const handleDeleteEmployee = async (id: string) => {
        Alert.alert("Delete Employee", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    await deleteEmployee(id);
                    setEmployees(await getEmployees());
                }
            }
        ]);
    };

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.biometricCode.includes(searchTerm)
    );

    const renderInvoiceItem = ({ item }: { item: Invoice }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.cardTitle}>{item.siteName}</Text>
                    <Text style={styles.cardSubtitle}>{item.invoiceNo}</Text>
                </View>
                <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.period}>{item.billingPeriod}</Text>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => togglePaymentStatus(item)} style={[styles.statusBadge, item.status === 'Paid' ? styles.paid : styles.unpaid]}>
                        {item.status === 'Paid' ? <CheckCircle size={12} color="green" /> : <XCircle size={12} color="red" />}
                        <Text style={[styles.statusText, item.status === 'Paid' ? { color: 'green' } : { color: 'red' }]}>{item.status}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDownloadInvoice(item)} style={styles.iconButton}>
                        <Download size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderEmployeeItem = ({ item }: { item: Employee }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
                <View style={styles.empInfo}>
                    <Text style={styles.empName}>{item.name}</Text>
                    <Text style={styles.empRole}>{item.role} • {item.biometricCode}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleDeleteEmployee(item.id)}>
                        <Trash2 size={20} color="#ff4444" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.empFooter}>
                <Text style={styles.siteBadge}>{item.siteId === 's1' ? 'Ajmera' : 'Site ' + item.siteId}</Text>
                <Text style={styles.joinDate}>Joined: {item.joiningDate}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Admin Panel</Text>
                <TouchableOpacity onPress={onLogout}>
                    <LogOut size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity onPress={() => setActiveTab('invoices')} style={[styles.tab, activeTab === 'invoices' && styles.activeTab]}>
                    <FileText size={20} color={activeTab === 'invoices' ? '#fff' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'invoices' && styles.activeTabText]}>Billing</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('employees')} style={[styles.tab, activeTab === 'employees' && styles.activeTab]}>
                    <Users size={20} color={activeTab === 'employees' ? '#fff' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'employees' && styles.activeTabText]}>Staff</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('attendance')} style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}>
                    <CalendarDays size={20} color={activeTab === 'attendance' ? '#fff' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>View</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'invoices' && (
                    <FlatList
                        data={invoices}
                        renderItem={renderInvoiceItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                    />
                )}

                {activeTab === 'employees' && (
                    <View style={{ flex: 1 }}>
                        <View style={styles.searchBar}>
                            <Search size={20} color="#999" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search staff..."
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />
                        </View>
                        <FlatList
                            data={filteredEmployees}
                            renderItem={renderEmployeeItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                        />
                    </View>
                )}

                {activeTab === 'attendance' && (
                    <ScrollView style={styles.scrollContent}>
                        <Text style={styles.sectionTitle}>Attendance Grid (Mobile View)</Text>
                        <Text style={{ color: '#666', marginBottom: 10 }}>Horizontal scroll needed for full month view.</Text>
                        <ScrollView horizontal>
                            <View>
                                <View style={styles.gridHeaderRow}>
                                    <Text style={[styles.gridHeaderCell, { width: 100 }]}>Employee</Text>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                        <Text key={d} style={styles.gridHeaderCell}>{d}</Text>
                                    ))}
                                </View>
                                {employees.map(emp => {
                                    const empRecords = attendanceData.filter(r => r.employeeId === emp.id);
                                    return (
                                        <View key={emp.id} style={styles.gridRow}>
                                            <Text style={[styles.gridCell, { width: 100, textAlign: 'left' }]}>{emp.name}</Text>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                                const now = new Date();
                                                const year = now.getFullYear();
                                                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                                                const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
                                                const record = empRecords.find(r => r.date === dateStr);
                                                let status = '-';
                                                let color = '#ccc';
                                                if (record) {
                                                    if (record.status === 'P') { status = 'P'; color = 'green'; }
                                                    else if (record.status === 'A') { status = 'A'; color = 'red'; }
                                                    else if (record.status === 'HD') { status = 'HD'; color = 'orange'; }
                                                    else if (record.status === 'W/O') { status = 'WO'; color = 'blue'; }
                                                }
                                                return (
                                                    <Text key={day} style={[styles.gridCell, { color, fontWeight: 'bold' }]}>{status}</Text>
                                                );
                                            })}
                                        </View>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    tabBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 8, justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#eee' },
    tab: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, gap: 8 },
    activeTab: { backgroundColor: '#20B2AA' },
    tabText: { color: '#666', fontWeight: '600' },
    activeTabText: { color: '#fff' },
    content: { flex: 1 },
    listContent: { padding: 16, gap: 12 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    cardSubtitle: { fontSize: 12, color: '#999' },
    amount: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    period: { fontSize: 12, color: '#666' },
    actions: { flexDirection: 'row', gap: 12 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    paid: { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' },
    unpaid: { backgroundColor: '#ffebee', borderColor: '#ffcdd2' },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    iconButton: { padding: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
    empInfo: { flex: 1 },
    empName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    empRole: { fontSize: 12, color: '#666' },
    empFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    siteBadge: { fontSize: 10, backgroundColor: '#e3f2fd', color: '#1976d2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    joinDate: { fontSize: 10, color: '#999' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
    searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 16 },
    scrollContent: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    gridHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 4 },
    gridHeaderCell: { width: 40, textAlign: 'center', fontWeight: 'bold', fontSize: 12, color: '#555' },
    gridRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
    gridCell: { width: 40, textAlign: 'center', fontSize: 12 },
});

export default AdminScreen;

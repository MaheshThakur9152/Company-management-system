import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, Alert, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { LogOut, TrendingUp, Download, AlertCircle, FileText, Users, BookOpen, LayoutDashboard, Settings, Check, X, Filter, Plus, Globe, ChevronRight, ArrowUpRight, ArrowDownLeft, ChevronLeft, MapPin, Wallet } from 'lucide-react-native';
import { MOCK_STATS, getInvoices, getSites, getEmployees, getSharedAttendanceData, addInvoice } from '../services/mockData';
import { Invoice, DashboardStats, User, Employee, AttendanceRecord, Site } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BossScreenProps {
    onLogout: () => void;
    user?: User;
}

type Language = 'en' | 'hi';
type ScreenType = 'dashboard' | 'revenue' | 'unpaid' | 'sites_workers' | 'site_worker_details' | 'invoices' | 'advances';

const TRANSLATIONS = {
    en: {
        dashboard: "Dashboard",
        invoices: "Invoices",
        staff: "Staff",
        revenue: "Total Revenue",
        revenueDetails: "Revenue Details",
        unpaid: "Unpaid Bills",
        unpaidDetails: "Unpaid Invoices",
        present: "Present Today",
        generate: "New Bill",
        settings: "Settings",
        language: "Language",
        logout: "Logout",
        taxInvoice: "Tax Invoice",
        proformaInvoice: "Proforma",
        paid: "Paid",
        pending: "Pending",
        approved: "Approved",
        viewPhoto: "Photo",
        welcome: "Hello",
        totalWorkers: "Workers",
        activeSites: "Sites",
        selectSite: "Select Site",
        generateBill: "Generate Bill",
        cancel: "Cancel",
        success: "Success",
        billGenerated: "Invoice generated successfully!",
        noData: "No data available",
        search: "Search...",
        allSites: "All Sites",
        advance: "Advance",
        advances: "Advances & Deductions",
        siteRevenue: "Site Revenue",
        recent: "Recent",
        seeAll: "See All",
        back: "Back",
        download: "Download",
        workersBySite: "Workers by Site",
        selectSiteToView: "Select a site to view workers",
        uniform: "Uniform",
        shoes: "Shoes",
        others: "Others"
    },
    hi: {
        dashboard: "डैशबोर्ड",
        invoices: "बिल",
        staff: "स्टाफ",
        revenue: "कुल कमाई",
        revenueDetails: "कमाई का विवरण",
        unpaid: "बकाया",
        unpaidDetails: "बकाया बिल",
        present: "उपस्थित",
        generate: "नया बिल",
        settings: "सेटिंग्स",
        language: "भाषा",
        logout: "लॉग आउट",
        taxInvoice: "पक्का बिल",
        proformaInvoice: "कच्चा बिल",
        paid: "जमा",
        pending: "बाकी",
        approved: "मंजूर",
        viewPhoto: "फोटो",
        welcome: "नमस्ते",
        totalWorkers: "कर्मचारी",
        activeSites: "साइटें",
        selectSite: "साइट चुनें",
        generateBill: "बिल बनाएं",
        cancel: "रद्द करें",
        success: "सफल",
        billGenerated: "बिल बन गया!",
        noData: "डेटा नहीं है",
        search: "खोजें...",
        allSites: "सभी साइटें",
        advance: "एडवांस",
        advances: "एडवांस और कटौती",
        siteRevenue: "साइट कमाई",
        recent: "हाल ही में",
        seeAll: "सभी देखें",
        back: "वापस",
        download: "डाउनलोड",
        workersBySite: "साइट अनुसार कर्मचारी",
        selectSiteToView: "कर्मचारियों को देखने के लिए साइट चुनें",
        uniform: "वर्दी",
        shoes: "जूते",
        others: "अन्य"
    }
};

const { width } = Dimensions.get('window');

const BossScreen: React.FC<BossScreenProps> = ({ onLogout, user }) => {
    const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
    const [lang, setLang] = useState<Language>('en');
    const t = TRANSLATIONS[lang];

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
    const [presentCount, setPresentCount] = useState(0);
    const [totalAdvance, setTotalAdvance] = useState(0);

    // Modals
    const [showSettings, setShowSettings] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [selectedSiteForBill, setSelectedSiteForBill] = useState<string | null>(null);
    const [billType, setBillType] = useState<'Tax' | 'Proforma'>('Tax');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Auto refresh
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        const loadedInvoices = await getInvoices();
        const loadedSites = await getSites();
        const loadedEmps = await getEmployees();
        const loadedAttendance = await getSharedAttendanceData();

        setInvoices(loadedInvoices);
        setSites(loadedSites);
        setEmployees(loadedEmps);
        setAttendance(loadedAttendance);

        // Calculate Stats
        const totalUnpaid = loadedInvoices
            .filter(i => i.status === 'Unpaid')
            .reduce((sum, i) => sum + i.amount, 0);

        const revenue = loadedInvoices
            .reduce((sum, i) => sum + i.amount, 0);

        // Calculate Present Today
        const today = new Date().toISOString().split('T')[0];
        const present = loadedAttendance.filter(r => r.date === today && (r.status === 'P' || r.status === 'HD')).length;
        setPresentCount(present);

        // Calculate Total Advance
        const adv = loadedEmps.reduce((sum, e) => sum + (e.salaryDetails?.deductionBreakdown?.advance || 0), 0);
        setTotalAdvance(adv);

        setStats({
            totalUnpaid,
            activeSites: loadedSites.length,
            totalWorkers: loadedEmps.length,
            revenue
        });
    };

    const handleGenerateInvoice = async () => {
        if (!selectedSiteForBill) {
            Alert.alert("Error", "Please select a site");
            return;
        }

        const site = sites.find(s => s.id === selectedSiteForBill);
        if (!site) return;

        // Mock Generation Logic
        const d = new Date();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const prefix = billType === 'Proforma' ? 'PI' : 'INV';

        const newInvoice: Invoice = {
            id: Date.now().toString(),
            invoiceNo: `${prefix}/${year}/${month}/${site.id.substring(1)}`,
            siteId: site.id,
            siteName: site.name,
            billingPeriod: `${d.toLocaleString('default', { month: 'short' })} ${year}`,
            items: [{ id: '1', description: 'Manpower Services', hsn: '9985', rate: 0, days: 30, persons: 0, amount: 0 }], // Placeholder
            subTotal: 0,
            cgst: 0,
            sgst: 0,
            amount: 0,
            status: 'Unpaid',
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            generatedDate: new Date().toISOString().split('T')[0]
        };

        await addInvoice(newInvoice);
        await loadData();
        setShowGenerateModal(false);
        Alert.alert(t.success, t.billGenerated);
    };

    const handleDownloadInvoice = (invoice: Invoice) => {
        Alert.alert(t.download, `Downloading ${invoice.invoiceNo}...`);
        // In a real app, use expo-print or expo-sharing here
    };

    const navigateTo = (screen: ScreenType, siteId?: string) => {
        if (siteId) setSelectedSiteId(siteId);
        setCurrentScreen(screen);
    };

    const handleBack = () => {
        if (currentScreen === 'site_worker_details') setCurrentScreen('sites_workers');
        else setCurrentScreen('dashboard');
    };

    // --- RENDER FUNCTIONS ---

    const renderHeader = (title: string, showBack: boolean = false) => (
        <SafeAreaView edges={['top']} style={styles.header}>
            <View style={styles.headerContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {showBack && (
                        <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
                            <ChevronLeft size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={styles.headerTitle}>{showBack ? t.back : t.welcome}</Text>
                        <Text style={styles.headerSubtitle}>{title}</Text>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconBtn}>
                        <Settings size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onLogout} style={styles.iconBtn}>
                        <LogOut size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );

    const renderDashboard = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Big Stats */}
            <View style={styles.bigStatsRow}>
                <TouchableOpacity
                    style={[styles.bigStatCard, { backgroundColor: '#E8F5E9' }]}
                    onPress={() => navigateTo('revenue')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.bigStatLabel, { color: '#2E7D32' }]}>{t.revenue}</Text>
                    <Text style={[styles.bigStatValue, { color: '#1B5E20' }]}>₹{(stats.revenue / 100000).toFixed(2)}L</Text>
                    <ArrowUpRight size={20} color="#2E7D32" style={styles.statIcon} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.bigStatCard, { backgroundColor: '#FFEBEE' }]}
                    onPress={() => navigateTo('unpaid')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.bigStatLabel, { color: '#C62828' }]}>{t.unpaid}</Text>
                    <Text style={[styles.bigStatValue, { color: '#B71C1C' }]}>₹{(stats.totalUnpaid / 1000).toFixed(1)}k</Text>
                    <AlertCircle size={20} color="#C62828" style={styles.statIcon} />
                </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
                <TouchableOpacity
                    style={styles.smallStatCard}
                    onPress={() => navigateTo('sites_workers')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.smallStatValue}>{presentCount}</Text>
                    <Text style={styles.smallStatLabel}>{t.present}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.smallStatCard}
                    onPress={() => navigateTo('sites_workers')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.smallStatValue}>{stats.activeSites}</Text>
                    <Text style={styles.smallStatLabel}>{t.activeSites}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.smallStatCard}
                    onPress={() => navigateTo('sites_workers')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.smallStatValue}>{stats.totalWorkers}</Text>
                    <Text style={styles.smallStatLabel}>{t.totalWorkers}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.smallStatCard}
                    onPress={() => navigateTo('advances')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.smallStatValue, { color: '#FF8C00' }]}>₹{(totalAdvance / 1000).toFixed(1)}k</Text>
                    <Text style={[styles.smallStatLabel, { color: '#FF8C00' }]}>{t.advance}</Text>
                </TouchableOpacity>
            </View>

            {/* Revenue Per Site */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.siteRevenue}</Text>
                <TouchableOpacity onPress={() => navigateTo('revenue')}>
                    <Text style={{ color: '#20B2AA', fontWeight: 'bold' }}>{t.seeAll}</Text>
                </TouchableOpacity>
            </View>

            {sites.slice(0, 5).map(site => {
                const siteRevenue = invoices.filter(i => i.siteId === site.id).reduce((sum, i) => sum + i.amount, 0);
                return (
                    <TouchableOpacity
                        key={site.id}
                        style={styles.siteRow}
                        onPress={() => navigateTo('site_worker_details', site.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.siteIcon}>
                            <Text style={styles.siteInitials}>{site.name.substring(0, 2).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.siteName}>{site.name}</Text>
                            <Text style={styles.siteLoc}>{site.location}</Text>
                        </View>
                        <Text style={styles.siteAmount}>₹{(siteRevenue / 1000).toFixed(1)}k</Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );

    const renderRevenueScreen = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={[styles.bigStatCard, { backgroundColor: '#E8F5E9', marginBottom: 20, height: 100 }]}>
                <Text style={[styles.bigStatLabel, { color: '#2E7D32' }]}>{t.revenue}</Text>
                <Text style={[styles.bigStatValue, { color: '#1B5E20' }]}>₹{(stats.revenue / 100000).toFixed(2)}L</Text>
            </View>
            <Text style={styles.sectionTitle}>{t.allSites}</Text>
            {sites.map(site => {
                const siteRevenue = invoices.filter(i => i.siteId === site.id).reduce((sum, i) => sum + i.amount, 0);
                return (
                    <View key={site.id} style={styles.siteRow}>
                        <View style={styles.siteIcon}>
                            <Text style={styles.siteInitials}>{site.name.substring(0, 2).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.siteName}>{site.name}</Text>
                            <Text style={styles.siteLoc}>{site.location}</Text>
                        </View>
                        <Text style={styles.siteAmount}>₹{(siteRevenue / 1000).toFixed(1)}k</Text>
                    </View>
                );
            })}
        </ScrollView>
    );

    const renderUnpaidScreen = () => {
        const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid');
        return (
            <View style={{ flex: 1 }}>
                <View style={{ padding: 20, backgroundColor: '#FFEBEE' }}>
                    <Text style={{ color: '#C62828', fontWeight: 'bold' }}>{t.unpaid}</Text>
                    <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#B71C1C' }}>₹{(stats.totalUnpaid / 1000).toFixed(1)}k</Text>
                </View>
                <FlatList
                    data={unpaidInvoices}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.invoiceCard}>
                            <View style={styles.invoiceHeader}>
                                <Text style={styles.invoiceSite}>{item.siteName}</Text>
                                <View style={[styles.statusPill, styles.statusUnpaid]}>
                                    <Text style={[styles.statusText, { color: '#B71C1C' }]}>{t.pending}</Text>
                                </View>
                            </View>
                            <View style={styles.invoiceBody}>
                                <View>
                                    <Text style={styles.invoiceNo}>{item.invoiceNo}</Text>
                                    <Text style={styles.invoiceDate}>{item.billingPeriod}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.invoiceAmount, { color: '#B71C1C' }]}>₹{item.amount.toLocaleString()}</Text>
                                    <TouchableOpacity onPress={() => handleDownloadInvoice(item)} style={styles.downloadBtn}>
                                        <Download size={14} color="#fff" />
                                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 }}>{t.download}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                />
            </View>
        );
    };

    const renderSitesWorkersScreen = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{t.selectSiteToView}</Text>
            {sites.map(site => {
                const workerCount = employees.filter(e => e.siteId === site.id).length;
                return (
                    <TouchableOpacity
                        key={site.id}
                        style={styles.siteRow}
                        onPress={() => navigateTo('site_worker_details', site.id)}
                    >
                        <View style={[styles.siteIcon, { backgroundColor: '#E3F2FD' }]}>
                            <MapPin size={20} color="#1565C0" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.siteName}>{site.name}</Text>
                            <Text style={styles.siteLoc}>{site.location}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.siteAmount}>{workerCount}</Text>
                            <Text style={{ fontSize: 10, color: '#666' }}>{t.totalWorkers}</Text>
                        </View>
                        <ChevronRight size={20} color="#999" style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );

    const renderSiteWorkerDetails = () => {
        const site = sites.find(s => s.id === selectedSiteId);
        const siteEmployees = employees.filter(e => e.siteId === selectedSiteId);

        return (
            <View style={{ flex: 1 }}>
                <View style={{ padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>{site?.name}</Text>
                    <Text style={{ color: '#666' }}>{site?.location}</Text>
                </View>
                <FlatList
                    data={siteEmployees}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const advance = item.salaryDetails?.deductionBreakdown?.advance || 0;
                        const empAttendance = attendance
                            .filter(a => a.employeeId === item.id && a.photoUrl)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                        const displayPhoto = empAttendance?.photoUrl || item.photoUrl;

                        return (
                            <View style={styles.staffCard}>
                                <Image source={{ uri: displayPhoto }} style={styles.staffAvatarBig} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.staffName}>{item.name}</Text>
                                    <Text style={styles.staffRole}>{item.role}</Text>
                                    <Text style={{ fontSize: 10, color: '#999' }}>{item.biometricCode}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    {advance > 0 && (
                                        <View style={styles.advanceBadge}>
                                            <Text style={styles.advanceLabel}>{t.advance}</Text>
                                            <Text style={styles.advanceAmount}>₹{advance}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    }}
                />
            </View>
        );
    };

    const renderAdvancesScreen = () => {
        const employeesWithDeductions = employees.filter(e => {
            const d = e.salaryDetails?.deductionBreakdown;
            if (!d) return false;
            return (d.advance || 0) > 0 || (d.uniform || 0) > 0 || (d.shoes || 0) > 0 || (d.others || 0) > 0;
        });

        return (
            <View style={{ flex: 1 }}>
                <FlatList
                    data={employeesWithDeductions}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const d = item.salaryDetails?.deductionBreakdown;
                        return (
                            <View style={styles.staffCard}>
                                <Image source={{ uri: item.photoUrl }} style={styles.staffAvatar} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.staffName}>{item.name}</Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                        {d?.advance ? (
                                            <View style={styles.deductionTag}>
                                                <Text style={styles.deductionLabel}>{t.advance}:</Text>
                                                <Text style={styles.deductionValue}>₹{d.advance}</Text>
                                            </View>
                                        ) : null}
                                        {d?.uniform ? (
                                            <View style={styles.deductionTag}>
                                                <Text style={styles.deductionLabel}>{t.uniform}:</Text>
                                                <Text style={styles.deductionValue}>₹{d.uniform}</Text>
                                            </View>
                                        ) : null}
                                        {d?.shoes ? (
                                            <View style={styles.deductionTag}>
                                                <Text style={styles.deductionLabel}>{t.shoes}:</Text>
                                                <Text style={styles.deductionValue}>₹{d.shoes}</Text>
                                            </View>
                                        ) : null}
                                        {d?.others ? (
                                            <View style={styles.deductionTag}>
                                                <Text style={styles.deductionLabel}>{t.others}:</Text>
                                                <Text style={styles.deductionValue}>₹{d.others}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            </View>
                        );
                    }}
                />
            </View>
        );
    };

    const renderInvoices = () => (
        <View style={{ flex: 1 }}>
            <View style={styles.tabHeader}>
                <Text style={styles.tabTitle}>{t.invoices}</Text>
                <TouchableOpacity onPress={() => setShowGenerateModal(true)} style={styles.addButton}>
                    <Plus size={24} color="#fff" />
                    <Text style={styles.addButtonText}>{t.generate}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
                <TouchableOpacity onPress={() => setBillType('Tax')} style={[styles.filterBtn, billType === 'Tax' && styles.filterBtnActive]}>
                    <Text style={[styles.filterText, billType === 'Tax' && styles.filterTextActive]}>{t.taxInvoice}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBillType('Proforma')} style={[styles.filterBtn, billType === 'Proforma' && styles.filterBtnActive]}>
                    <Text style={[styles.filterText, billType === 'Proforma' && styles.filterTextActive]}>{t.proformaInvoice}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={invoices.filter(i => (billType === 'Tax' ? !i.invoiceNo.startsWith('PI') : i.invoiceNo.startsWith('PI')))}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.invoiceCard}>
                        <View style={styles.invoiceHeader}>
                            <Text style={styles.invoiceSite}>{item.siteName}</Text>
                            <View style={[styles.statusPill, item.status === 'Paid' ? styles.statusPaid : styles.statusUnpaid]}>
                                <Text style={[styles.statusText, item.status === 'Paid' ? { color: '#1B5E20' } : { color: '#B71C1C' }]}>
                                    {item.status === 'Paid' ? t.paid : t.pending}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.invoiceBody}>
                            <View>
                                <Text style={styles.invoiceNo}>{item.invoiceNo}</Text>
                                <Text style={styles.invoiceDate}>{item.billingPeriod}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.invoiceAmount}>₹{item.amount.toLocaleString()}</Text>
                                <TouchableOpacity onPress={() => handleDownloadInvoice(item)} style={styles.downloadBtn}>
                                    <Download size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />
        </View>
    );

    // --- MAIN RENDER ---

    return (
        <View style={styles.container}>
            {currentScreen === 'dashboard' && renderHeader(user?.name || 'Boss', false)}
            {currentScreen === 'revenue' && renderHeader(t.revenueDetails, true)}
            {currentScreen === 'unpaid' && renderHeader(t.unpaidDetails, true)}
            {currentScreen === 'sites_workers' && renderHeader(t.workersBySite, true)}
            {currentScreen === 'site_worker_details' && renderHeader(t.staff, true)}
            {currentScreen === 'invoices' && renderHeader(t.invoices, false)}
            {currentScreen === 'advances' && renderHeader(t.advances, true)}

            <View style={styles.content}>
                {currentScreen === 'dashboard' && renderDashboard()}
                {currentScreen === 'revenue' && renderRevenueScreen()}
                {currentScreen === 'unpaid' && renderUnpaidScreen()}
                {currentScreen === 'sites_workers' && renderSitesWorkersScreen()}
                {currentScreen === 'site_worker_details' && renderSiteWorkerDetails()}
                {currentScreen === 'invoices' && renderInvoices()}
                {currentScreen === 'advances' && renderAdvancesScreen()}
            </View>

            {/* Custom Bottom Navigation - Only show on main tabs */}
            {['dashboard', 'invoices'].includes(currentScreen) && (
                <View style={styles.bottomNavContainer}>
                    <View style={styles.bottomNav}>
                        <TouchableOpacity onPress={() => setCurrentScreen('dashboard')} style={styles.navItem}>
                            <LayoutDashboard size={28} color={currentScreen === 'dashboard' ? '#20B2AA' : '#999'} />
                            <Text style={[styles.navText, currentScreen === 'dashboard' && styles.navTextActive]}>{t.dashboard}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentScreen('invoices')} style={styles.navItem}>
                            <FileText size={28} color={currentScreen === 'invoices' ? '#20B2AA' : '#999'} />
                            <Text style={[styles.navText, currentScreen === 'invoices' && styles.navTextActive]}>{t.invoices}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setCurrentScreen('sites_workers')} style={styles.navItem}>
                            <Users size={28} color={currentScreen === 'sites_workers' ? '#20B2AA' : '#999'} />
                            <Text style={[styles.navText, currentScreen === 'sites_workers' && styles.navTextActive]}>{t.staff}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Settings Modal */}
            <Modal visible={showSettings} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t.settings}</Text>

                        <Text style={styles.label}>{t.language}</Text>
                        <View style={styles.langRow}>
                            <TouchableOpacity onPress={() => setLang('en')} style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}>
                                <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>English</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setLang('hi')} style={[styles.langBtn, lang === 'hi' && styles.langBtnActive]}>
                                <Text style={[styles.langText, lang === 'hi' && styles.langTextActive]}>हिंदी</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>{t.cancel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Generate Invoice Modal */}
            <Modal visible={showGenerateModal} animationType="slide">
                <SafeAreaView style={styles.fullScreenModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalHeaderTitle}>{t.generateBill}</Text>
                        <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
                            <X size={28} color="#333" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalBody}>
                        <Text style={styles.label}>Bill Type</Text>
                        <View style={styles.typeRow}>
                            <TouchableOpacity onPress={() => setBillType('Tax')} style={[styles.typeBtn, billType === 'Tax' && styles.typeBtnActive]}>
                                <Text style={[styles.typeText, billType === 'Tax' && styles.typeTextActive]}>{t.taxInvoice}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setBillType('Proforma')} style={[styles.typeBtn, billType === 'Proforma' && styles.typeBtnActive]}>
                                <Text style={[styles.typeText, billType === 'Proforma' && styles.typeTextActive]}>{t.proformaInvoice}</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>{t.selectSite}</Text>
                        {sites.map(site => (
                            <TouchableOpacity
                                key={site.id}
                                onPress={() => setSelectedSiteForBill(site.id)}
                                style={[styles.siteItem, selectedSiteForBill === site.id && styles.siteItemActive]}
                            >
                                <Text style={[styles.siteText, selectedSiteForBill === site.id && styles.siteTextActive]}>{site.name}</Text>
                                {selectedSiteForBill === site.id && <Check size={24} color="#fff" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View style={styles.modalFooter}>
                        <TouchableOpacity onPress={handleGenerateInvoice} style={styles.generateBtn}>
                            <Text style={styles.generateBtnText}>{t.generate}</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { backgroundColor: '#20B2AA', paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    headerTitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
    headerSubtitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    headerActions: { flexDirection: 'row', gap: 15 },
    iconBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },

    content: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    listContent: { padding: 20, paddingBottom: 120 },

    // Dashboard Stats
    bigStatsRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    bigStatCard: { flex: 1, padding: 20, borderRadius: 20, justifyContent: 'space-between', height: 140, position: 'relative' },
    bigStatLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
    bigStatValue: { fontSize: 24, fontWeight: 'bold' },
    statIcon: { position: 'absolute', top: 15, right: 15, opacity: 0.5 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
    smallStatCard: { width: (width - 50) / 2, backgroundColor: '#fff', padding: 15, borderRadius: 15, alignItems: 'center', elevation: 2, marginBottom: 10 },
    smallStatValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    smallStatLabel: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },

    sectionHeader: { marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },

    siteRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 1 },
    siteIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' },
    siteInitials: { color: '#00695C', fontWeight: 'bold' },
    siteName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    siteLoc: { fontSize: 12, color: '#999' },
    siteAmount: { fontSize: 16, fontWeight: 'bold', color: '#20B2AA' },

    // Invoices
    tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    tabTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#20B2AA', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 30, gap: 5 },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    filterRow: { flexDirection: 'row', padding: 15, gap: 10 },
    filterBtn: { flex: 1, padding: 12, borderRadius: 30, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
    filterBtnActive: { backgroundColor: '#333', borderColor: '#333' },
    filterText: { fontWeight: 'bold', color: '#666' },
    filterTextActive: { color: '#fff' },

    invoiceCard: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 15, elevation: 2 },
    invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    invoiceSite: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusPaid: { backgroundColor: '#E8F5E9' },
    statusUnpaid: { backgroundColor: '#FFEBEE' },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    invoiceBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    invoiceNo: { fontSize: 12, color: '#999' },
    invoiceDate: { fontSize: 12, color: '#666', marginTop: 2 },
    invoiceAmount: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    downloadBtn: { backgroundColor: '#20B2AA', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginTop: 5 },

    // Staff
    staffCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 1 },
    staffAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
    staffAvatarBig: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eee' },
    staffName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    staffRole: { fontSize: 12, color: '#666' },
    advanceBadge: { alignItems: 'flex-end' },
    advanceLabel: { fontSize: 10, color: '#FF8C00', fontWeight: 'bold' },
    advanceAmount: { fontSize: 16, fontWeight: 'bold', color: '#FF8C00' },

    deductionTag: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', gap: 4, alignItems: 'center' },
    deductionLabel: { fontSize: 10, color: '#E65100' },
    deductionValue: { fontSize: 12, fontWeight: 'bold', color: '#E65100' },

    // Bottom Nav
    bottomNavContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 30, backgroundColor: 'transparent' },
    bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 30, paddingVertical: 15, paddingHorizontal: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, justifyContent: 'space-around' },
    navItem: { alignItems: 'center', justifyContent: 'center', gap: 4 },
    navText: { fontSize: 10, color: '#999', fontWeight: 'bold' },
    navTextActive: { color: '#20B2AA' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '85%', padding: 25, borderRadius: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 14, color: '#666', marginBottom: 10, fontWeight: 'bold' },
    langRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    langBtn: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    langBtnActive: { backgroundColor: '#20B2AA', borderColor: '#20B2AA' },
    langText: { fontWeight: 'bold', color: '#333', fontSize: 16 },
    langTextActive: { color: '#fff' },
    closeBtn: { padding: 15, alignItems: 'center' },
    closeBtnText: { color: '#666', fontWeight: 'bold', fontSize: 16 },

    fullScreenModal: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalHeaderTitle: { fontSize: 20, fontWeight: 'bold' },
    modalBody: { flex: 1, padding: 20 },
    modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
    generateBtn: { backgroundColor: '#20B2AA', padding: 18, borderRadius: 15, alignItems: 'center' },
    generateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

    typeRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
    typeBtn: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    typeBtnActive: { backgroundColor: '#20B2AA', borderColor: '#20B2AA' },
    typeText: { fontWeight: 'bold', color: '#333', fontSize: 16 },
    typeTextActive: { color: '#fff' },

    siteItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 15, borderWidth: 1, borderColor: '#eee', marginBottom: 10 },
    siteItemActive: { backgroundColor: '#20B2AA', borderColor: '#20B2AA' },
    siteText: { fontSize: 18, color: '#333' },
    siteTextActive: { color: '#fff', fontWeight: 'bold' }
});

export default BossScreen;


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'teal' | 'orange' | 'red' | 'gray';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color = 'teal' }) => {
    const colors = {
        teal: '#20B2AA',
        orange: '#FF8C00',
        red: '#FF4444',
        gray: '#666',
    };

    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.content}>
                <Text style={styles.value}>{value}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <View style={[styles.bar, { backgroundColor: colors[color] }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        flex: 1,
        margin: 4,
        minHeight: 100,
        justifyContent: 'space-between'
    },
    title: { fontSize: 10, fontWeight: 'bold', color: '#999', textTransform: 'uppercase' },
    content: { marginTop: 8 },
    value: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 10, color: '#999', marginTop: 4 },
    bar: { height: 4, width: '100%', marginTop: 12, borderRadius: 2, opacity: 0.2 }
});

export default StatCard;


import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera, RefreshCw } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (photoUrl: string) => void;
    location?: { lat: number; lng: number };
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture, location }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [facing, setFacing] = useState<'back' | 'front'>('back');
    const [address, setAddress] = useState<string | null>(null);

    useEffect(() => {
        if (location) {
            (async () => {
                try {
                    const [result] = await Location.reverseGeocodeAsync({
                        latitude: location.lat,
                        longitude: location.lng
                    });
                    if (result) {
                        const parts = [result.name, result.street, result.city].filter(Boolean);
                        setAddress(parts.join(', ') || "Unknown Location");
                    }
                } catch (e) {
                    console.log("Geocoding failed", e);
                    setAddress("Location Unavailable");
                }
            })();
        }
    }, [location]);

    if (!isOpen) return null;

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible={isOpen} animationType="slide">
                <View style={styles.container}>
                    <Text style={styles.message}>We need your permission to show the camera</Text>
                    <TouchableOpacity onPress={requestPermission} style={styles.button}>
                        <Text style={styles.text}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.text}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                // 1. Take picture (high quality)
                const photo = await cameraRef.current.takePictureAsync({ quality: 1.0, skipProcessing: true });
                
                if (photo?.uri) {
                    // 2. Convert to base64 without resizing or compression
                    const manipulated = await ImageManipulator.manipulateAsync(
                        photo.uri,
                        [], // No resize
                        { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                    );

                    if (manipulated.base64) {
                        onCapture(`data:image/jpeg;base64,${manipulated.base64}`);
                        onClose();
                    }
                }
            } catch (e) {
                console.error("Capture failed", e);
            }
        }
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    return (
        <Modal visible={isOpen} animationType="slide">
            <View style={styles.container}>
                <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                    <View style={styles.overlay}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                            {location && (
                                <View style={styles.locationBadge}>
                                    <Text style={styles.locationText}>
                                        {address || `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconButton}>
                                <RefreshCw size={24} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                                <View style={styles.captureInner} />
                            </TouchableOpacity>
                            <View style={{ width: 40 }} />
                        </View>
                    </View>
                </CameraView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', backgroundColor: '#000' },
    message: { textAlign: 'center', paddingBottom: 10, color: '#fff' },
    camera: { flex: 1 },
    button: { alignSelf: 'center', backgroundColor: '#20B2AA', padding: 10, borderRadius: 5, marginTop: 10 },
    closeButton: { alignSelf: 'center', marginTop: 20 },
    text: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'space-between' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },
    locationBadge: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 },
    locationText: { color: '#fff', fontSize: 10 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 30, paddingBottom: 50 },
    captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' }
});

export default CameraModal;

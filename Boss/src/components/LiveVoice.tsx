
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Dimensions } from 'react-native';
import { X, Mic, Square } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence, interpolate, useSharedValue } from 'react-native-reanimated';

interface LiveVoiceProps {
  onBack: () => void;
}

const { width } = Dimensions.get('window');

const LiveVoice: React.FC<LiveVoiceProps> = ({ onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Tap to Connect");
  const [isTalking, setIsTalking] = useState(false);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1500 }),
          withTiming(0.1, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0.1);
    }
  }, [isActive]);

  const orbGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isTalking ? withTiming(1.3) : scale.value }],
    opacity: isTalking ? withTiming(0.4) : opacity.value,
  }));

  const startSession = () => {
    setIsActive(true);
    setStatus("Listening...");
    // AI Connection Logic Placeholder
  };

  const stopSession = () => {
    setIsActive(false);
    setIsTalking(false);
    setStatus("Tap to Connect");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F9]">
      <View className="absolute inset-0 bg-white" />
      
      {/* Header */}
      <View className="px-6 py-6 flex-row justify-between items-center bg-white border-b border-white/50">
        <TouchableOpacity onPress={onBack} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 items-center justify-center">
           <X size={20} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold tracking-wide text-slate-800">AI Voice Mode</Text>
        <View className="w-10" />
      </View>

      {/* Main Visualizer Area */}
      <View className="flex-1 items-center justify-center">
        <View className="relative items-center justify-center">
          {/* Outer Glow */}
          <Animated.View 
            style={[{ position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#a855f7' }, orbGlowStyle]} 
          />
          
          {/* The Orb */}
          <View className="w-64 h-64 rounded-full overflow-hidden shadow-xl">
             <LinearGradient
               colors={['#a855f7', '#ec4899']}
               className="flex-1 items-center justify-center"
             >
                <View className="w-[240px] h-[240px] rounded-full bg-white/20 items-center justify-center border border-white/40">
                    <View className="flex-row items-center space-x-2">
                        {[1,2,3,4,5].map(i => (
                            <View 
                              key={i} 
                              className="w-3 mx-1 bg-white rounded-full" 
                              style={{ height: isTalking ? 60 : 12 }} 
                            />
                        ))}
                    </View>
                </View>
             </LinearGradient>
          </View>
        </View>

        <View className="mt-12 items-center">
            <Text className="text-2xl font-bold mb-2 text-slate-800">
                {isActive ? (isTalking ? "Ambe Boss is speaking..." : "I'm listening...") : "Hello, Hari Sir"}
            </Text>
            <Text className="text-slate-500 text-sm font-medium">{status}</Text>
        </View>
      </View>

      {/* Controls */}
      <View className="pb-32 items-center">
         <TouchableOpacity 
           onPress={isActive ? stopSession : startSession}
           className={`w-20 h-20 rounded-full items-center justify-center shadow-xl ${
               isActive 
                ? 'bg-white border-2 border-red-500' 
                : 'bg-purple-600'
           }`}
         >
             {isActive ? <Square size={30} color="#ef4444" /> : <Mic size={30} color="white" />}
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LiveVoice;

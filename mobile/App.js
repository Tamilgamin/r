import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Switch,
  TouchableOpacity,
  Animated,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Activity, Settings as SettingsIcon, BellRing, ArrowUp, ArrowDown, Music } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import mqtt from 'mqtt/dist/mqtt';
import Svg, { Circle } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const MQTT_URL = 'wss://57f9938c484c4f0f9ad4b79b70ae3bf7.s1.eu.hivemq.cloud:8884/mqtt';
const MQTT_TOPIC = 'incubator/temp';
const MQTT_USER = 'qqqqq';
const MQTT_PASS = 'Agash2008';

export default function App() {
  const [temp, setTemp] = useState('--');
  const [trend, setTrend] = useState('NONE'); 
  const [status, setStatus] = useState('NORMAL'); 
  const [connectionState, setConnectionState] = useState('Disconnected'); 
  
  const [highThreshold, setHighThreshold] = useState('38.0');
  const [lowThreshold, setLowThreshold] = useState('36.0');
  const [masterAlarm, setMasterAlarm] = useState(true);
  const [alarmDuration, setAlarmDuration] = useState('60');
  const [alarmSound, setAlarmSound] = useState('default');
  const [customSoundUri, setCustomSoundUri] = useState(null);
  const [activeTab, setActiveTab] = useState('monitor');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef(null);
  const alarmTimeoutRef = useRef(null);
  const clientRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') alert('Permission for notifications was denied');
    })();
    
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
    connectMqtt();
    return () => {
      if (clientRef.current) clientRef.current.end();
      stopAlarm();
    };
  }, []);

  const connectMqtt = () => {
    setConnectionState('Reconnecting');
    const client = mqtt.connect(MQTT_URL, {
      clientId: 'rn_incubator_' + Math.random().toString(16).substr(2, 8),
      username: MQTT_USER,
      password: MQTT_PASS,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      setConnectionState('Connected');
      client.subscribe(MQTT_TOPIC);
    });

    client.on('message', (topic, message) => {
      const newTempStr = message.toString();
      const newTemp = parseFloat(newTempStr);
      
      setTemp(old => {
        const oldTemp = parseFloat(old);
        if (!isNaN(oldTemp)) {
          if (newTemp > oldTemp) setTrend('RISING');
          else if (newTemp < oldTemp) setTrend('FALLING');
          else setTrend('NONE');
        }
        return newTemp.toFixed(1);
      });
      
      triggerPulse();
      checkAlarm(newTemp);
    });

    client.on('offline', () => setConnectionState('Disconnected'));
    client.on('error', () => setConnectionState('Disconnected'));
    clientRef.current = client;
  };

  const triggerPulse = () => {
    pulseAnim.setValue(1.1);
    Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const checkAlarm = async (currentTemp) => {
    const high = parseFloat(highThreshold);
    const low = parseFloat(lowThreshold);
    
    if (currentTemp > high) {
      setStatus('HIGH');
      if (masterAlarm) triggerAlarm('High Temperature Alert!', \`Temperature reached \${currentTemp}°C\`);
    } else if (currentTemp < low) {
      setStatus('LOW');
      if (masterAlarm) triggerAlarm('Low Temperature Alert!', \`Temperature dropped to \${currentTemp}°C\`);
    } else {
      setStatus('NORMAL');
      stopAlarm();
    }
  };

  const triggerAlarm = async (title, body) => {
    if (soundRef.current) return;
    
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
    
    try {
      let soundSource;
      if (alarmSound === 'custom' && customSoundUri) {
        soundSource = { uri: customSoundUri };
      } else {
        const soundUrl = alarmSound === 'siren' 
          ? 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg'
          : 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
        soundSource = { uri: soundUrl };
      }
        
      const { sound } = await Audio.Sound.createAsync(
        soundSource,
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
      
      const durationMs = parseInt(alarmDuration, 10) * 1000;
      if (durationMs > 0) {
        clearTimeout(alarmTimeoutRef.current);
        alarmTimeoutRef.current = setTimeout(stopAlarm, durationMs);
      }
    } catch (e) {
      console.log('Error playing sound', e);
    }
  };

  const stopAlarm = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    clearTimeout(alarmTimeoutRef.current);
  };

  const pickCustomSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled) {
        setCustomSoundUri(result.assets[0].uri);
        setAlarmSound('custom');
      }
    } catch (err) {
      console.log('Error picking document', err);
    }
  };

  const testAlarm = () => {
    triggerAlarm('Test Alarm', 'This is a test notification.');
    setTimeout(stopAlarm, 3000);
  };

  const switchTab = (tab) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();
    setTimeout(() => setActiveTab(tab), 150);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {activeTab === 'monitor' ? (
          <View style={styles.monitorContainer}>
            <View style={styles.statusHeader}>
              <View style={[styles.dot, { backgroundColor: connectionState === 'Connected' ? '#10b981' : connectionState === 'Reconnecting' ? '#f59e0b' : '#ef4444' }]} />
              <Text style={styles.statusText}>{connectionState}</Text>
            </View>
            
            <Animated.View style={[styles.circleContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Svg height="250" width="250" viewBox="0 0 250 250">
                <Circle cx="125" cy="125" r="110" stroke="#10b981" strokeWidth="4" fill="transparent" strokeDasharray="10 5" />
              </Svg>
              <View style={styles.tempWrapper}>
                <Text style={styles.tempText}>{temp}</Text>
                <Text style={styles.unitText}>°C</Text>
              </View>
            </Animated.View>
            
            <View style={styles.trendContainer}>
              {trend === 'RISING' && <><ArrowUp color="#ef4444" size={20} /><Text style={[styles.trendText, {color: '#ef4444'}]}>RISING</Text></>}
              {trend === 'FALLING' && <><ArrowDown color="#3b82f6" size={20} /><Text style={[styles.trendText, {color: '#3b82f6'}]}>FALLING</Text></>}
            </View>

            <View style={[styles.badge, 
              status === 'NORMAL' ? {backgroundColor: '#10b98120', borderColor: '#10b981'} : 
              status === 'HIGH' ? {backgroundColor: '#ef444420', borderColor: '#ef4444'} : 
              {backgroundColor: '#3b82f620', borderColor: '#3b82f6'}
            ]}>
              <Text style={[styles.badgeText, 
                status === 'NORMAL' ? {color: '#10b981'} : 
                status === 'HIGH' ? {color: '#ef4444'} : 
                {color: '#3b82f6'}
              ]}>{status}</Text>
            </View>
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>Settings</Text>
            
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Master Alarm</Text>
                <Switch 
                  value={masterAlarm} 
                  onValueChange={setMasterAlarm} 
                  trackColor={{ false: '#3f3f46', true: '#10b981' }} 
                  thumbColor={'#fff'} 
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Thresholds (°C)</Text>
              <View style={styles.inputRow}>
                <Text style={styles.label}>High limit</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={highThreshold} onChangeText={setHighThreshold} />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.label}>Low limit</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={lowThreshold} onChangeText={setLowThreshold} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Alarm Behavior</Text>
              <View style={styles.inputRow}>
                <Text style={styles.label}>Auto-mute (sec)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={alarmDuration} onChangeText={setAlarmDuration} />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.label}>Sound Style</Text>
                <View style={styles.soundOptions}>
                  {['default', 'siren', 'custom'].map(snd => (
                    <TouchableOpacity key={snd} onPress={() => snd === 'custom' ? pickCustomSound() : setAlarmSound(snd)} style={[styles.soundBtn, alarmSound === snd && styles.soundBtnActive]}>
                      {snd === 'custom' ? <Music color="#fff" size={12} /> : <Text style={styles.soundBtnText}>{snd}</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {alarmSound === 'custom' && customSoundUri && (
                <Text style={styles.customPathText} numberOfLines={1}>Selected: {customSoundUri.split('/').pop()}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.testBtn} onPress={testAlarm}>
              <BellRing color="#fff" size={20} style={{marginRight: 8}} />
              <Text style={styles.testBtnText}>Test Alarm</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        )}
      </Animated.View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => switchTab('monitor')}>
          <Activity color={activeTab === 'monitor' ? '#10b981' : '#71717a'} size={28} />
          <Text style={[styles.navText, { color: activeTab === 'monitor' ? '#10b981' : '#71717a' }]}>Monitor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => switchTab('settings')}>
          <SettingsIcon color={activeTab === 'settings' ? '#10b981' : '#71717a'} size={28} />
          <Text style={[styles.navText, { color: activeTab === 'settings' ? '#10b981' : '#71717a' }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  content: { flex: 1, paddingTop: 60 },
  monitorContainer: { flex: 1, alignItems: 'center' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { color: '#a1a1aa', fontSize: 14, fontWeight: '600' },
  circleContainer: { justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  tempWrapper: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-start' },
  tempText: { fontSize: 72, fontWeight: '200', color: '#fff' },
  unitText: { fontSize: 24, color: '#a1a1aa', marginTop: 12, marginLeft: 4 },
  trendContainer: { flexDirection: 'row', alignItems: 'center', height: 30, marginBottom: 20 },
  trendText: { fontSize: 14, fontWeight: 'bold', marginLeft: 6, letterSpacing: 1 },
  badge: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 24, borderWidth: 1 },
  badgeText: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  settingsContainer: { flex: 1, paddingHorizontal: 20 },
  settingsTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  card: { backgroundColor: '#18181b', borderRadius: 20, padding: 20, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#10b981', fontSize: 14, fontWeight: 'bold', marginBottom: 16, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { color: '#e4e4e7', fontSize: 16 },
  input: { backgroundColor: '#27272a', color: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, width: 80, textAlign: 'center' },
  soundOptions: { flexDirection: 'row', gap: 8 },
  soundBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#27272a', minWidth: 60, alignItems: 'center', justifyContent: 'center' },
  soundBtnActive: { backgroundColor: '#10b981' },
  soundBtnText: { color: '#fff', fontSize: 12 },
  customPathText: { color: '#71717a', fontSize: 10, marginTop: 8, textAlign: 'right' },
  testBtn: { backgroundColor: '#3f3f46', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 10 },
  testBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#18181b', paddingBottom: 30, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#27272a' },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 12, marginTop: 4, fontWeight: '500' }
});
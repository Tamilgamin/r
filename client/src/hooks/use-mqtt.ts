import { useState, useEffect, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';

export type ConnectionStatus = 'Connecting' | 'Connected' | 'Reconnecting' | 'Disconnected';
export type Trend = 'RISING' | 'FALLING' | 'STABLE';

export function useMqtt() {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('Connecting');
  const [trend, setTrend] = useState<Trend>('STABLE');
  const prevTemp = useRef<number | null>(null);
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    // Connect to HiveMQ Cloud WebSocket endpoint
    const url = 'wss://57f9938c484c4f0f9ad4b79b70ae3bf7.s1.eu.hivemq.cloud:8884/mqtt';
    
    try {
      const client = mqtt.connect(url, {
        username: 'qqqqq',
        password: 'Agash2008',
        reconnectPeriod: 5000,
        connectTimeout: 4000,
        keepalive: 30,
      });
      
      clientRef.current = client;

      client.on('connect', () => {
        setStatus('Connected');
        client.subscribe('incubator/temp', (err) => {
          if (err) console.error("Failed to subscribe:", err);
        });
      });

      client.on('reconnect', () => setStatus('Reconnecting'));
      client.on('close', () => setStatus('Disconnected'));
      client.on('offline', () => setStatus('Disconnected'));
      client.on('error', (err) => {
        console.error("MQTT Error:", err);
        setStatus('Disconnected');
      });

      client.on('message', (topic, message) => {
        if (topic === 'incubator/temp') {
          const val = parseFloat(message.toString());
          if (!isNaN(val)) {
            setTemperature((current) => {
              if (current !== null) {
                if (val > current) setTrend('RISING');
                else if (val < current) setTrend('FALLING');
                else setTrend('STABLE');
              }
              return val;
            });
          }
        }
      });
    } catch (err) {
      console.error("MQTT Initialization Error:", err);
      setStatus('Disconnected');
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  return { temperature, status, trend };
}

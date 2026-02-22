## Packages
mqtt | Required to connect to the WSS broker for live incubator data
framer-motion | Required for smooth temperature pulsing and layout animations
react-hook-form | Required for settings form state management
@hookform/resolvers | Required for zod validation in settings form
lucide-react | Required for dashboard and UI icons

## Notes
- Web Audio API is used to synthesize alarms to avoid external media dependencies. Browsers may require user interaction to allow audio playback.
- The MQTT connection uses the provided HiveMQ Cloud endpoint. Without credentials, if the cluster requires auth, it might disconnect. Ensure the UI gracefully handles the "Disconnected / Reconnecting" states.
- The settings schema uses strings for thresholds as per the backend, but the frontend will validate them as parsable numbers.

import { useMqtt } from "@/hooks/use-mqtt";
import { useSettings } from "@/hooks/use-settings";
import { useAlarm } from "@/hooks/use-alarm";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Minus, Volume2, VolumeX } from "lucide-react";
import { useMemo } from "react";

export default function Dashboard() {
  const { temperature, status, trend } = useMqtt();
  const { data: settings } = useSettings();

  // Parse thresholds safely
  const highThreshold = parseFloat(settings?.highThreshold || "38.0");
  const lowThreshold = parseFloat(settings?.lowThreshold || "36.0");

  const isHigh = temperature !== null && temperature >= highThreshold;
  const isLow = temperature !== null && temperature <= lowThreshold;
  const isAlarming = isHigh || isLow;

  // Audio Hook
  const { initAudio, audioEnabled } = useAlarm(
    isAlarming && (settings?.masterAlarm ?? true),
    settings?.alarmSound || 'default'
  );

  const getStatusColor = () => {
    if (status !== 'Connected') return 'text-muted-foreground';
    if (isHigh) return 'text-destructive text-glow-red';
    if (isLow) return 'text-info text-glow-blue';
    return 'text-primary text-glow';
  };

  const getRingColor = () => {
    if (status !== 'Connected') return 'border-muted';
    if (isHigh) return 'border-destructive shadow-[0_0_50px_rgba(239,68,68,0.3)]';
    if (isLow) return 'border-info shadow-[0_0_50px_rgba(59,130,246,0.3)]';
    return 'border-primary shadow-[0_0_50px_rgba(16,185,129,0.3)]';
  };

  const trendIcon = useMemo(() => {
    switch (trend) {
      case 'RISING': return <ArrowUp className="w-6 h-6 text-destructive" />;
      case 'FALLING': return <ArrowDown className="w-6 h-6 text-info" />;
      default: return <Minus className="w-6 h-6 text-muted-foreground" />;
    }
  }, [trend]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Pulse Effect for Alarm */}
      <AnimatePresence>
        {isAlarming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`absolute inset-0 pointer-events-none ${isHigh ? 'bg-destructive' : 'bg-info'}`}
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-4xl flex justify-between items-center mb-12 relative z-10">
        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            {status === 'Connected' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              status === 'Connected' ? 'bg-primary' : 
              status === 'Connecting' || status === 'Reconnecting' ? 'bg-warning animate-pulse' : 
              'bg-destructive'
            }`}></span>
          </div>
          <span className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
            {status}
          </span>
        </div>

        <button 
          onClick={initAudio}
          className={`glass-panel px-4 py-2 rounded-full flex items-center gap-2 transition-all hover:bg-white/10 ${audioEnabled ? 'text-primary' : 'text-muted-foreground'}`}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-sm font-medium">{audioEnabled ? 'Audio Ready' : 'Enable Audio'}</span>
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Main Temperature Dial */}
        <motion.div 
          className={`w-72 h-72 md:w-[28rem] md:h-[28rem] rounded-full border-4 flex items-center justify-center relative transition-all duration-700 bg-background/50 backdrop-blur-sm ${getRingColor()}`}
          animate={status === 'Connected' ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          {/* Inner details */}
          <div className="absolute top-12 flex items-center gap-2 text-muted-foreground">
            {trendIcon}
            <span className="text-sm font-bold tracking-widest">{trend}</span>
          </div>

          <div className="flex items-start">
            <span className={`font-display font-thin text-7xl md:text-[10rem] tracking-tighter tabular-nums transition-colors duration-500 ${getStatusColor()}`}>
              {temperature !== null ? temperature.toFixed(1) : '--.-'}
            </span>
            <span className={`font-display font-light text-3xl md:text-5xl mt-4 md:mt-8 ml-2 ${getStatusColor()}`}>
              °C
            </span>
          </div>

          <div className="absolute bottom-16 flex justify-center w-full">
            {status === 'Connected' && (
              <div className={`px-6 py-2 rounded-full border border-white/10 flex items-center gap-2 backdrop-blur-md ${
                isHigh ? 'bg-destructive/20 text-destructive' : 
                isLow ? 'bg-info/20 text-info' : 
                'bg-primary/20 text-primary'
              }`}>
                {isAlarming ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span className="text-sm font-bold tracking-widest uppercase">
                  {isHigh ? 'HIGH TEMP' : isLow ? 'LOW TEMP' : 'NORMAL'}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      <div className="mt-16 grid grid-cols-2 gap-8 w-full max-w-lg z-10">
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center">
          <span className="text-muted-foreground text-sm font-medium mb-1 uppercase tracking-widest">Low Limit</span>
          <span className="text-3xl font-display font-light text-white">{settings?.lowThreshold || '--'}°</span>
        </div>
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center text-center">
          <span className="text-muted-foreground text-sm font-medium mb-1 uppercase tracking-widest">High Limit</span>
          <span className="text-3xl font-display font-light text-white">{settings?.highThreshold || '--'}°</span>
        </div>
      </div>

    </div>
  );
}

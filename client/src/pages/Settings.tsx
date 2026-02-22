import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useEffect } from "react";
import { Bell, Save, Sliders, Volume2 } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  lowThreshold: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number"),
  highThreshold: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid number"),
  masterAlarm: z.boolean(),
  alarmDuration: z.string().regex(/^\d+$/, "Must be an integer"),
  alarmSound: z.enum(["default", "pulse", "siren", "custom"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lowThreshold: "36.0",
      highThreshold: "38.0",
      masterAlarm: true,
      alarmDuration: "60",
      alarmSound: "default",
    }
  });

  useEffect(() => {
    if (settings) {
      reset({
        lowThreshold: settings.lowThreshold,
        highThreshold: settings.highThreshold,
        masterAlarm: settings.masterAlarm,
        alarmDuration: settings.alarmDuration,
        alarmSound: settings.alarmSound as any,
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: FormValues) => {
    updateSettings.mutate(data);
  };

  const isMasterAlarmOn = watch("masterAlarm");
  const selectedSound = watch("alarmSound");

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-10">
          <h1 className="text-4xl font-display text-white mb-2">System Settings</h1>
          <p className="text-muted-foreground">Configure incubator thresholds and alarm behaviors.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Thresholds Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 rounded-3xl col-span-1 md:col-span-2"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <Sliders className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-medium text-white">Temperature Thresholds</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Low Limit (°C)</label>
                  <input
                    {...register("lowThreshold")}
                    className="w-full bg-background border-2 border-white/10 rounded-2xl px-6 py-4 text-2xl font-display text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                  {errors.lowThreshold && <p className="text-destructive text-sm mt-2">{errors.lowThreshold.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">High Limit (°C)</label>
                  <input
                    {...register("highThreshold")}
                    className="w-full bg-background border-2 border-white/10 rounded-2xl px-6 py-4 text-2xl font-display text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                  {errors.highThreshold && <p className="text-destructive text-sm mt-2">{errors.highThreshold.message}</p>}
                </div>
              </div>
            </motion.div>

            {/* Alarm Configuration */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-8 rounded-3xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <Bell className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-medium text-white">Alarm Control</h2>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div>
                    <p className="font-medium text-white">Master Alarm</p>
                    <p className="text-sm text-muted-foreground">Enable or disable all audio alarms.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue("masterAlarm", !isMasterAlarmOn, { shouldDirty: true })}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ${
                      isMasterAlarmOn ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                        isMasterAlarmOn ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Auto-Silence Duration (Seconds)</label>
                  <input
                    {...register("alarmDuration")}
                    className="w-full bg-background border-2 border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.alarmDuration && <p className="text-destructive text-sm mt-2">{errors.alarmDuration.message}</p>}
                </div>
              </div>
            </motion.div>

            {/* Sound Profile */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-8 rounded-3xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <Volume2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-medium text-white">Sound Profile</h2>
              </div>

              <div className="space-y-4">
                {(['default', 'pulse', 'siren', 'custom'] as const).map((sound) => (
                  <button
                    key={sound}
                    type="button"
                    onClick={() => setValue("alarmSound", sound, { shouldDirty: true })}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      selectedSound === sound 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-transparent bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="capitalize font-medium">{sound}</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedSound === sound ? 'border-primary' : 'border-muted-foreground'}`}>
                      {selectedSound === sound && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

          </div>

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={updateSettings.isPending}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-emerald-500 hover:from-emerald-400 hover:to-emerald-600 text-white rounded-2xl font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
            >
              <Save className="w-5 h-5" />
              {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

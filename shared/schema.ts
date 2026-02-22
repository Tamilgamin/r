import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  highThreshold: text("high_threshold").notNull().default("38.0"),
  lowThreshold: text("low_threshold").notNull().default("36.0"),
  masterAlarm: boolean("master_alarm").notNull().default(true),
  alarmDuration: text("alarm_duration").notNull().default("60"),
  alarmSound: text("alarm_sound").notNull().default("default"),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

import { settings, type Settings, type InsertSettings } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getSettings(): Promise<Settings>;
  updateSettings(updates: Partial<InsertSettings>): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  async getSettings(): Promise<Settings> {
    const [setting] = await db.select().from(settings);
    if (!setting) {
      const [newSetting] = await db.insert(settings).values({}).returning();
      return newSetting;
    }
    return setting;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    const current = await this.getSettings();
    const [updated] = await db
      .update(settings)
      .set(updates)
      .where(eq(settings.id, current.id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
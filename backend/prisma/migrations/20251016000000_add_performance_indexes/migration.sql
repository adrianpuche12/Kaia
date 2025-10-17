-- AlterTable - Add Performance Indexes
-- Migration: add_performance_indexes
-- Date: 2025-10-16
-- Description: Add composite indexes to optimize common query patterns

-- Events table indexes
CREATE INDEX IF NOT EXISTS "events_userId_startTime_idx" ON "events"("userId", "startTime");
CREATE INDEX IF NOT EXISTS "events_userId_type_idx" ON "events"("userId", "type");
CREATE INDEX IF NOT EXISTS "events_userId_completed_idx" ON "events"("userId", "completed");
CREATE INDEX IF NOT EXISTS "events_userId_canceled_idx" ON "events"("userId", "canceled");

-- Reminders table indexes
CREATE INDEX IF NOT EXISTS "reminders_userId_remindAt_idx" ON "reminders"("userId", "remindAt");
CREATE INDEX IF NOT EXISTS "reminders_userId_sent_idx" ON "reminders"("userId", "sent");

-- Alarms table indexes
CREATE INDEX IF NOT EXISTS "alarms_userId_enabled_idx" ON "alarms"("userId", "enabled");

-- MCPs table indexes
CREATE INDEX IF NOT EXISTS "mcps_enabled_public_idx" ON "mcps"("enabled", "public");
CREATE INDEX IF NOT EXISTS "mcps_type_category_idx" ON "mcps"("type", "category");

-- Messages table indexes
CREATE INDEX IF NOT EXISTS "messages_userId_contactId_idx" ON "messages"("userId", "contactId");
CREATE INDEX IF NOT EXISTS "messages_userId_platform_idx" ON "messages"("userId", "platform");
CREATE INDEX IF NOT EXISTS "messages_userId_read_idx" ON "messages"("userId", "read");
CREATE INDEX IF NOT EXISTS "messages_userId_createdAt_idx" ON "messages"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "messages_threadId_idx" ON "messages"("threadId");

-- Contacts table indexes
CREATE INDEX IF NOT EXISTS "contacts_userId_lastContactAt_idx" ON "contacts"("userId", "lastContactAt");

-- LocationLog table indexes
CREATE INDEX IF NOT EXISTS "location_logs_userId_createdAt_idx" ON "location_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "location_logs_eventId_idx" ON "location_logs"("eventId");

-- Places table indexes
CREATE INDEX IF NOT EXISTS "places_userId_visitCount_idx" ON "places"("userId", "visitCount");
CREATE INDEX IF NOT EXISTS "places_placeId_idx" ON "places"("placeId");

-- VoiceSession table indexes
CREATE INDEX IF NOT EXISTS "voice_sessions_userId_createdAt_idx" ON "voice_sessions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "voice_sessions_userId_successful_idx" ON "voice_sessions"("userId", "successful");

-- AppUsageLog table indexes
CREATE INDEX IF NOT EXISTS "app_usage_logs_userId_createdAt_idx" ON "app_usage_logs"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "app_usage_logs_userId_action_idx" ON "app_usage_logs"("userId", "action");

/*
  Warnings:

  - You are about to drop the column `isAllDay` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `isRecurring` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `minutesBefore` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `wasSent` on the `reminders` table. All the data in the column will be lost.
  - You are about to drop the column `preferredLanguage` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `reminderMinutesBefore` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `speechRate` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `resultEventId` on the `voice_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `transcription` on the `voice_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `wasProcessed` on the `voice_sessions` table. All the data in the column will be lost.
  - Added the required column `remindAt` to the `reminders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `reminders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `reminders` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `transcript` to the `voice_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "alarms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "label" TEXT,
    "time" TEXT NOT NULL,
    "daysActive" TEXT NOT NULL,
    "soundType" TEXT NOT NULL DEFAULT 'DEFAULT',
    "musicId" TEXT,
    "musicName" TEXT,
    "musicUrl" TEXT,
    "wakeMessage" TEXT,
    "readAgenda" BOOLEAN NOT NULL DEFAULT true,
    "vibration" BOOLEAN NOT NULL DEFAULT true,
    "snooze" BOOLEAN NOT NULL DEFAULT true,
    "snoozeTime" INTEGER NOT NULL DEFAULT 5,
    "maxSnoozes" INTEGER NOT NULL DEFAULT 3,
    "gradualVolume" BOOLEAN NOT NULL DEFAULT true,
    "volumeStart" INTEGER NOT NULL DEFAULT 30,
    "volumeEnd" INTEGER NOT NULL DEFAULT 70,
    "volumeDuration" INTEGER NOT NULL DEFAULT 60,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggered" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "alarms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mcps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "capabilities" TEXT NOT NULL,
    "inputSchema" TEXT NOT NULL,
    "outputSchema" TEXT NOT NULL,
    "executorCode" TEXT NOT NULL,
    "executorType" TEXT NOT NULL DEFAULT 'inline',
    "config" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "avgExecutionTimeMs" INTEGER,
    "rating" REAL,
    "generatedBy" TEXT,
    "prompt" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mcp_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mcpId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputData" TEXT NOT NULL,
    "outputData" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "executionTimeMs" INTEGER,
    "userFeedback" TEXT,
    "feedbackComment" TEXT,
    "triggeredBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mcp_executions_mcpId_fkey" FOREIGN KEY ("mcpId") REFERENCES "mcps" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mcp_executions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subject" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "externalId" TEXT,
    "errorMessage" TEXT,
    "threadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "phoneNumbers" TEXT NOT NULL DEFAULT '[]',
    "emails" TEXT NOT NULL DEFAULT '[]',
    "avatarUrl" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastContactAt" DATETIME,
    "hasWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" DATETIME,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "location_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "accuracy" REAL,
    "altitude" REAL,
    "speed" REAL,
    "eventId" TEXT,
    "action" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "location_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "location_logs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "placeId" TEXT,
    "placeType" TEXT,
    "openingHours" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "rating" REAL,
    "priceLevel" INTEGER,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" DATETIME,
    "lastFetchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "places_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "app_usage_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "screen" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT,
    "location" TEXT,
    "placeId" TEXT,
    "participants" TEXT NOT NULL DEFAULT '',
    "createdVia" TEXT NOT NULL DEFAULT 'VOICE',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "canceled" BOOLEAN NOT NULL DEFAULT false,
    "externalId" TEXT,
    "externalSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "events_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_events" ("createdAt", "description", "endTime", "id", "location", "startTime", "title", "updatedAt", "userId") SELECT "createdAt", "description", "endTime", "id", "location", "startTime", "title", "updatedAt", "userId" FROM "events";
DROP TABLE "events";
ALTER TABLE "new_events" RENAME TO "events";
CREATE TABLE "new_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "remindAt" DATETIME NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'PUSH',
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "snoozed" BOOLEAN NOT NULL DEFAULT false,
    "snoozeUntil" DATETIME,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_reminders" ("createdAt", "eventId", "id", "updatedAt") SELECT "createdAt", "eventId", "id", "updatedAt" FROM "reminders";
DROP TABLE "reminders";
ALTER TABLE "new_reminders" RENAME TO "reminders";
CREATE TABLE "new_user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "voiceGender" TEXT NOT NULL DEFAULT 'FEMALE',
    "voiceSpeed" REAL NOT NULL DEFAULT 1.0,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "proactiveAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lateWarningsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultAlarmTone" TEXT,
    "snoozeMinutes" INTEGER NOT NULL DEFAULT 5,
    "gradualVolumeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'es',
    "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "timeFormat" TEXT NOT NULL DEFAULT '24h',
    "requireConfirmationBeforeSending" BOOLEAN NOT NULL DEFAULT true,
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "readReceiptsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "locationTrackingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "geofencingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "proximityThresholdMeters" INTEGER NOT NULL DEFAULT 500,
    "allowDynamicMCPs" BOOLEAN NOT NULL DEFAULT true,
    "mcpWhitelistedDomains" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_preferences" ("createdAt", "id", "updatedAt", "userId", "voiceEnabled") SELECT "createdAt", "id", "updatedAt", "userId", "voiceEnabled" FROM "user_preferences";
DROP TABLE "user_preferences";
ALTER TABLE "new_user_preferences" RENAME TO "user_preferences";
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "lastName" TEXT,
    "birthDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name", "password", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE TABLE "new_voice_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "intent" TEXT,
    "entities" TEXT,
    "response" TEXT,
    "confidence" REAL,
    "successful" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "previousSessionId" TEXT,
    "contextData" TEXT,
    "audioUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "voice_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_voice_sessions" ("audioUrl", "createdAt", "entities", "id", "intent", "userId") SELECT "audioUrl", "createdAt", "entities", "id", "intent", "userId" FROM "voice_sessions";
DROP TABLE "voice_sessions";
ALTER TABLE "new_voice_sessions" RENAME TO "voice_sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "places_placeId_key" ON "places"("placeId");

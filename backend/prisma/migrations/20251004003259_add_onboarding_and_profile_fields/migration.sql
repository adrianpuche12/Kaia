-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "interests" TEXT NOT NULL DEFAULT '[]',
    "favoriteCategories" TEXT NOT NULL DEFAULT '[]',
    "customPreferences" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_preferences" ("allowDynamicMCPs", "autoReplyEnabled", "createdAt", "dateFormat", "defaultAlarmTone", "emailEnabled", "geofencingEnabled", "gradualVolumeEnabled", "id", "language", "lateWarningsEnabled", "locationTrackingEnabled", "mcpWhitelistedDomains", "proactiveAlertsEnabled", "proximityThresholdMeters", "pushEnabled", "readReceiptsEnabled", "requireConfirmationBeforeSending", "smsEnabled", "snoozeMinutes", "timeFormat", "timezone", "updatedAt", "userId", "voiceEnabled", "voiceGender", "voiceSpeed") SELECT "allowDynamicMCPs", "autoReplyEnabled", "createdAt", "dateFormat", "defaultAlarmTone", "emailEnabled", "geofencingEnabled", "gradualVolumeEnabled", "id", "language", "lateWarningsEnabled", "locationTrackingEnabled", "mcpWhitelistedDomains", "proactiveAlertsEnabled", "proximityThresholdMeters", "pushEnabled", "readReceiptsEnabled", "requireConfirmationBeforeSending", "smsEnabled", "snoozeMinutes", "timeFormat", "timezone", "updatedAt", "userId", "voiceEnabled", "voiceGender", "voiceSpeed" FROM "user_preferences";
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
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "avatar" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("birthDate", "createdAt", "email", "id", "lastName", "name", "password", "phone", "updatedAt") SELECT "birthDate", "createdAt", "email", "id", "lastName", "name", "password", "phone", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

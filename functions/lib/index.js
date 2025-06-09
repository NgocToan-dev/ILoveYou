"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCoupleReminderNotification = exports.sendReminderNotification = exports.sendTestNotification = exports.updateFCMToken = exports.handleRecurringReminders = exports.checkPeacefulDaysMilestones = exports.cleanupOldReminders = exports.scheduleReminderCheck = void 0;
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin SDK
(0, app_1.initializeApp)();
// Import notification modules
const reminderScheduler_1 = require("./notifications/reminderScheduler");
Object.defineProperty(exports, "scheduleReminderCheck", { enumerable: true, get: function () { return reminderScheduler_1.scheduleReminderCheck; } });
Object.defineProperty(exports, "cleanupOldReminders", { enumerable: true, get: function () { return reminderScheduler_1.cleanupOldReminders; } });
Object.defineProperty(exports, "checkPeacefulDaysMilestones", { enumerable: true, get: function () { return reminderScheduler_1.checkPeacefulDaysMilestones; } });
Object.defineProperty(exports, "handleRecurringReminders", { enumerable: true, get: function () { return reminderScheduler_1.handleRecurringReminders; } });
const fcmManager_1 = require("./notifications/fcmManager");
Object.defineProperty(exports, "updateFCMToken", { enumerable: true, get: function () { return fcmManager_1.updateFCMToken; } });
Object.defineProperty(exports, "sendTestNotification", { enumerable: true, get: function () { return fcmManager_1.sendTestNotification; } });
Object.defineProperty(exports, "sendReminderNotification", { enumerable: true, get: function () { return fcmManager_1.sendReminderNotification; } });
Object.defineProperty(exports, "sendCoupleReminderNotification", { enumerable: true, get: function () { return fcmManager_1.sendCoupleReminderNotification; } });
//# sourceMappingURL=index.js.map
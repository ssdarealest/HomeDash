package com.homedash.app

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.content.Intent
import android.os.Bundle

class NotificationListenerServiceImpl : NotificationListenerService() {
    companion object {
        const val ACTION_NOTIFICATION_POSTED = "com.homedash.app.NOTIFICATION_POSTED"
        const val EXTRA_PACKAGE_NAME = "package_name"
        const val EXTRA_TITLE = "title"
        const val EXTRA_TEXT = "text"
        const val EXTRA_TIMESTAMP = "timestamp"
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val extras: Bundle? = sbn.notification.extras
        val title = extras?.getString("android.title") ?: ""
        val text = extras?.getCharSequence("android.text")?.toString() ?: ""

        val intent = Intent(ACTION_NOTIFICATION_POSTED).apply {
            putExtra(EXTRA_PACKAGE_NAME, sbn.packageName)
            putExtra(EXTRA_TITLE, title)
            putExtra(EXTRA_TEXT, text)
            putExtra(EXTRA_TIMESTAMP, sbn.postTime)
        }
        sendBroadcast(intent)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        super.onNotificationRemoved(sbn)
    }
}

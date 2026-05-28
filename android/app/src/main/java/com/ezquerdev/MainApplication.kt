package com.ezquerdev

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.preference.PreferenceManager
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  companion object {
    const val NOTIFICATION_CHANNEL_ID = "ezquerdev_default"
    private const val DEBUG_SERVER_HOST = "localhost:8081"
    private const val PREFS_DEBUG_SERVER_HOST_KEY = "debug_http_host"
  }

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    createDefaultNotificationChannel()
    if (BuildConfig.DEBUG) {
      // 10.0.2.2:8081 often fails on Windows emulators (black screen). Use adb reverse + localhost.
      PreferenceManager.getDefaultSharedPreferences(this)
        .edit()
        .putString(PREFS_DEBUG_SERVER_HOST_KEY, DEBUG_SERVER_HOST)
        .apply()
    }
    loadReactNative(this)
  }

  private fun createDefaultNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val channel =
      NotificationChannel(
        NOTIFICATION_CHANNEL_ID,
        getString(R.string.default_notification_channel_name),
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = getString(R.string.default_notification_channel_description)
        enableVibration(true)
      }

    val notificationManager = getSystemService(NotificationManager::class.java)
    notificationManager?.createNotificationChannel(channel)
  }
}

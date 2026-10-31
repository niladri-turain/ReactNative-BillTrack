package com.billtrack

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.auth.api.phone.SmsRetriever
import com.google.android.gms.common.api.CommonStatusCodes
import com.google.android.gms.common.api.Status

class SmsUserConsentModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {
  private val requestCode = 4817
  private var receiverRegistered = false

  private val smsReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action != SmsRetriever.SMS_RETRIEVED_ACTION) return

      val status = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        intent.getParcelableExtra(SmsRetriever.EXTRA_STATUS, Status::class.java)
      } else {
        @Suppress("DEPRECATION")
        intent.getParcelableExtra(SmsRetriever.EXTRA_STATUS) as? Status
      } ?: return

      when (status.statusCode) {
        CommonStatusCodes.SUCCESS -> {
          val consentIntent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(SmsRetriever.EXTRA_CONSENT_INTENT, Intent::class.java)
          } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(SmsRetriever.EXTRA_CONSENT_INTENT) as? Intent
          }

          val activity = currentActivity
          if (consentIntent != null && activity != null) {
            activity.startActivityForResult(consentIntent, requestCode)
          } else {
            stopListeningInternal()
          }
        }
        CommonStatusCodes.TIMEOUT -> stopListeningInternal()
      }
    }
  }

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName() = "SmsUserConsent"

  @ReactMethod
  fun startListening(promise: Promise) {
    try {
      registerSmsReceiver()
      SmsRetriever.getClient(reactContext)
        .startSmsUserConsent(null)
        .addOnSuccessListener { promise.resolve(true) }
        .addOnFailureListener { error ->
          stopListeningInternal()
          promise.reject("SMS_CONSENT_START_FAILED", error)
        }
    } catch (error: Exception) {
      stopListeningInternal()
      promise.reject("SMS_CONSENT_START_FAILED", error)
    }
  }

  @ReactMethod
  fun stopListening(promise: Promise) {
    stopListeningInternal()
    promise.resolve(true)
  }

  @ReactMethod
  fun addListener(eventName: String) = Unit

  @ReactMethod
  fun removeListeners(count: Int) = Unit

  private fun registerSmsReceiver() {
    if (receiverRegistered) return

    val filter = IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      reactContext.registerReceiver(
        smsReceiver,
        filter,
        SmsRetriever.SEND_PERMISSION,
        null,
        Context.RECEIVER_EXPORTED,
      )
    } else {
      @Suppress("DEPRECATION")
      reactContext.registerReceiver(smsReceiver, filter, SmsRetriever.SEND_PERMISSION, null)
    }
    receiverRegistered = true
  }

  private fun stopListeningInternal() {
    if (!receiverRegistered) return
    try {
      reactContext.unregisterReceiver(smsReceiver)
    } catch (_: IllegalArgumentException) {
      // The receiver may already have been unregistered by Android.
    }
    receiverRegistered = false
  }

  private fun emitSmsMessage(message: String) {
    val params = Arguments.createMap().apply { putString("message", message) }
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit("SmsUserConsentMessage", params)
  }

  override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != this.requestCode) return

    if (resultCode == Activity.RESULT_OK) {
      data?.getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE)?.let(::emitSmsMessage)
    }
    stopListeningInternal()
  }

  override fun onNewIntent(intent: Intent?) = Unit
}

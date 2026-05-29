import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show Platform;

/// Konfigurasi API terpusat.
/// Ubah [productionBaseUrl] ke URL backend yang sedang aktif di production.
class ApiConfig {
  // ─── URL Production (Cloud Run / Server) ───────────────────────────────────
  static const String productionBaseUrl =
      'https://be-admin-concert-940358634558.us-central1.run.app/api/v1';

  // ─── URL Lokal untuk development ───────────────────────────────────────────
  // Android emulator  : 10.0.2.2  (loopback ke PC host)
  // iOS simulator     : 127.0.0.1
  // Physical device   : IP LAN PC kamu, misalnya 192.168.1.100
  static const String _localPort = '5000'; // sesuai PORT di backend .env
  static const String _physicalDeviceIp = '192.168.1.100'; // ← ganti IP LAN kamu

  static String get _localBaseUrl {
    if (kIsWeb) return 'http://localhost:$_localPort/api/v1';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:$_localPort/api/v1';
      if (Platform.isIOS) return 'http://127.0.0.1:$_localPort/api/v1';
    } catch (_) {}
    // fallback: pakai IP LAN untuk physical device
    return 'http://$_physicalDeviceIp:$_localPort/api/v1';
  }

  // ─── Mode ──────────────────────────────────────────────────────────────────
  /// Set ke [true] untuk pakai server production, [false] untuk development lokal.
  static const bool useProduction = true;

  /// Base URL yang dipakai seluruh aplikasi
  static String get baseUrl =>
      useProduction ? productionBaseUrl : _localBaseUrl;

  // ─── Endpoint helpers ──────────────────────────────────────────────────────
  static String get authLogin => '$baseUrl/auth/login';
  static String get authRegister => '$baseUrl/auth/register';
  static String get authLogout => '$baseUrl/auth/logout';
  static String get events => '$baseUrl/events';
  static String get orders => '$baseUrl/orders';
  static String get tickets => '$baseUrl/tickets';
  static String eventTickets(dynamic eventId) =>
      '$baseUrl/tickets/event/$eventId';
}

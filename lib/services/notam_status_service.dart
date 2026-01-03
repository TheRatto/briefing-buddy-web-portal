import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/notam.dart';

/// Service to manage NOTAM hide/flag status persistence
class NotamStatusService {
  static const String _storageKey = 'notam_status';
  
  /// Get all NOTAM statuses
  Future<Map<String, NotamStatus>> getAllStatuses() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_storageKey);
    
    if (jsonString == null) return {};
    
    try {
      final Map<String, dynamic> jsonMap = json.decode(jsonString);
      final Map<String, NotamStatus> statuses = {};
      
      for (final entry in jsonMap.entries) {
        statuses[entry.key] = NotamStatus.fromJson(entry.value);
      }
      
      return statuses;
    } catch (e) {
      print('Error loading NOTAM statuses: $e');
      return {};
    }
  }
  
  /// Get status for a specific NOTAM
  Future<NotamStatus?> getStatus(String notamId) async {
    final statuses = await getAllStatuses();
    return statuses[notamId];
  }
  
  /// Save NOTAM status
  Future<void> saveStatus(NotamStatus status) async {
    final prefs = await SharedPreferences.getInstance();
    final statuses = await getAllStatuses();
    
    statuses[status.notamId] = status;
    
    final jsonMap = <String, dynamic>{};
    for (final entry in statuses.entries) {
      jsonMap[entry.key] = entry.value.toJson();
    }
    
    await prefs.setString(_storageKey, json.encode(jsonMap));
  }
  
  /// Hide a NOTAM
  Future<void> hideNotam(String notamId, {String? flightContext}) async {
    final currentStatus = await getStatus(notamId);
    final newStatus = NotamStatus(
      notamId: notamId,
      isHidden: true,
      isFlagged: currentStatus?.isFlagged ?? false,
      hiddenAt: DateTime.now().toUtc(),
      flaggedAt: currentStatus?.flaggedAt,
      flightContext: flightContext,
    );
    
    await saveStatus(newStatus);
  }
  
  /// Unhide a NOTAM
  Future<void> unhideNotam(String notamId) async {
    final currentStatus = await getStatus(notamId);
    if (currentStatus == null) return;
    
    final newStatus = currentStatus.copyWith(
      isHidden: false,
      hiddenAt: null,
    );
    
    await saveStatus(newStatus);
  }
  
  /// Flag a NOTAM
  Future<void> flagNotam(String notamId, {String? flightContext}) async {
    final currentStatus = await getStatus(notamId);
    final newStatus = NotamStatus(
      notamId: notamId,
      isHidden: currentStatus?.isHidden ?? false,
      isFlagged: true,
      hiddenAt: currentStatus?.hiddenAt,
      flaggedAt: DateTime.now().toUtc(),
      flightContext: flightContext,
    );
    
    await saveStatus(newStatus);
  }
  
  /// Unflag a NOTAM
  Future<void> unflagNotam(String notamId) async {
    final currentStatus = await getStatus(notamId);
    if (currentStatus == null) return;
    
    final newStatus = currentStatus.copyWith(
      isFlagged: false,
      flaggedAt: null,
    );
    
    await saveStatus(newStatus);
  }
  
  /// Get hidden NOTAMs for a specific flight context
  Future<List<String>> getHiddenNotamIds({String? flightContext}) async {
    final statuses = await getAllStatuses();
    return statuses.values
        .where((status) => status.isHidden && status.flightContext == flightContext)
        .map((status) => status.notamId)
        .toList();
  }
  
  /// Get flagged NOTAMs for a specific flight context
  Future<List<String>> getFlaggedNotamIds({String? flightContext}) async {
    final statuses = await getAllStatuses();
    return statuses.values
        .where((status) => status.isFlagged && status.flightContext == flightContext)
        .map((status) => status.notamId)
        .toList();
  }
  
  /// Get permanently hidden NOTAMs (no flight context)
  Future<List<String>> getPermanentlyHiddenNotamIds() async {
    final statuses = await getAllStatuses();
    return statuses.values
        .where((status) => status.isHidden && status.flightContext == null)
        .map((status) => status.notamId)
        .toList();
  }
  
  /// Get permanently flagged NOTAMs (no flight context)
  Future<List<String>> getPermanentlyFlaggedNotamIds() async {
    final statuses = await getAllStatuses();
    return statuses.values
        .where((status) => status.isFlagged && status.flightContext == null)
        .map((status) => status.notamId)
        .toList();
  }
  
  /// Clear all statuses (for testing or reset)
  Future<void> clearAllStatuses() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
  }
  
  /// Get count of hidden NOTAMs for a flight context
  Future<int> getHiddenCount({String? flightContext}) async {
    final hiddenIds = await getHiddenNotamIds(flightContext: flightContext);
    return hiddenIds.length;
  }
  
  /// Get count of flagged NOTAMs for a flight context
  Future<int> getFlaggedCount({String? flightContext}) async {
    final flaggedIds = await getFlaggedNotamIds(flightContext: flightContext);
    return flaggedIds.length;
  }
} 
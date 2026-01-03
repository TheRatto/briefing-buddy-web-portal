import 'package:flutter/foundation.dart';
import '../models/notam.dart';
import 'api_service.dart';

/// Service for fetching Flight Information Region (FIR) NOTAMs
/// 
/// Currently handles Australian FIRs (YMMM and YBBB).
/// FIRs represent larger geographic regions than individual airports.
class FIRNotamService {
  static const List<String> australianFIRs = ['YMMM', 'YBBB'];
  
  /// Fetch FIR NOTAMs for Australian FIRs
  /// Always fetches both YMMM and YBBB for comprehensive coverage
  /// These FIR NOTAMs cover broader airspace and route information
  /// than individual airport NOTAMs.
  Future<List<Notam>> fetchAustralianFIRNotams() async {
    debugPrint('DEBUG: FIRNotamService - Starting fetch for Australian FIRs');
    
    final apiService = ApiService();
    final allFIRNotams = <Notam>[];
    
    for (final fir in australianFIRs) {
      try {
        debugPrint('DEBUG: FIRNotamService - Fetching NOTAMs for FIR $fir');
        final notams = await apiService.fetchNotams(fir);
        debugPrint('DEBUG: FIRNotamService - Received ${notams.length} NOTAMs for $fir');
        
        // Analyze FIR NOTAMs for grouping insights
        _analyzeFIRNotams(fir, notams);
        
        allFIRNotams.addAll(notams);
      } catch (e) {
        debugPrint('ERROR: FIRNotamService - Failed to fetch FIR NOTAMs for $fir: $e');
        // Continue fetching other FIR even if one fails
      }
    }
    
    debugPrint('DEBUG: FIRNotamService - Total FIR NOTAMs fetched: ${allFIRNotams.length}');
    return allFIRNotams;
  }
  
  /// Check if an ICAO code represents an Australian airport
  /// Australian airports have ICAO codes starting with 'Y'
  static bool isAustralianAirport(String icao) {
    return icao.toUpperCase().startsWith('Y');
  }
  
  /// Check if an ICAO code represents an Australian FIR
  static bool isAustralianFIR(String icao) {
    return australianFIRs.contains(icao.toUpperCase());
  }
  
  /// Extract FIR NOTAMs from a mixed list of NOTAMs
  /// Useful for filtering when displaying FIR NOTAMs only
  static List<Notam> extractFIRNotams(List<Notam> allNotams) {
    return allNotams.where((notam) => isAustralianFIR(notam.icao)).toList();
  }
  
  /// Extract airport NOTAMs from a mixed list of NOTAMs
  /// Excludes FIR NOTAMs
  static List<Notam> extractAirportNotams(List<Notam> allNotams, List<String> airportCodes) {
    return allNotams.where((notam) {
      final icao = notam.icao.toUpperCase();
      return airportCodes.contains(icao) && !isAustralianFIR(icao);
    }).toList();
  }

  /// Analyze FIR NOTAMs for Q code patterns and content insights
  /// This helps understand what types of NOTAMs we're receiving for better grouping
  void _analyzeFIRNotams(String fir, List<Notam> notams) {
    if (notams.isEmpty) return;

    debugPrint('🔍 FIR NOTAM Analysis for $fir: ${notams.length} NOTAMs');

    // Count Q codes
    final qCodeCounts = <String, int>{};
    final contentKeywords = <String, int>{};
    
    final keywords = [
      'RESTRICTED AREA', 'DANGER AREA', 'PROHIBITED AREA', 'MILITARY EXERCISE',
      'AIRSPACE', 'ROUTE', 'NAVIGATION', 'ALTITUDE', 'FLIGHT LEVEL',
      'ATC', 'RADAR', 'FREQUENCY', 'PROCEDURE', 'APPROACH', 'DEPARTURE',
      'WEATHER', 'VOLCANIC', 'TURBULENCE', 'ICING', 'WIND SHEAR',
      'AIRPORT', 'AERODROME', 'RUNWAY', 'CLOSED', 'UNAVAILABLE',
      'TEMPORARY', 'PERMANENT', 'ACTIVE', 'INACTIVE'
    ];

    for (final notam in notams) {
      // Count Q codes
      final qCode = notam.qCode;
      if (qCode != null && qCode.isNotEmpty) {
        qCodeCounts[qCode] = (qCodeCounts[qCode] ?? 0) + 1;
      }

      // Count content keywords
      final text = (notam.fieldE.isNotEmpty ? notam.fieldE : notam.rawText).toUpperCase();
      for (final keyword in keywords) {
        if (text.contains(keyword)) {
          contentKeywords[keyword] = (contentKeywords[keyword] ?? 0) + 1;
        }
      }
    }

    // Log top Q codes
    final sortedQCodes = qCodeCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    
    debugPrint('  📊 Top Q codes for $fir:');
    for (final entry in sortedQCodes.take(10)) {
      final subject = entry.key.length >= 3 ? entry.key.substring(1, 3) : '??';
      final category = _getSubjectCategory(subject);
      debugPrint('    ${entry.key} (${entry.value}x): $category');
    }

    // Log top content keywords
    final sortedKeywords = contentKeywords.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    
    debugPrint('  🔑 Top keywords for $fir:');
    for (final entry in sortedKeywords.take(8)) {
      debugPrint('    ${entry.key}: ${entry.value} NOTAMs');
    }

    // Show sample NOTAMs
    debugPrint('  📋 Sample NOTAMs for $fir:');
    for (int i = 0; i < notams.length && i < 3; i++) {
      final notam = notams[i];
      final content = (notam.fieldE.isNotEmpty ? notam.fieldE : notam.rawText);
      final shortContent = content.length > 80 ? '${content.substring(0, 80)}...' : content;
      debugPrint('    ${notam.id} (${notam.qCode ?? 'N/A'}): $shortContent');
    }
  }

  /// Map Q code subject to category for analysis
  String _getSubjectCategory(String subject) {
    switch (subject) {
      // Airspace
      case 'AA': return 'Restricted Areas';
      case 'AC': return 'Conditional Routes';
      case 'AD': return 'Danger Areas';
      case 'AE': return 'Prohibited Areas';
      case 'AF': return 'ATS Airspace';
      case 'AH': return 'Upper Control Area';
      case 'AL': return 'Minimum Altitude';
      case 'AN': return 'Area Navigation';
      case 'AO': return 'Oceanic Control';
      case 'AP': return 'Special Use Airspace';
      case 'AR': return 'ATC Routes';
      case 'AT': return 'Terminal Control';
      case 'AU': return 'Upper FIR';
      case 'AV': return 'Upper Advisory';
      case 'AX': return 'Flight Information Region';
      case 'AZ': return 'Aerodrome Traffic Zone';
      
      // Routes
      case 'RA': return 'RNAV Routes';
      case 'RD': return 'Route Segments';
      case 'RM': return 'Military Routes';
      case 'RO': return 'Oceanic Routes';
      case 'RP': return 'Preferred Routes';
      case 'RR': return 'Radio Navigation Routes';
      case 'RT': return 'Temporary Routes';
      
      // General
      case 'GA': return 'General Airspace';
      case 'GW': return 'General Warnings';
      
      // Navigation aids
      case 'IC': case 'ID': case 'IG': case 'II': case 'IL': case 'IM': 
      case 'IN': case 'IO': case 'IS': case 'IT': case 'IU': case 'IW': 
      case 'IX': case 'IY': return 'Navigation Aids';
      
      case 'NA': case 'NB': case 'NC': case 'ND': case 'NF': case 'NL': 
      case 'NM': case 'NN': case 'NO': case 'NT': case 'NV': return 'Navigation Systems';
      
      // Movement areas (less common for FIR but possible)
      case 'MR': case 'MS': case 'MT': case 'MU': case 'MW': return 'Runways';
      case 'MX': case 'MY': return 'Taxiways';
      
      default: return 'Unknown ($subject)';
    }
  }
}

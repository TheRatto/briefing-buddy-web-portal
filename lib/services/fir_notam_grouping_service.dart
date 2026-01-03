import 'package:flutter/foundation.dart';
import '../models/notam.dart';

/// Service for grouping FIR NOTAMs based on real data patterns observed from YMMM/YBBB
/// 
/// Groups are based on actual Q codes and content patterns from Australian FIR NOTAMs:
/// - Airspace Restrictions (E-series): Military airspace, restricted areas
/// - ATC/Navigation (L-series): Radar coverage, navigation services  
/// - Obstacles & Charts (F-series): New obstacles, chart amendments
/// - Infrastructure (H-series): Airport facilities, infrastructure changes
/// - Drone Operations: UA OPS activities
/// - Administrative (G/W-series): General warnings, administrative notices
class FIRNotamGroupingService {
  
  /// Group a FIR NOTAM based on its ID pattern and content
  static NotamGroup groupFIRNotam(Notam notam) {
    // Extract the letter prefix from NOTAM ID (e.g., "E3201/25" -> "E")
    final notamId = notam.id.toUpperCase();
    final idPrefix = notamId.isNotEmpty ? notamId[0] : '';
    
    // Get content for keyword analysis
    final content = (notam.fieldE.isNotEmpty ? notam.fieldE : notam.rawText).toUpperCase();
    
    debugPrint('🏷️ Grouping FIR NOTAM ${notam.id} (prefix: $idPrefix)');
    
    // Group by NOTAM ID prefix patterns (primary classification)
    switch (idPrefix) {
      case 'E':
        // E-series: Airspace restrictions, military areas
        if (_containsAirspaceKeywords(content)) {
          debugPrint('  ✈️ -> FIR Airspace Restrictions (E-series + airspace keywords)');
          return NotamGroup.firAirspaceRestrictions;
        }
        break;
        
      case 'L':
        // L-series: ATC services, radar, navigation
        if (_containsATCKeywords(content)) {
          debugPrint('  📡 -> FIR ATC/Navigation (L-series + ATC keywords)');
          return NotamGroup.firAtcNavigation;
        }
        break;
        
      case 'F':
        // F-series: Charts, obstacles, infrastructure
        if (_containsObstacleKeywords(content)) {
          debugPrint('  🏗️ -> FIR Obstacles & Charts (F-series + obstacle keywords)');
          return NotamGroup.firObstaclesCharts;
        }
        break;
        
      case 'H':
        // H-series: Airport infrastructure, facilities
        if (_containsInfrastructureKeywords(content)) {
          debugPrint('  🏢 -> FIR Infrastructure (H-series + infrastructure keywords)');
          return NotamGroup.firInfrastructure;
        }
        break;
        
      case 'G':
      case 'W':
        // G/W-series: General warnings, administrative
        debugPrint('  📋 -> FIR Administrative (G/W-series)');
        return NotamGroup.firAdministrative;
    }
    
    // Secondary classification by content keywords (if prefix didn't match)
    if (_containsDroneKeywords(content)) {
      debugPrint('  🚁 -> FIR Drone Operations (content-based)');
      return NotamGroup.firDroneOperations;
    }
    
    if (_containsAirspaceKeywords(content)) {
      debugPrint('  ✈️ -> FIR Airspace Restrictions (content-based)');
      return NotamGroup.firAirspaceRestrictions;
    }
    
    if (_containsATCKeywords(content)) {
      debugPrint('  📡 -> FIR ATC/Navigation (content-based)');
      return NotamGroup.firAtcNavigation;
    }
    
    if (_containsObstacleKeywords(content)) {
      debugPrint('  🏗️ -> FIR Obstacles & Charts (content-based)');
      return NotamGroup.firObstaclesCharts;
    }
    
    // Default to "Other" for unclassified FIR NOTAMs
    debugPrint('  ❓ -> Other (unclassified)');
    return NotamGroup.other;
  }
  
  /// Check for airspace-related keywords
  static bool _containsAirspaceKeywords(String content) {
    const airspaceKeywords = [
      'AIRSPACE', 'RESTRICTED', 'MILITARY FLYING', 'MIL FLYING',
      'DANGER AREA', 'PROHIBITED AREA', 'SPECIAL USE AIRSPACE',
      'RESTRICTED AREA', 'MILITARY EXERCISE', 'MIL NON-FLYING',
      'TEMPO RESTRICTED AREA', 'EMERGENCY EXERCIS'
    ];
    
    return airspaceKeywords.any((keyword) => content.contains(keyword));
  }
  
  /// Check for ATC/Navigation-related keywords  
  static bool _containsATCKeywords(String content) {
    const atcKeywords = [
      'RADAR COVERAGE', 'A/G FAC', 'ATC', 'NAVIGATION',
      'FREQUENCY', 'MELBOURNE CENTRE', 'APPROACH',
      'DEPARTURE', 'CONTROL', 'TOWER'
    ];
    
    return atcKeywords.any((keyword) => content.contains(keyword));
  }
  
  /// Check for obstacle-related keywords
  static bool _containsObstacleKeywords(String content) {
    const obstacleKeywords = [
      'MAST', 'WIND TURBINE', 'OBST', 'OBSTACLE',
      'AIP CHARTS AMD', 'CHART', 'UNLIT', 'LIT',
      'MET MAST', 'COMMUNICATION TOWER', 'BLDG',
      'GRID LOWEST SAFE ALTITUDE', 'LSALT'
    ];
    
    return obstacleKeywords.any((keyword) => content.contains(keyword));
  }
  
  /// Check for infrastructure-related keywords
  static bool _containsInfrastructureKeywords(String content) {
    const infrastructureKeywords = [
      'AIRPORT', 'AERODROME', 'RUNWAY', 'TAXIWAY',
      'INTEGRATED AIP', 'IAIP', 'FACILITY', 'TERMINAL',
      'WESTERN SYDNEY INTERNATIONAL', 'NANCY-BIRD WALTON'
    ];
    
    return infrastructureKeywords.any((keyword) => content.contains(keyword));
  }
  
  /// Check for drone operation keywords
  static bool _containsDroneKeywords(String content) {
    const droneKeywords = [
      'UA OPS', 'MULTI-ROTOR', 'FIXED-WING', 'UNMANNED AIRCRAFT',
      'DRONE', 'UAS', 'RPAS'
    ];
    
    return droneKeywords.any((keyword) => content.contains(keyword));
  }
  
  /// Get a human-readable description of the grouping logic for a NOTAM
  static String getGroupingReason(Notam notam) {
    final notamId = notam.id.toUpperCase();
    final idPrefix = notamId.isNotEmpty ? notamId[0] : '';
    final content = (notam.fieldE.isNotEmpty ? notam.fieldE : notam.rawText).toUpperCase();
    
    switch (idPrefix) {
      case 'E':
        if (_containsAirspaceKeywords(content)) {
          return 'E-series NOTAM with airspace restrictions';
        }
        break;
      case 'L':
        if (_containsATCKeywords(content)) {
          return 'L-series NOTAM with ATC/navigation content';
        }
        break;
      case 'F':
        if (_containsObstacleKeywords(content)) {
          return 'F-series NOTAM with obstacles/charts';
        }
        break;
      case 'H':
        if (_containsInfrastructureKeywords(content)) {
          return 'H-series NOTAM with infrastructure content';
        }
        break;
      case 'G':
      case 'W':
        return '${idPrefix}-series administrative NOTAM';
    }
    
    // Content-based classification
    if (_containsDroneKeywords(content)) return 'Drone operations detected';
    if (_containsAirspaceKeywords(content)) return 'Airspace restrictions detected';
    if (_containsATCKeywords(content)) return 'ATC/navigation content detected';
    if (_containsObstacleKeywords(content)) return 'Obstacles/charts detected';
    
    return 'Unclassified FIR NOTAM';
  }
  
  /// Apply FIR-specific grouping to a list of NOTAMs
  static List<Notam> applyFIRGrouping(List<Notam> firNotams) {
    debugPrint('🏷️ Applying FIR grouping to ${firNotams.length} NOTAMs');
    
    final groupedNotams = <Notam>[];
    final groupCounts = <NotamGroup, int>{};
    
    for (final notam in firNotams) {
      final newGroup = groupFIRNotam(notam);
      
      // Create a new NOTAM with the FIR-specific group
      final groupedNotam = Notam(
        id: notam.id,
        icao: notam.icao,
        qCode: notam.qCode,
        rawText: notam.rawText,
        fieldD: notam.fieldD,
        fieldE: notam.fieldE,
        fieldF: notam.fieldF,
        fieldG: notam.fieldG,
        validFrom: notam.validFrom,
        validTo: notam.validTo,
        type: notam.type,
        group: newGroup, // Apply FIR-specific grouping
        isPermanent: notam.isPermanent,
        source: notam.source,
        isCritical: notam.isCritical,
      );
      
      groupedNotams.add(groupedNotam);
      groupCounts[newGroup] = (groupCounts[newGroup] ?? 0) + 1;
    }
    
    // Log grouping results
    debugPrint('📊 FIR NOTAM Grouping Results:');
    for (final entry in groupCounts.entries) {
      debugPrint('  ${entry.key.name}: ${entry.value} NOTAMs');
    }
    
    return groupedNotams;
  }
}

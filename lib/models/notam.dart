import 'package:flutter/foundation.dart';

enum NotamType { runway, navaid, taxiway, lighting, procedure, other, airspace }

// NOTAM grouping enum based on operational significance
enum NotamGroup {
  // Airport-specific groups (Groups 1-8)
  runways,          // Group 1: Runways (Critical) - closures, lighting, ACR/PCR
  taxiways,         // Group 2: Taxiways - closures, lighting, ACR/PCR
  instrumentProcedures, // Group 3: Navaids, SIDs, STARs, approaches, airspace
  airportServices,  // Group 4: ATC, fire, parking, PPR, curfew, fuel
  lighting,         // Group 5: All lighting facilities - approach, runway, taxiway, obstacle lights
  hazards,          // Group 6: Obstacles, birds, warnings
  admin,            // Group 7: OIP/AIP updates, administrative
  other,            // Group 8: Unmapped items
  
  // FIR-specific groups (Groups 9-13) - parallel structure for Flight Information Region NOTAMs
  firAirspaceRestrictions,  // Group 9: E-series - Military airspace, restricted areas, danger areas
  firAtcNavigation,         // Group 10: L-series - Radar coverage, ATC services, navigation aids
  firObstaclesCharts,       // Group 11: F-series - New obstacles, chart amendments, LSALT updates
  firInfrastructure,        // Group 12: H-series - Airport infrastructure, facility changes
  firDroneOperations,       // Group 13: UA OPS - Unmanned aircraft operations, drone activities
  firAdministrative,        // Group 14: G/W-series - General warnings, administrative notices
}

class Notam {
  final String id;
  final String? qCode;
  final String rawText;
  final String fieldD;
  final String fieldE;
  final String fieldF;
  final String fieldG;
  final DateTime validFrom;
  final DateTime validTo;
  final String icao;
  final NotamType type;
  final NotamGroup group;
  final bool isPermanent;
  final String source;
  final bool isCritical;

  const Notam({
    required this.id,
    this.qCode,
    required this.rawText,
    required this.fieldD,
    required this.fieldE,
    required this.fieldF,
    required this.fieldG,
    required this.validFrom,
    required this.validTo,
    required this.icao,
    required this.type,
    required this.group,
    this.isPermanent = false,
    this.source = 'faa',
    this.isCritical = false,
  });

  // Extract Q code from NOTAM text using regex
  static String? extractQCode(String text) {
    // Q codes are 5 letters total: Q + 4 letters (e.g., QMRLC, QOLCC)
    // First letter is always Q, next 2 identify subject, last 2 identify status
    // Make regex more flexible to catch Q codes in various contexts
    final qCodeRegex = RegExp(r'\bQ[A-Z]{4}\b', caseSensitive: false);
    final match = qCodeRegex.firstMatch(text.toUpperCase());
    
    // Q code extraction logging removed to focus on TAF parsing
    
    return match?.group(0);
  }

  // Determine NOTAM type based on Q code (using subject code - letters 2-3)
  static NotamType determineTypeFromQCode(String? qCode) {
    if (qCode == null || qCode.length != 5 || !qCode.startsWith('Q')) {
      return NotamType.other;
    }
    
    // Extract subject identifier (letters 2-3)
    final subject = qCode.substring(1, 3);
    
    // Movement and Landing Area (M)
    if (['MR', 'MS', 'MT', 'MU', 'MW'].contains(subject)) {
      return NotamType.runway;
    }
    if (['MX', 'MY', 'TW'].contains(subject)) {
      return NotamType.taxiway;
    }
    if (['MK', 'MN', 'MP'].contains(subject)) {
      return NotamType.other; // Parking, apron, stands
    }
    
    // Navigation Aids (I, N)
    if (['IC', 'ID', 'IG', 'II', 'IL', 'IM', 'IN', 'IO', 'IS', 'IT', 'IU', 'IW', 'IX', 'IY',
         'NA', 'NB', 'NC', 'ND', 'NF', 'NL', 'NM', 'NN', 'NO', 'NT', 'NV'].contains(subject)) {
        return NotamType.navaid;
    }
      
      // Lighting Facilities (L)
    if (['LA', 'LB', 'LC', 'LD', 'LE', 'LF', 'LG', 'LH', 'LI', 'LJ', 'LK', 'LL', 'LM', 'LP', 
         'LR', 'LS', 'LT', 'LU', 'LV', 'LW', 'LX', 'LY', 'LZ'].contains(subject)) {
        return NotamType.lighting;
    }
    
    // Airspace (A)
    if (['AA', 'AC', 'AD', 'AE', 'AF', 'AH', 'AL', 'AN', 'AO', 'AP', 'AR', 'AT', 'AU', 'AV', 'AX', 'AZ',
         'RA', 'RD', 'RM', 'RO', 'RP', 'RR', 'RT', 'GA', 'GW'].contains(subject)) {
      return NotamType.airspace;
    }
    
    // Procedures (P)
    if (['PA', 'PB', 'PC', 'PD', 'PE', 'PH', 'PI', 'PK', 'PU', 'PR'].contains(subject)) {
      return NotamType.procedure;
    }
    
    // Hazards and Obstacles (O)
    if (['OB'].contains(subject)) {
      return NotamType.other; // Obstacles
    }
    if (['OL'].contains(subject)) {
      return NotamType.lighting; // Obstacle Lights
    }
    
    // Default to other for unmapped codes
        return NotamType.other;
  }

  // Get sanitized human-readable description of Q code subject
  static String getQCodeSubjectDescription(String? qCode) {
    if (qCode == null || qCode.length != 5 || !qCode.startsWith('Q')) {
      return 'Unknown';
    }
    
    final subject = qCode.substring(1, 3);
    
    String description;
    switch (subject) {
      // Airspace Organization (A)
      case 'AA': description = 'Minimum Altitude'; break;
      case 'AC': description = 'Class B/C/D/E Surface Area'; break;
      case 'AD': description = 'Air Defense Identification Zone'; break;
      case 'AE': description = 'Control Area'; break;
      case 'AF': description = 'Flight Information Region'; break;
      case 'AH': description = 'Upper Control Area'; break;
      case 'AL': description = 'Minimum Usable Flight Level'; break;
      case 'AN': description = 'Area Navigation Route'; break;
      case 'AO': description = 'Oceanic Control Area'; break;
      case 'AP': description = 'Reporting Point'; break;
      case 'AR': description = 'ATS Route'; break;
      case 'AT': description = 'Terminal Control Area'; break;
      case 'AU': description = 'Upper Flight Information Region'; break;
      case 'AV': description = 'Upper Advisory Area'; break;
      case 'AX': description = 'Significant Point'; break;
      case 'AZ': description = 'Aerodrome Traffic Zone'; break;
      
      // Communications and Surveillance (C)
      case 'CA': description = 'Air/Ground Facility'; break;
      case 'CB': description = 'ADS-B'; break;
      case 'CC': description = 'ADS-C'; break;
      case 'CD': description = 'CPDLC'; break;
      case 'CE': description = 'En Route Surveillance Radar'; break;
      case 'CG': description = 'GCA System'; break;
      case 'CL': description = 'SELCAL'; break;
      case 'CM': description = 'Surface Movement Radar'; break;
      case 'CP': description = 'Precision Approach Radar'; break;
      case 'CR': description = 'SRE of PAR'; break;
      case 'CS': description = 'SSR'; break;
      case 'CT': description = 'Terminal Area Surveillance Radar'; break;
      
      // Facilities and Services (F)
      case 'FA': description = 'Aerodrome'; break;
      case 'FB': description = 'Friction Measuring Device'; break;
      case 'FC': description = 'Ceiling Measurement Equipment'; break;
      case 'FD': description = 'Docking System'; break;
      case 'FE': description = 'Oxygen'; break;
      case 'FF': description = 'Fire Fighting and Rescue'; break;
      case 'FG': description = 'Ground Movement Control'; break;
      case 'FH': description = 'Helicopter Alighting Area'; break;
      case 'FI': description = 'Aircraft De-icing'; break;
      case 'FJ': description = 'Oils'; break;
      case 'FL': description = 'Landing Direction Indicator'; break;
      case 'FM': description = 'Meteorological Service'; break;
      case 'FO': description = 'Fog Dispersal System'; break;
      case 'FP': description = 'Heliport'; break;
      case 'FS': description = 'Snow Removal Equipment'; break;
      case 'FT': description = 'Transmissometer'; break;
      case 'FU': description = 'Fuel Availability'; break;
      case 'FW': description = 'Wind Direction Indicator'; break;
      case 'FZ': description = 'Customs/Immigration'; break;
      
      // GNSS Services (G)
      case 'GA': description = 'GNSS Airfield-Specific Operations'; break;
      case 'GW': description = 'GNSS Area-Wide Operations'; break;
      
      // Instrument and Microwave Landing System (I)
      case 'IC': description = 'ILS'; break;
      case 'ID': description = 'ILS DME'; break;
      case 'IG': description = 'Glide Path (ILS)'; break;
      case 'II': description = 'Inner Marker (ILS)'; break;
      case 'IL': description = 'Localizer (ILS)'; break;
      case 'IM': description = 'Middle Marker (ILS)'; break;
      case 'IN': description = 'Localizer (Non-ILS)'; break;
      case 'IO': description = 'Outer Marker (ILS)'; break;
      case 'IS': description = 'ILS Category I'; break;
      case 'IT': description = 'ILS Category II'; break;
      case 'IU': description = 'ILS Category III'; break;
      case 'IW': description = 'MLS'; break;
      case 'IX': description = 'Locator, Outer (ILS)'; break;
      case 'IY': description = 'Locator, Middle (ILS)'; break;
      
      // Lighting Facilities (L)
      case 'LA': description = 'Approach Lighting System'; break;
      case 'LB': description = 'Aerodrome Beacon'; break;
      case 'LC': description = 'Runway Centre Line Lights'; break;
      case 'LD': description = 'Landing Direction Indicator Lights'; break;
      case 'LE': description = 'Runway Edge Lights'; break;
      case 'LF': description = 'Sequenced Flashing Lights'; break;
      case 'LG': description = 'Pilot-Controlled Lighting'; break;
      case 'LH': description = 'High Intensity Runway Lights'; break;
      case 'LI': description = 'Runway End Identifier Lights'; break;
      case 'LJ': description = 'Runway Alignment Indicator Lights'; break;
      case 'LK': description = 'CAT II Components of ALS'; break;
      case 'LL': description = 'Low Intensity Runway Lights'; break;
      case 'LM': description = 'Medium Intensity Runway Lights'; break;
      case 'LP': description = 'PAPI'; break;
      case 'LR': description = 'All Landing Area Lighting Facilities'; break;
      case 'LS': description = 'Stopway Lights'; break;
      case 'LT': description = 'Threshold Lights'; break;
      case 'LU': description = 'Helicopter Approach Path Indicator'; break;
      case 'LV': description = 'VASIS'; break;
      case 'LW': description = 'Heliport Lighting'; break;
      case 'LX': description = 'Taxiway Centre Line Lights'; break;
      case 'LY': description = 'Taxiway Edge Lights'; break;
      case 'LZ': description = 'Runway Touchdown Zone Lights'; break;
      
      // Movement and Landing Area (M)
      case 'MA': description = 'Movement Area'; break;
      case 'MB': description = 'Bearing Strength'; break;
      case 'MC': description = 'Clearway'; break;
      case 'MD': description = 'Declared Distances'; break;
      case 'MG': description = 'Taxiing Guidance System'; break;
      case 'MH': description = 'Arresting Gear'; break;
      case 'MK': description = 'Parking Area'; break;
      case 'MM': description = 'Daylight Markings'; break;
      case 'MN': description = 'Apron'; break;
      case 'MO': description = 'Stopbar'; break;
      case 'MP': description = 'Aircraft Stands'; break;
      case 'MR': description = 'Runway'; break;
      case 'MS': description = 'Stopway'; break;
      case 'MT': description = 'Threshold'; break;
      case 'MU': description = 'Runway Turning Bay'; break;
      case 'MW': description = 'Strip/Shoulder'; break;
      case 'MX': description = 'Taxiway(s)'; break;
      case 'MY': description = 'Rapid Exit Taxiway'; break;
      
      // COM Terminal and En Route Navigation Facilities (N)
      case 'NA': description = 'All Radio Navigation Facilities'; break;
      case 'NB': description = 'Nondirectional Radio Beacon'; break;
      case 'NC': description = 'DECCA'; break;
      case 'ND': description = 'Distance Measuring Equipment (DME)'; break;
      case 'NF': description = 'Fan Marker'; break;
      case 'NL': description = 'Locator'; break;
      case 'NM': description = 'VOR/DME'; break;
      case 'NN': description = 'TACAN'; break;
      case 'NO': description = 'OMEGA'; break;
      case 'NT': description = 'VORTAC'; break;
      case 'NV': description = 'VOR'; break;
      
      // Other Information (O)
      case 'OA': description = 'Aeronautical Information Service'; break;
      case 'OB': description = 'Obstacle'; break;
      case 'OE': description = 'Aircraft Entry Requirements'; break;
      case 'OL': description = 'Obstacle Lights'; break;
      case 'OR': description = 'Rescue Coordination Centre'; break;
      
      // ATM Air Traffic Procedures (P)
      case 'PA': description = 'Standard Instrument Arrival'; break;
      case 'PB': description = 'Standard VFR Arrival'; break;
      case 'PC': description = 'Contingency Procedures'; break;
      case 'PD': description = 'Standard Instrument Departure'; break;
      case 'PE': description = 'Standard VFR Departure'; break;
      case 'PF': description = 'Flow Control Procedure'; break;
      case 'PH': description = 'Holding Procedure'; break;
      case 'PI': description = 'Instrument Approach Procedure'; break;
      case 'PK': description = 'VFR Approach Procedure'; break;
      case 'PL': description = 'Flight Plan Processing'; break;
      case 'PM': description = 'Aerodrome Operating Minima'; break;
      case 'PN': description = 'Noise Operating Restriction'; break;
      case 'PO': description = 'Obstacle Clearance Altitude and Height'; break;
      case 'PR': description = 'Radio Failure Procedures'; break;
      case 'PT': description = 'Transition Altitude or Transition Level'; break;
      case 'PU': description = 'Missed Approach Procedure'; break;
      case 'PX': description = 'Minimum Holding Altitude'; break;
      case 'PZ': description = 'ADIZ Procedure'; break;
      
      // Navigation Warnings: Airspace Restrictions (R)
      case 'RA': description = 'Airspace Reservation'; break;
      case 'RD': description = 'Danger Area'; break;
      case 'RM': description = 'Military Operating Area'; break;
      case 'RO': description = 'Overflying of...'; break;
      case 'RP': description = 'Prohibited Area'; break;
      case 'RR': description = 'Restricted Area'; break;
      case 'RT': description = 'Temporary Restricted Area'; break;
      
      // ATM Air Traffic and VOLMET Services (S)
      case 'SA': description = 'Automatic Terminal Information Service'; break;
      case 'SB': description = 'ATS Reporting Office'; break;
      case 'SC': description = 'Area Control Centre'; break;
      case 'SE': description = 'Flight Information Service'; break;
      case 'SF': description = 'Aerodrome Flight Information Service'; break;
      case 'SL': description = 'Flow Control Centre'; break;
      case 'SO': description = 'Oceanic Area Control Centre'; break;
      case 'SP': description = 'Approach Control Service'; break;
      case 'SS': description = 'Flight Service Station'; break;
      case 'ST': description = 'Aerodrome Control Tower'; break;
      case 'SU': description = 'Upper Area Control Centre'; break;
      case 'SV': description = 'VOLMET Broadcast'; break;
      case 'SY': description = 'Upper Advisory Service'; break;
      
      // Navigation Warnings: Warnings (W)
      case 'WA': description = 'Air Display'; break;
      case 'WB': description = 'Aerobatics'; break;
      case 'WC': description = 'Captive Balloon or Kite'; break;
      case 'WD': description = 'Demolition of Explosives'; break;
      case 'WE': description = 'Exercises'; break;
      case 'WF': description = 'Air Refueling'; break;
      case 'WG': description = 'Glider Flying'; break;
      case 'WH': description = 'Blasting'; break;
      case 'WJ': description = 'Banner/Target Towing'; break;
      case 'WL': description = 'Ascent of Free Balloon'; break;
      case 'WM': description = 'Missile, Gun or Rocket Flying'; break;
      case 'WP': description = 'Parachute Jumping Exercise, Paragliding or Hang Gliding'; break;
      case 'WR': description = 'Radioactive Materials or Toxic Chemicals'; break;
      case 'WS': description = 'Burning or Blowing Gas'; break;
      case 'WT': description = 'Mass Movement of Aircraft'; break;
      case 'WU': description = 'Unmanned Aircraft'; break;
      case 'WV': description = 'Formation Flight'; break;
      case 'WW': description = 'Significant Volcanic Activity'; break;
      case 'WY': description = 'Aerial Survey'; break;
      case 'WZ': description = 'Model Flying'; break;
      
      default: description = 'Unknown Subject'; break;
    }
    
    return sanitizeText(description);
  }

  // Get sanitized human-readable description of Q code status
  static String getQCodeStatusDescription(String? qCode) {
    if (qCode == null || qCode.length != 5 || !qCode.startsWith('Q')) {
      return 'Unknown';
    }
    
    final status = qCode.substring(3, 5);
    
    String description;
    switch (status) {
      // Availability (A)
      case 'AC': description = 'Withdrawn for Maintenance'; break;
      case 'AD': description = 'Available for Daylight Operation'; break;
      case 'AF': description = 'Flight Checked and Found Reliable'; break;
      case 'AG': description = 'Ground Checked Only'; break;
      case 'AH': description = 'Hours of Service Now'; break;
      case 'AK': description = 'Resumed Normal Operations'; break;
      case 'AL': description = 'Operative Subject to Prior Conditions'; break;
      case 'AM': description = 'Military Operations Only'; break;
      case 'AN': description = 'Available for Night Ops'; break;
      case 'AO': description = 'Operational'; break;
      case 'AP': description = 'Prior Permission Required'; break;
      case 'AR': description = 'Available on Request'; break;
      case 'AS': description = 'Unserviceable'; break;
      case 'AU': description = 'Not Available'; break;
      case 'AW': description = 'Completely Withdrawn'; break;
      case 'AX': description = 'Previously Promulgated Shutdown Cancelled'; break;
      
      // Changes (C)
      case 'CA': return 'Activated';
      case 'CC': return 'Completed';
      case 'CD': return 'Deactivated';
      case 'CE': return 'Erected';
      case 'CF': return 'Operating Frequency(ies) Changed To';
      case 'CG': return 'Downgraded To';
      case 'CH': return 'Changed';
      case 'CI': return 'Identification or Radio Call Sign Changed To';
      case 'CL': return 'Realigned';
      case 'CM': return 'Displaced';
      case 'CN': return 'Canceled';
      case 'CO': return 'Operating';
      case 'CP': return 'Operating on Reduced Power';
      case 'CR': return 'Temporarily Replaced By';
      case 'CS': return 'Installed';
      case 'CT': return 'On Test, Do Not Use';
      
      // Hazard Conditions (H)
      case 'HA': return 'Braking Action Is...';
      case 'HB': return 'Friction Coefficient Is...';
      case 'HC': return 'Covered by Compacted Snow to Depth of';
      case 'HD': return 'Covered by Dry Snow to Depth of';
      case 'HE': return 'Covered by Water to Depth of';
      case 'HF': return 'Totally Free of Snow and Ice';
      case 'HG': return 'Grass Cutting in Progress';
      case 'HH': return 'Hazard Due To';
      case 'HI': return 'Covered by Ice';
      case 'HJ': return 'Launch Planned';
      case 'HK': return 'Bird Migration in Progress';
      case 'HL': return 'Snow Clearance Completed';
      case 'HM': return 'Marked By';
      case 'HN': return 'Covered by Wet Snow or Slush to Depth of';
      case 'HO': return 'Obscured by Snow';
      case 'HP': return 'Snow Clearance in Progress';
      case 'HQ': return 'Operation Canceled';
      case 'HR': return 'Standing Water';
      case 'HS': return 'Sanding in Progress';
      case 'HT': return 'Approach According to Signal Area Only';
      case 'HU': return 'Launch in Progress';
      case 'HV': return 'Work Completed';
      case 'HW': return 'Work in Progress';
      case 'HX': return 'Concentration of Birds';
      case 'HY': return 'Snow Banks Exist';
      case 'HZ': return 'Covered by Frozen Ruts and Ridges';
      
      // Limitations (L)
      case 'LA': return 'Operating on Auxiliary Power';
      case 'LB': return 'Reserved for Aircraft Based Therein';
      case 'LC': return 'Closed';
      case 'LD': return 'Unsafe';
      case 'LE': return 'Operating Without Auxiliary Power Supply';
      case 'LF': return 'Interference From';
      case 'LG': return 'Operating Without Identification';
      case 'LH': return 'Unserviceable for Aircraft Heavier Than';
      case 'LI': return 'Closed to IFR Operations';
      case 'LK': return 'Operating as a Fixed Light';
      case 'LL': return 'Usable for Length of...and Width of...';
      case 'LN': return 'Closed to All Night Operations';
      case 'LP': return 'Prohibited To';
      case 'LR': return 'Aircraft Restricted to Runways and Taxiways';
      case 'LS': return 'Subject to Interruption';
      case 'LT': return 'Limited To';
      case 'LV': return 'Closed to VFR Operations';
      case 'LW': return 'Will Take Place';
      case 'LX': return 'Operating but Caution Advised Due To';
      
      // Other (XX)
      case 'XX': description = 'Unknown/Unspecified'; break;
      
      default: description = 'Other'; break;
    }
    
    return sanitizeText(description);
  }

  // Get Q code status/condition (fourth and fifth letters)
  static String? getQCodeStatus(String? qCode) {
    if (qCode == null || qCode.length != 5 || !qCode.startsWith('Q')) {
      return null;
    }
    
    // Extract status identifier (fourth and fifth letters)
    return qCode.substring(3, 5);
  }

  // Determine NOTAM group based on Q code
  static NotamGroup determineGroupFromQCode(String? qCode) {
    if (qCode == null || qCode.length != 5 || !qCode.startsWith('Q')) {
      return NotamGroup.other;
    }
    
    final subject = qCode.substring(1, 3);
    
    // Runways (Group 1) - Critical runway operations
    if (['MR', 'MS', 'MT', 'MU', 'MW', 'MD'].contains(subject)) {
      return NotamGroup.runways;
    }
    
    // Taxiways (Group 2) - Ground movement areas
    if (['MX', 'MY', 'MK', 'MN', 'MP'].contains(subject)) {
      return NotamGroup.taxiways;
    }
    
    // Instrument Procedures (Group 3) - Navigation and procedures
    if (['IC', 'ID', 'IG', 'II', 'IL', 'IM', 'IN', 'IO', 'IS', 'IT', 'IU', 'IW', 'IX', 'IY',
         'NA', 'NB', 'NC', 'ND', 'NF', 'NL', 'NM', 'NN', 'NO', 'NT', 'NV',
         'PA', 'PB', 'PC', 'PD', 'PE', 'PH', 'PI', 'PK', 'PU',
         'AA', 'AC', 'AD', 'AE', 'AF', 'AH', 'AL', 'AN', 'AO', 'AP', 'AR', 'AT', 'AU', 'AV', 'AX', 'AZ',
         'RA', 'RD', 'RM', 'RO', 'RP', 'RR', 'RT', 'GA', 'GW'].contains(subject)) {
      return NotamGroup.instrumentProcedures;
    }
    
    // Airport Services (Group 4) - ATC, facilities, fuel, etc.
    if (['FA', 'FF', 'FU', 'FM'].contains(subject)) {
      return NotamGroup.airportServices;
    }
    
    // Lighting Facilities (Group 5) - All lighting-related NOTAMs
    if (['LA', 'LB', 'LC', 'LD', 'LE', 'LF', 'LG', 'LH', 'LI', 'LJ', 'LK', 'LL', 'LM', 'LP', 
         'LR', 'LS', 'LT', 'LU', 'LV', 'LW', 'LX', 'LY', 'LZ'].contains(subject)) {
      return NotamGroup.lighting;
    }
    
    // Hazards (Group 6) - Obstacles, safety issues, warnings
    if (['OB', 'OL', 'WA', 'WB', 'WC', 'WD', 'WE', 'WF', 'WG', 'WH', 'WJ', 'WL', 'WM', 'WP', 'WR', 'WS', 'WT', 'WU', 'WV', 'WW', 'WY', 'WZ'].contains(subject)) {
      return NotamGroup.hazards;
    }
    
    // Admin (Group 7) - Administrative procedures
    if (['PF', 'PL', 'PN', 'PO', 'PR', 'PT', 'PX', 'PZ'].contains(subject)) {
      return NotamGroup.admin;
    }
    
    // Default to other for unmapped codes
    return NotamGroup.other;
  }

  // Normalize apostrophe characters for better display
  static String sanitizeText(String text) {
    if (text.isEmpty) return text;
    
    // First, decode HTML entities
    String sanitized = text
        .replaceAll('&apos;', "'") // HTML apostrophe entity
        .replaceAll('&quot;', '"') // HTML quote entity
        .replaceAll('&amp;', '&') // HTML ampersand entity
        .replaceAll('&lt;', '<') // HTML less than entity
        .replaceAll('&gt;', '>') // HTML greater than entity
        .replaceAll('&nbsp;', ' ') // HTML non-breaking space
        .replaceAll('&ndash;', '-') // HTML en dash
        .replaceAll('&mdash;', '-') // HTML em dash
        .replaceAll('&deg;', 'deg') // HTML degree symbol
        .replaceAll('&plusmn;', '+/-') // HTML plus-minus
        .replaceAll('&le;', '<=') // HTML less than or equal
        .replaceAll('&ge;', '>=') // HTML greater than or equal
        .replaceAll('&times;', 'x') // HTML multiplication
        .replaceAll('&divide;', '/'); // HTML division
    
    // Then replace problematic Unicode apostrophes with standard ASCII apostrophe
    // This handles cases like smart quotes, curly apostrophes, etc.
    sanitized = sanitized
        .replaceAll('’', "'") // Left single quotation mark
        .replaceAll('‘', "'") // Right single quotation mark  
        .replaceAll('“', '"') // Left double quotation mark
        .replaceAll('”', '"') // Right double quotation mark
        .replaceAll('…', '...') // Horizontal ellipsis
        .replaceAll('–', '-') // En dash
        .replaceAll('—', '-') // Em dash
        .replaceAll('′', "'") // Prime (feet)
        .replaceAll('″', '"') // Double prime (inches)
        .replaceAll('°', 'deg') // Degree symbol
        .replaceAll('±', '+/-') // Plus-minus sign
        .replaceAll('≤', '<=') // Less than or equal
        .replaceAll('≥', '>=') // Greater than or equal
        .replaceAll('×', 'x') // Multiplication sign
        .replaceAll('÷', '/'); // Division sign
    
    // Debug logging for significant changes
    if (sanitized != text) {
      debugPrint('DEBUG: 🔧 Text sanitized for NOTAM - Original length: ${text.length}, Sanitized length: ${sanitized.length}');
      debugPrint('DEBUG: 🔧 Original text preview: "${text.length > 100 ? text.substring(0, 100) + '...' : text}"');
      debugPrint('DEBUG: 🔧 Sanitized text preview: "${sanitized.length > 100 ? sanitized.substring(0, 100) + '...' : sanitized}"');
    }
    
    return sanitized;
  }

  // Helper to extract the E) line(s) from rawText
  static String extractELine(String text) {
    final eLineRegExp = RegExp(r'^E\)\s*(.*)', multiLine: true);
    final matches = eLineRegExp.allMatches(text);
    if (matches.isNotEmpty) {
      // If there are multiple E) lines, join them with newlines and sanitize
      final joined = matches.map((m) => m.group(1)?.trim() ?? '').where((s) => s.isNotEmpty).join('\n');
      return sanitizeText(joined);
    }
    return sanitizeText(text); // fallback
  }

  // Helper to extract ICAO fields E, F, and G
  static Map<String, String> _extractIcaoFields(String icaoText) {
    final fields = <String, String>{};
    
    // Find each field by its marker
    final eMatch = RegExp(r'E\)(.*?)(?=\n[F-G]\)|$)', dotAll: true).firstMatch(icaoText);
    final fMatch = RegExp(r'F\)(.*?)(?=\n[G]\)|$)', dotAll: true).firstMatch(icaoText);
    final gMatch = RegExp(r'G\)(.*?)(?=\n[A-Z]\)|$)', dotAll: true).firstMatch(icaoText);
    
    fields['E'] = eMatch?.group(1)?.trim() ?? '';
    fields['F'] = fMatch?.group(1)?.trim() ?? '';
    fields['G'] = gMatch?.group(1)?.trim() ?? '';
    
    return fields;
  }

  // Helper to create enhanced NOTAM text by combining stored fields
  static String _createEnhancedNotamText(String fieldE, String fieldF, String fieldG) {
    String result = fieldE;
    if (fieldF.isNotEmpty || fieldG.isNotEmpty) {
      result += '\n';
      if (fieldF.isNotEmpty && fieldG.isNotEmpty) {
        result += '$fieldF TO $fieldG';
      } else if (fieldF.isNotEmpty) {
        result += fieldF;
      } else if (fieldG.isNotEmpty) {
        result += fieldG;
      }
    }
    return result;
  }

  // Get sanitized raw text for display (only E) line if present)
  String get displayRawText => extractELine(rawText);
  
  // Get sanitized decoded text for display  
  String get displayDecodedText => sanitizeText(rawText); // Use rawText for display

  factory Notam.fromJson(Map<String, dynamic> json) {
    return Notam(
      id: json['id'],
      qCode: json['qCode'],
      rawText: json['rawText'],
      fieldD: json['fieldD'] ?? '',
      fieldE: json['fieldE'] ?? '',
      fieldF: json['fieldF'] ?? '',
      fieldG: json['fieldG'] ?? '',
      validFrom: DateTime.parse(json['validFrom']),
      validTo: DateTime.parse(json['validTo']),
      icao: json['icao'],
      type: NotamType.values.firstWhere((e) => e.name == json['type']),
      group: NotamGroup.values.firstWhere((e) => e.name == json['group']),
      isPermanent: json['isPermanent'] ?? false,
      source: json['source'] ?? 'faa',
      isCritical: json['isCritical'] ?? false,
    );
  }

  factory Notam.fromFaaJson(Map<String, dynamic> json) {
    // Parse the actual FAA API JSON format
    final properties = json['properties'];
    if (properties == null) {
      throw Exception('Invalid NOTAM data: properties object is null');
    }

    final coreNotamData = properties['coreNOTAMData'];
    if (coreNotamData == null) {
      throw Exception('Invalid NOTAM data: coreNOTAMData object is null');
    }

    final notam = coreNotamData['notam'];
    if (notam == null) {
      throw Exception('Invalid NOTAM data: notam object is null');
    }

    // Verbose NOTAM logging removed to focus on TAF parsing

    // Safely parse dates, providing defaults if they are null.
    final validFromStr = notam['effectiveStart'];
    final validToStr = notam['effectiveEnd'];

    DateTime validFrom;
    DateTime validTo;
    
    try {
      validFrom = validFromStr != null ? DateTime.parse(validFromStr) : DateTime.now();
    } catch (e) {
      debugPrint('Error parsing effectiveStart date: $validFromStr - $e');
      validFrom = DateTime.now();
    }

    try {
      if (validToStr == 'PERM' || validToStr == 'PERMANENT') {
        // Permanent NOTAM - set to a far future date
        validTo = DateTime.now().add(const Duration(days: 365 * 10));
      } else {
        validTo = validToStr != null ? DateTime.parse(validToStr) : DateTime.now().add(const Duration(days: 365 * 10));
      }
    } catch (e) {
      debugPrint('Error parsing effectiveEnd date: $validToStr - $e');
      validTo = DateTime.now().add(const Duration(days: 365 * 10));
    }
    
    // Check if this is a permanent NOTAM
    final isPermanent = validToStr == 'PERM' || validToStr == 'PERMANENT';
    
    // Extract Q code and complete ICAO text from notamTranslation
    String? qCode;
    String completeIcaoText = '';
    final translations = coreNotamData['notamTranslation'] as List?;
    if (translations != null) {
      // Translation logging removed to focus on TAF parsing
      for (final translation in translations) {
        if (translation['type'] == 'ICAO') {
          final formattedText = translation['formattedText'] as String?;
          if (formattedText != null) {
            completeIcaoText = formattedText;
            qCode = extractQCode(formattedText);
            if (qCode != null) break;
          }
        }
      }
    }
    
    // Fallback to text field if no Q code found in translations
    if (qCode == null) {
      qCode = extractQCode(notam['text'] ?? '');
    }
    
    // Extract the main operational description (Field E) from FAA API text
    String fieldE = notam['text'] ?? '';
    
    // Extract schedule information for Field D (time periods within validity)
    String fieldD = '';
    final schedule = notam['schedule'] as String?;
    if (schedule != null && schedule.isNotEmpty) {
      fieldD = schedule;
    }
    
    // Extract altitude/limit information for Fields F and G
    String fieldF = '';
    String fieldG = '';
    
    // Use the FAA API's structured altitude fields directly
    final lowerLimit = notam['lowerLimit'] as String?;
    final upperLimit = notam['upperLimit'] as String?;
    
    if (lowerLimit != null && lowerLimit.isNotEmpty) {
      fieldF = lowerLimit;
    }
    
    if (upperLimit != null && upperLimit.isNotEmpty) {
      fieldG = upperLimit;
    }
    
    // Only fall back to ICAO F) and G) fields if FAA API doesn't have them
    if (fieldF.isEmpty && fieldG.isEmpty && completeIcaoText.isNotEmpty) {
      final fields = _extractIcaoFields(completeIcaoText);
      fieldF = fields['F'] ?? '';
      fieldG = fields['G'] ?? '';
    }
    
    // Use the original FAA API text as rawText (no enhancement needed)
    String rawText = fieldE;
    
    // Verbose NOTAM field logging removed to focus on TAF parsing
    
    // Determine NOTAM type - prefer Q code over text-based classification
    NotamType type = determineTypeFromQCode(qCode);
    
    // Fallback to text-based classification if no Q code found
    if (type == NotamType.other) {
      if (rawText.toLowerCase().contains('rwy') || rawText.toLowerCase().contains('runway')) {
        type = NotamType.runway;
      } else if (rawText.toLowerCase().contains('navaid') || rawText.toLowerCase().contains('ils')) {
        type = NotamType.navaid;
      } else if (rawText.toLowerCase().contains('airspace')) {
        type = NotamType.airspace;
      }
    }

    // Determine NOTAM group based on Q code
    NotamGroup group = determineGroupFromQCode(qCode);

    return Notam(
      id: notam['number'] ?? 'N/A',
      qCode: qCode,
      rawText: rawText,
      fieldD: fieldD,
      fieldE: fieldE,
      fieldF: fieldF,
      fieldG: fieldG,
      validFrom: validFrom,
      validTo: validTo,
      icao: notam['location'] ?? 'N/A',
      type: type,
      group: group,
      isPermanent: isPermanent,
      source: 'faa',
      isCritical: false, // FAA NOTAMs are not critical by default
    );
  }

  factory Notam.fromDbJson(Map<String, dynamic> json) {
    return Notam(
      id: json['id'],
      qCode: json['qCode'],
      rawText: json['rawText'],
      fieldD: json['fieldD'] ?? '',
      fieldE: json['fieldE'] ?? '',
      fieldF: json['fieldF'] ?? '',
      fieldG: json['fieldG'] ?? '',
      validFrom: DateTime.parse(json['validFrom']),
      validTo: DateTime.parse(json['validTo']),
      icao: json['icao'],
      type: NotamType.values.firstWhere((e) => e.name == json['type']),
      group: NotamGroup.values.firstWhere((e) => e.name == json['group']),
      isPermanent: json['isPermanent'] ?? false,
      source: json['source'] ?? 'faa',
      isCritical: json['isCritical'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'qCode': qCode,
      'rawText': rawText,
      'fieldD': fieldD,
      'fieldE': fieldE,
      'fieldF': fieldF,
      'fieldG': fieldG,
      'validFrom': validFrom.toIso8601String(),
      'validTo': validTo.toIso8601String(),
      'icao': icao,
      'type': type.name,
      'group': group.name,
      'isPermanent': isPermanent,
      'source': source,
      'isCritical': isCritical,
    };
  }

  Map<String, dynamic> toDbJson(String flightId) {
    return {
      'flightId': flightId,
      'id': id,
      'icao': icao,
      'type': type.name,
      'validFrom': validFrom.toIso8601String(),
      'validTo': validTo.toIso8601String(),
      'rawText': rawText,
      'decodedText': '', // Decoded text is not stored in DB for NOTAMs
      'affectedSystem': '', // No direct mapping for affectedSystem in NOTAMs
      'isCritical': isCritical,
      'qCode': qCode,
      'fieldD': fieldD,
      'fieldE': fieldE,
      'fieldF': fieldF,
      'fieldG': fieldG,
      'group': group.name,
      'source': 'faa', // Assuming source is always FAA for NOTAMs
      'isPermanent': isPermanent,
    };
  }
} 

/// Represents the hide/flag status of a NOTAM
class NotamStatus {
  final String notamId;
  final bool isHidden;
  final bool isFlagged;
  final DateTime? hiddenAt;
  final DateTime? flaggedAt;
  final String? flightContext; // null for permanent, flight ID for per-flight

  const NotamStatus({
    required this.notamId,
    this.isHidden = false,
    this.isFlagged = false,
    this.hiddenAt,
    this.flaggedAt,
    this.flightContext,
  });

  /// Create a copy with updated values
  NotamStatus copyWith({
    String? notamId,
    bool? isHidden,
    bool? isFlagged,
    DateTime? hiddenAt,
    DateTime? flaggedAt,
    String? flightContext,
  }) {
    return NotamStatus(
      notamId: notamId ?? this.notamId,
      isHidden: isHidden ?? this.isHidden,
      isFlagged: isFlagged ?? this.isFlagged,
      hiddenAt: hiddenAt ?? this.hiddenAt,
      flaggedAt: flaggedAt ?? this.flaggedAt,
      flightContext: flightContext ?? this.flightContext,
    );
  }

  /// Convert to JSON for storage
  Map<String, dynamic> toJson() {
    return {
      'notamId': notamId,
      'isHidden': isHidden,
      'isFlagged': isFlagged,
      'hiddenAt': hiddenAt?.toIso8601String(),
      'flaggedAt': flaggedAt?.toIso8601String(),
      'flightContext': flightContext,
    };
  }

  /// Create from JSON for storage
  factory NotamStatus.fromJson(Map<String, dynamic> json) {
    return NotamStatus(
      notamId: json['notamId'] as String,
      isHidden: json['isHidden'] as bool? ?? false,
      isFlagged: json['isFlagged'] as bool? ?? false,
      hiddenAt: json['hiddenAt'] != null ? DateTime.parse(json['hiddenAt'] as String) : null,
      flaggedAt: json['flaggedAt'] != null ? DateTime.parse(json['flaggedAt'] as String) : null,
      flightContext: json['flightContext'] as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is NotamStatus &&
        other.notamId == notamId &&
        other.isHidden == isHidden &&
        other.isFlagged == isFlagged &&
        other.hiddenAt == hiddenAt &&
        other.flaggedAt == flaggedAt &&
        other.flightContext == flightContext;
  }

  @override
  int get hashCode {
    return Object.hash(notamId, isHidden, isFlagged, hiddenAt, flaggedAt, flightContext);
  }

  @override
  String toString() {
    return 'NotamStatus(notamId: $notamId, isHidden: $isHidden, isFlagged: $isFlagged, flightContext: $flightContext)';
  }
} 
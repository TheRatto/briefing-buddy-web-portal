import '../models/notam.dart';

class NotamGroupMetadata {
  final NotamGroup group;
  final List<String> keywords;
  final int priority;
  final Map<String, double> weights;
  
  const NotamGroupMetadata({
    required this.group,
    required this.keywords,
    required this.priority,
    this.weights = const {},
  });
}

class NotamGroupingService {
  static final NotamGroupingService _instance = NotamGroupingService._internal();
  factory NotamGroupingService() => _instance;
  NotamGroupingService._internal();

  // Group metadata with keywords and priorities
  static const List<NotamGroupMetadata> _groupMetadata = [
    NotamGroupMetadata(
      group: NotamGroup.runways,
      priority: 1,
      keywords: [
        'RWY', 'RWY CLOSED', 'RUNWAY CLOSED', 'RWY U/S', 'RUNWAY U/S', 'RUNWAY UNSERVICEABLE',
        'RWY UNSERVICEABLE', 'DISPLACED', 'MISSING',
        'BRAKING ACTION', 'CONTAMINANTS', 'TORA', 'TODA', 'ASDA', 'LDA', 'DECLARED DISTANCE',
        'THRESHOLD', 'DISPLACED THRESHOLD', 'RUNWAY LENGTH', 'RUNWAY WIDTH',
        'RUNWAY LIGHTING', 'RUNWAY LIGHTS', 'HIRL', 'HIGH INTENSITY RUNWAY LIGHTING',
        'REIL', 'PAPI', 'PRECISION APPROACH PATH INDICATOR', 'VASI', 'VASIS',
        'RUNWAY END IDENTIFIER LIGHTS', 'THRESHOLD LIGHTS', 'TOUCHDOWN ZONE LIGHTS',
        'ACR', 'PCR', 'AIRCRAFT CLASSIFICATION RATING', 'PAVEMENT CLASSIFICATION RATING',
      ],
      weights: {
        'RWY': 5.0,
        'RWY CLOSED': 10.0,
        'RUNWAY CLOSED': 10.0,
        'RWY U/S': 8.0,
        'RUNWAY U/S': 8.0,
        'RWY UNSERVICEABLE': 8.0,
        'RUNWAY UNSERVICEABLE': 8.0,
        'HIRL': 4.0,
        'PAPI': 4.0,
        'VASI': 4.0,
        'ACR': 3.0,
        'PCR': 3.0,
        // Down-weight generic
        'LIGHTING': 0.5,
        'LIGHTS': 0.5,
      },
    ),
    NotamGroupMetadata(
      group: NotamGroup.taxiways,
      priority: 2,
      keywords: [
        'TAXIWAY', 'TWY', 'TAXIWAY CLOSED', 'TAXIWAY U/S', 'TAXIWAY UNSERVICEABLE',
        'APRON', 'PARKING', 'AIRCRAFT STAND', 'STAND', 'GATE', 'PARKING AREA',
        'APRON CLOSED', 'PARKING CLOSED', 'STAND CLOSED', 'GATE CLOSED',
        'TAXIWAY LIGHTING', 'TAXIWAY LIGHTS', 'TAXIWAY CENTERLINE', 'TAXIWAY EDGE',
        'MOVEMENT AREA', 'MANOEUVRING AREA', 'OPERATIONAL AREA',
        'ACR', 'PCR', 'AIRCRAFT CLASSIFICATION RATING', 'PAVEMENT CLASSIFICATION RATING',
      ],
      weights: {
        'TAXIWAY': 5.0,
        'TWY': 5.0,
        'TAXIWAY CLOSED': 8.0,
        'TAXIWAY U/S': 6.0,
        'TAXIWAY UNSERVICEABLE': 6.0,
        'APRON': 5.0,
        'PARKING': 5.0,
        'AIRCRAFT STAND': 5.0,
        'APRON CLOSED': 8.0,
        'PARKING CLOSED': 8.0,
        'STAND CLOSED': 8.0,
        'GATE CLOSED': 8.0,
        'ACR': 3.0,
        'PCR': 3.0,
        // Down-weight generic
        'LIGHTING': 0.5,
        'LIGHTS': 0.5,
      },
    ),
    NotamGroupMetadata(
      group: NotamGroup.instrumentProcedures,
      priority: 3,
      keywords: [
        'ILS', 'INSTRUMENT LANDING SYSTEM', 'LOCALIZER', 'GLIDE PATH', 'GLIDEPATH',
        'INNER MARKER', 'MIDDLE MARKER', 'OUTER MARKER', 'MARKER',
        'VOR', 'NDB', 'NON-DIRECTIONAL BEACON', 'DME', 'DISTANCE MEASURING EQUIPMENT',
        'TACAN', 'VORTAC', 'OMEGA', 'DECCA',
        'INSTRUMENT APPROACH', 'MINIMA', 'DA', 'MDA', 'DECISION ALTITUDE',
        'MINIMUM DESCENT ALTITUDE', 'MINIMUMS', 'MINIMUM', 'CATEGORY', 'CAT I', 'CAT II', 'CAT III',
        'MLS', 'MICROWAVE LANDING SYSTEM',
        'NAVAID', 'NAVIGATION AID', 'RADIO NAVIGATION',
        'SID', 'STANDARD INSTRUMENT DEPARTURE', 'STAR', 'STANDARD ARRIVAL',
        'DEPARTURE PROCEDURE', 'ARRIVAL PROCEDURE',
        'INSTRUMENT PROCEDURE', 'VISUAL PROCEDURE', 'MISSED APPROACH',
        'HOLDING PROCEDURE', 'HOLDING PATTERN', 'TRANSITION', 'TRANSITION PROCEDURE',
        'RNAV', 'RNP', 'PBN', 'PRECISION', 'NON-PRECISION', 'CIRCLING',
        'VISUAL APPROACH', 'CONTACT APPROACH',
        'RESTRICTED', 'PROHIBITED', 'DANGER AREA', 'RESTRICTED AREA',
        'PROHIBITED AREA', 'TEMPORARY', 'TRA', 'TEMPORARY RESERVED AIRSPACE',
        'MILITARY', 'MIL', 'MOA', 'MILITARY OPERATING AREA', 'EXERCISE',
        'TRAINING', 'PRACTICE', 'AEROBATICS', 'AEROBATIC',
        'GPS', 'GNSS', 'GLOBAL POSITIONING SYSTEM',
        'SATELLITE', 'SATELLITES', 'POSITIONING',
        'AIRSPACE', 'CONTROL AREA', 'CONTROL ZONE', 'FLIGHT INFORMATION REGION',
        'UPPER CONTROL AREA', 'TERMINAL CONTROL AREA', 'ATZ', 'AERODROME TRAFFIC ZONE',
        'AIRSPACE RESERVATION', 'AIRSPACE ACTIVATION', 'AIRSPACE DEACTIVATION',
        // Specific phrases
        'PAPI UNAVAILABLE', 'RNAV NOT AVAILABLE',
      ],
      weights: {
        'ILS': 5.0,
        'VOR': 3.0,
        'NDB': 3.0,
        'DME': 3.0,
        'LOCALIZER': 3.0,
        'GLIDE PATH': 3.0,
        'SID': 3.0,
        'STAR': 3.0,
        'RNAV': 3.0,
        'GPS': 3.0,
        'RESTRICTED': 4.0,
        'PROHIBITED': 4.0,
        'MILITARY': 4.0,
        'MOA': 4.0,
        'AIRSPACE': 3.0,
        'MINIMUMS': 2.0,
        'MINIMUM': 2.0,
        'INSTRUMENT LANDING SYSTEM': 5.0,
        'INSTRUMENT APPROACH': 4.0,
        'NAVIGATION AID': 3.0,
        'NAVAID': 3.0,
        // Down-weight generic
        'UNSERVICEABLE': 0.1,
      },
    ),
    NotamGroupMetadata(
      group: NotamGroup.airportServices,
      priority: 4,
      keywords: [
        'AIRPORT CLOSED', 'AERODROME CLOSED', 'NOT AVBL', 'NOT AVAILABLE',
        'AVAILABLE', 'AVBL', 'OPERATIONAL', 'OPR', 'OPERATING', 'OPERATION',
        'ATC', 'AIR TRAFFIC CONTROL', 'TWR', 'TOWER', 'GND', 'GROUND', 'APP',
        'ATIS', 'AUTOMATIC TERMINAL INFORMATION SERVICE', 'FIS', 'FLIGHT INFORMATION SERVICE',
        'FUEL', 'FUEL NOT AVAILABLE', 'FUEL UNAVAILABLE', 'AVGAS', 'JET A1',
        'FIRE', 'FIRE FIGHTING', 'RESCUE', 'FIRE CATEGORY', 'FIRE SERVICE',
        'DRONE', 'DRONES', 'DRONE HAZARD', 'BIRD HAZARD',
        'FACILITY', 'FACILITIES',
        'LIGHTING', 'LIGHTS', 'AERODROME BEACON', 'APPROACH LIGHTING', 'APPROACH LIGHTS',
        'ALS', 'APPROACH LIGHTING SYSTEM', 'CENTERLINE', 'CENTER LINE', 'EDGE LIGHTS',
        'SEQUENCED FLASHING', 'PILOT CONTROLLED', 'HIGH INTENSITY', 'MEDIUM INTENSITY', 'LOW INTENSITY',
        'HELICOPTER', 'HELIPORT', 'HELIPORT LIGHTING', 'HELICOPTER APPROACH',
        'PPR', 'PRIOR PERMISSION REQUIRED', 'CURFEW', 'NOISE ABATEMENT',
      ],
      weights: {
        'AIRPORT CLOSED': 10.0, // Very high weight for closures
        'AERODROME CLOSED': 10.0,
        'FUEL': 5.0,
        'FIRE': 4.0,
        'ATC': 3.0,
        'TWR': 3.0,
        'TOWER': 3.0,
        'GROUND': 3.0,
        'ATIS': 1.0,
        'AERODROME BEACON': 3.0,
        'APPROACH LIGHTING': 3.0,
        'APPROACH LIGHTING SYSTEM': 3.0,
        'CENTERLINE': 2.0,
        'CENTER LINE': 2.0,
        'EDGE LIGHTS': 2.0,
        'SEQUENCED FLASHING': 2.0,
        'PILOT CONTROLLED': 2.0,
        'HIGH INTENSITY': 2.0,
        'MEDIUM INTENSITY': 2.0,
        'LOW INTENSITY': 2.0,
        // Down-weight generic
        'LIGHTING': 0.5,
        'LIGHTS': 0.5,
        'UNSERVICEABLE': 0.1,
      },
    ),
    NotamGroupMetadata(
      group: NotamGroup.lighting,
      priority: 5,
      keywords: [
        'LIGHTING', 'LIGHTS', 'LIGHT', 'LGT', 'LGT U/S', 'LIGHT U/S', 'LIGHTING U/S',
        'RUNWAY LIGHTING', 'RUNWAY LIGHTS', 'HIRL', 'HIGH INTENSITY RUNWAY LIGHTING',
        'REIL', 'RUNWAY END IDENTIFIER LIGHTS', 'THRESHOLD LIGHTS', 'TOUCHDOWN ZONE LIGHTS',
        'PAPI', 'PRECISION APPROACH PATH INDICATOR', 'VASI', 'VASIS',
        'APPROACH LIGHTING', 'APPROACH LIGHTS', 'ALS', 'APPROACH LIGHTING SYSTEM',
        'TAXIWAY LIGHTING', 'TAXIWAY LIGHTS', 'CENTERLINE LIGHTS', 'EDGE LIGHTS',
        'CENTER LINE LIGHTS', 'CENTERLINE LIGHTING', 'EDGE LIGHTING',
        'STOPWAY LIGHTS', 'STOPWAY LIGHTING', 'STOP LIGHTS',
        'AERODROME BEACON', 'BEACON', 'ROTATING BEACON',
        'PILOT CONTROLLED LIGHTING', 'PCL', 'PILOT CONTROLLED',
        'SEQUENCED FLASHING LIGHTS', 'SFL', 'SEQUENCED FLASHING',
        'LANDING DIRECTION INDICATOR', 'LDI', 'LANDING DIRECTION',
        'RUNWAY ALIGNMENT INDICATOR', 'RAI', 'RUNWAY ALIGNMENT',
        'HELICOPTER APPROACH PATH INDICATOR', 'HAPI', 'HELICOPTER APPROACH',
        'HELIPORT LIGHTING', 'HELIPORT LIGHTS',
        'LOW INTENSITY', 'MEDIUM INTENSITY', 'HIGH INTENSITY',
        'CAT II', 'CAT III', 'CATEGORY II', 'CATEGORY III',
        'LIGHT FAILURE', 'LIGHT OUT', 'LIGHTS OUT', 'LIGHTING FAILURE',
        'TEMPORARY LIGHTING', 'TEMP LIGHTING', 'TEMP LIGHTS',
        'BLUE LIGHTS', 'BLUE LIGHTING', 'YELLOW LIGHTS', 'YELLOW LIGHTING',
        'WHITE LIGHTS', 'WHITE LIGHTING', 'RED LIGHTS', 'RED LIGHTING',
        'GREEN LIGHTS', 'GREEN LIGHTING', 'AMBER LIGHTS', 'AMBER LIGHTING',
      ],
      weights: {
        'RUNWAY LIGHTING': 8.0,
        'RUNWAY LIGHTS': 8.0,
        'HIRL': 7.0,
        'HIGH INTENSITY RUNWAY LIGHTING': 7.0,
        'PAPI': 6.0,
        'PRECISION APPROACH PATH INDICATOR': 6.0,
        'VASI': 6.0,
        'VASIS': 6.0,
        'REIL': 6.0,
        'RUNWAY END IDENTIFIER LIGHTS': 6.0,
        'APPROACH LIGHTING': 5.0,
        'APPROACH LIGHTS': 5.0,
        'ALS': 5.0,
        'APPROACH LIGHTING SYSTEM': 5.0,
        'TAXIWAY LIGHTING': 4.0,
        'TAXIWAY LIGHTS': 4.0,
        'CENTERLINE LIGHTS': 4.0,
        'CENTER LINE LIGHTS': 4.0,
        'EDGE LIGHTS': 4.0,
        'AERODROME BEACON': 3.0,
        'BEACON': 3.0,
        'ROTATING BEACON': 3.0,
        'PILOT CONTROLLED LIGHTING': 3.0,
        'PCL': 3.0,
        'SEQUENCED FLASHING LIGHTS': 3.0,
        'SFL': 3.0,
        'LANDING DIRECTION INDICATOR': 3.0,
        'LDI': 3.0,
        'RUNWAY ALIGNMENT INDICATOR': 3.0,
        'RAI': 3.0,
        'HELICOPTER APPROACH PATH INDICATOR': 3.0,
        'HAPI': 3.0,
        'HELIPORT LIGHTING': 3.0,
        'HELIPORT LIGHTS': 3.0,
        'LIGHT FAILURE': 2.0,
        'LIGHT OUT': 2.0,
        'LIGHTS OUT': 2.0,
        'LIGHTING FAILURE': 2.0,
        'TEMPORARY LIGHTING': 2.0,
        'TEMP LIGHTING': 2.0,
        'TEMP LIGHTS': 2.0,
        'HIGH INTENSITY': 2.0,
        'MEDIUM INTENSITY': 2.0,
        'LOW INTENSITY': 2.0,
        // Down-weight generic
        'LIGHTING': 0.5,
        'LIGHTS': 0.5,
        'LIGHT': 0.5,
        'LGT': 0.5,
        'UNSERVICEABLE': 0.1,
      },
    ),
    NotamGroupMetadata(
      group: NotamGroup.hazards,
      priority: 6,
      keywords: [
        'OBSTACLE', 'OBSTACLES', 'CRANE', 'CRANES', 'CONSTRUCTION', 'BUILDING',
        'TOWER', 'TOWERS', 'MAST', 'MASTS', 'ANTENNA', 'ANTENNAE',
        'UNLIT', 'UNLIGHTED', 'LIGHT FAILURE', 'OBSTACLE LIGHT', 'OBSTACLE LIGHTS',
        'HAZARD', 'HAZARDS', 'DANGER', 'DANGEROUS', 'WILDLIFE', 'BIRD STRIKE',
        'BIRD STRIKES', 'ANIMAL', 'ANIMALS',
        'WORK', 'WORKING', 'REPAIR', 'REPAIRS',
        // Specific phrases
        'BIRD HAZARD', 'BIRD STRIKE',
      ],
      weights: {
        'CRANE': 5.0,
        'CRANES': 5.0,
        'OBSTACLE': 3.0,
        'OBSTACLES': 3.0,
        'HAZARD': 2.0,
        'HAZARDS': 2.0,
        'BIRD STRIKE': 4.0,
        'BIRD HAZARD': 4.0,
        'WILDLIFE': 3.0,
        'CONSTRUCTION': 3.0,
        'WORK': 2.0,
        'WORKING': 2.0,
        'REPAIR': 2.0,
        'REPAIRS': 2.0,
        'MAINTENANCE': 2.0,
        // Down-weight generic
        'UNSERVICEABLE': 0.1,
      },
    ),
    NotamGroupMetadata(
      group: NotamGroup.admin,
      priority: 7,
      keywords: [
        'CURFEW', 'NOISE ABATEMENT', 'NOISE RESTRICTION',
        'PPR', 'PRIOR PERMISSION REQUIRED', 'SLOT', 'SLOTS', 'SLOT RESTRICTION',
        'RESTRICTION', 'RESTRICTIONS', 'LIMITATION', 'LIMITATIONS',
        'ADMINISTRATION', 'ADMINISTRATIVE', 'ADMINISTRATIVE PROCEDURE',
        'FREQUENCY', 'FREQUENCIES', 'ATIS',
        'INFORMATION SERVICE',
        'PROCEDURAL',
        'OIP', 'AIP', 'AERONAUTICAL INFORMATION PUBLICATION',
      ],
      weights: {
        'CURFEW': 3.0,
        'PPR': 3.0,
        'PRIOR PERMISSION REQUIRED': 3.0,
        'SLOT': 3.0,
        'SLOT RESTRICTION': 3.0,
        'NOISE ABATEMENT': 2.0,
        'NOISE RESTRICTION': 2.0,
        'ADMINISTRATION': 2.0,
        'ADMINISTRATIVE': 2.0,
        'ADMINISTRATIVE PROCEDURE': 3.0,
        'FREQUENCY': 5.0,
        'FREQUENCIES': 5.0,
        'ATIS': 5.0,
        'OIP': 2.0,
        'AIP': 2.0,
        'AERONAUTICAL INFORMATION PUBLICATION': 2.0,
        'PROCEDURAL': 2.0,
        'INFORMATION SERVICE': 2.0,
        // Down-weight generic
        'RESTRICTION': 0.1,
        'RESTRICTIONS': 0.1,
        'LIMITATION': 0.1,
        'LIMITATIONS': 0.1,
      },
    ),
    NotamGroupMetadata(
      group: NotamGroup.other,
      priority: 8,
      keywords: [],
      weights: {},
    ),
    NotamGroupMetadata(
      group: NotamGroup.other,
      priority: 9,
      keywords: [],
      weights: {},
    ),
  ];

  /// Assign a group to a NOTAM based on its Q code or text analysis
  NotamGroup assignGroup(Notam notam) {
    // First try Q code classification
    if (notam.qCode != null) {
      return notam.group;
    }
    
    // Fallback to text-based classification using scoring
    return _classifyByTextScoring(notam.rawText);
  }

  /// Calculate score for a group based on keyword matches (phrase-first, longest-first)
  double _calculateGroupScore(String text, NotamGroupMetadata metadata) {
    double totalScore = 0.0;
    // Special regex-based phrase matching for runways
    if (metadata.group == NotamGroup.runways) {
      final regexes = [
        RegExp(r'RUNWAY [0-9/ ]+UNSERVICEABLE', caseSensitive: false),
        RegExp(r'RUNWAY [0-9/ ]+U/S', caseSensitive: false),
        RegExp(r'DECLARED DISTANCE(S)? .*RUNWAY', caseSensitive: false),
      ];
      for (final regex in regexes) {
        if (regex.hasMatch(text)) {
          totalScore += 8.0;
          text = text.replaceAll(regex, '');
        }
      }
    }
    // Sort keywords by length descending (phrase-first)
    final sortedKeywords = List<String>.from(metadata.keywords)
      ..sort((a, b) => b.length.compareTo(a.length));
    for (final keyword in sortedKeywords) {
      // Use regex with word boundaries for whole word matching
      final pattern = RegExp(r'\b' + RegExp.escape(keyword) + r'\b', caseSensitive: false);
      if (pattern.hasMatch(text)) {
        // Get weight for this keyword (default to 1.0 if not specified)
        final weight = metadata.weights[keyword] ?? 1.0;
        totalScore += weight;
        // Remove matched keyword from text to avoid double-counting overlapping matches
        text = text.replaceAll(RegExp(keyword, caseSensitive: false), '');
      }
    }
    return totalScore;
  }

  /// Classify NOTAM by text analysis using scoring system (with threshold)
  NotamGroup _classifyByTextScoring(String text) {
    final upperText = text.toUpperCase();
    NotamGroup? bestGroup;
    double bestScore = 0.0;
    int bestPriority = 999; // Lower priority = higher importance
    
    print('DEBUG: Classifying text: "$upperText"');
    
    for (final metadata in _groupMetadata) {
      final score = _calculateGroupScore(upperText, metadata);
      print('DEBUG: ${metadata.group}: score=$score, priority=${metadata.priority}');
      if (score > bestScore || (score == bestScore && metadata.priority < bestPriority)) {
        bestScore = score;
        bestPriority = metadata.priority;
        bestGroup = metadata.group;
      }
    }
    print('DEBUG: Best group: $bestGroup with score: $bestScore');
    
    // Only assign a group if score > 0, else Other
    if (bestScore > 0.0 && bestGroup != null) {
      return bestGroup;
    }
    return NotamGroup.other;
  }

  /// Get confidence score for text-based classification (0.0 to 1.0)
  double getTextClassificationConfidence(String text, NotamGroup group) {
    final upperText = text.toUpperCase();
    final metadata = _groupMetadata.firstWhere((m) => m.group == group);
    
    if (metadata.keywords.isEmpty) return 0.0;
    
    final score = _calculateGroupScore(upperText, metadata);
    final maxPossibleScore = metadata.keywords.length.toDouble(); // Assuming all keywords have weight 1.0
    
    return score / maxPossibleScore;
  }

  /// Get the display name for a group
  String getGroupDisplayName(NotamGroup group) {
    switch (group) {
      case NotamGroup.runways:
        return '🛬 Runways (Critical)';
      case NotamGroup.taxiways:
        return '🛣️ Taxiways';
      case NotamGroup.instrumentProcedures:
        return '📡 Instrument Procedures';
      case NotamGroup.airportServices:
        return '🏢 Airport Services';
      case NotamGroup.lighting:
        return '💡 Lighting';
      case NotamGroup.hazards:
        return '⚠️ Hazards';
      case NotamGroup.admin:
        return '📑 Admin';
      case NotamGroup.other:
        return '🔧 Other';
      
      // FIR groups
      case NotamGroup.firAirspaceRestrictions:
        return '✈️ Airspace Restrictions';
      case NotamGroup.firAtcNavigation:
        return '📡 ATC & Navigation';
      case NotamGroup.firObstaclesCharts:
        return '🏗️ Obstacles & Charts';
      case NotamGroup.firInfrastructure:
        return '🏢 Infrastructure';
      case NotamGroup.firDroneOperations:
        return '🚁 Drone Operations';
      case NotamGroup.firAdministrative:
        return '📋 Administrative';
    }
  }

  /// Get the priority order for groups (lower number = higher priority)
  int getGroupPriority(NotamGroup group) {
    switch (group) {
      case NotamGroup.runways:
        return 1;
      case NotamGroup.taxiways:
        return 2;
      case NotamGroup.instrumentProcedures:
        return 3;
      case NotamGroup.airportServices:
        return 4;
      case NotamGroup.lighting:
        return 5;
      case NotamGroup.hazards:
        return 6;
      case NotamGroup.admin:
        return 7;
      case NotamGroup.other:
        return 8;
      
      // FIR groups (priorities 9-14)
      case NotamGroup.firAirspaceRestrictions:
        return 9;
      case NotamGroup.firAtcNavigation:
        return 10;
      case NotamGroup.firObstaclesCharts:
        return 11;
      case NotamGroup.firInfrastructure:
        return 12;
      case NotamGroup.firDroneOperations:
        return 13;
      case NotamGroup.firAdministrative:
        return 14;
    }
  }

  /// Get comprehensive keywords associated with a group for text-based classification
  List<String> getKeywordsForGroup(NotamGroup group) {
    final metadata = _groupMetadata.firstWhere((m) => m.group == group);
    return metadata.keywords;
  }

  /// Get Q codes associated with a group
  List<String> getQCodesForGroup(NotamGroup group) {
    switch (group) {
      case NotamGroup.runways:
        return ['MR', 'MS', 'MT', 'MU', 'MW', 'MD']; // Runway-specific Q codes
      case NotamGroup.taxiways:
        return ['MX', 'MY', 'MK', 'MN', 'MP']; // Taxiway, apron, parking Q codes
      case NotamGroup.instrumentProcedures:
        return ['IC', 'ID', 'IG', 'II', 'IL', 'IM', 'IN', 'IO', 'IS', 'IT', 'IU', 'IW', 'IX', 'IY',
                'NA', 'NB', 'NC', 'ND', 'NF', 'NL', 'NM', 'NN', 'NO', 'NT', 'NV',
                'PA', 'PB', 'PC', 'PD', 'PE', 'PH', 'PI', 'PK', 'PU',
                'AA', 'AC', 'AD', 'AE', 'AF', 'AH', 'AL', 'AN', 'AO', 'AP', 'AR', 'AT', 'AU', 'AV', 'AX', 'AZ',
                'RA', 'RD', 'RM', 'RO', 'RP', 'RR', 'RT', 'GA', 'GW'];
      case NotamGroup.airportServices:
        return ['FA', 'FF', 'FU', 'FM'];
      case NotamGroup.lighting:
        return ['LA', 'LB', 'LC', 'LD', 'LE', 'LF', 'LG', 'LH', 'LI', 'LJ', 'LK', 'LL', 'LM', 'LP', 
                'LR', 'LS', 'LT', 'LU', 'LV', 'LW', 'LX', 'LY', 'LZ'];
      case NotamGroup.hazards:
        return ['OB', 'OL', 'WA', 'WB', 'WC', 'WD', 'WE', 'WF', 'WG', 'WH', 'WJ', 'WL', 'WM', 'WP', 'WR', 'WS', 'WT', 'WU', 'WV', 'WW', 'WY', 'WZ'];
      case NotamGroup.admin:
        return ['PF', 'PL', 'PN', 'PO', 'PR', 'PT', 'PX', 'PZ'];
      case NotamGroup.other:
        return [];
      
      // FIR groups - Q codes based on observed patterns
      case NotamGroup.firAirspaceRestrictions:
        return ['EA', 'EB', 'EC', 'ED', 'EE', 'EF', 'EG', 'EH', 'EI', 'EJ', 'EK', 'EL', 'EM', 'EN', 'EO', 'EP', 'ER', 'ES', 'ET', 'EU', 'EV', 'EW', 'EX', 'EY', 'EZ'];
      case NotamGroup.firAtcNavigation:
        return ['LA', 'LB', 'LC', 'LD', 'LE', 'LF', 'LG', 'LH', 'LI', 'LJ', 'LK', 'LL', 'LM', 'LN', 'LO', 'LP', 'LR', 'LS', 'LT', 'LU', 'LV', 'LW', 'LX', 'LY', 'LZ'];
      case NotamGroup.firObstaclesCharts:
        return ['FA', 'FB', 'FC', 'FD', 'FE', 'FF', 'FG', 'FH', 'FI', 'FJ', 'FK', 'FL', 'FM', 'FN', 'FO', 'FP', 'FR', 'FS', 'FT', 'FU', 'FV', 'FW', 'FX', 'FY', 'FZ'];
      case NotamGroup.firInfrastructure:
        return ['HA', 'HB', 'HC', 'HD', 'HE', 'HF', 'HG', 'HH', 'HI', 'HJ', 'HK', 'HL', 'HM', 'HN', 'HO', 'HP', 'HR', 'HS', 'HT', 'HU', 'HV', 'HW', 'HX', 'HY', 'HZ'];
      case NotamGroup.firDroneOperations:
        return ['UA', 'UB', 'UC', 'UD', 'UE', 'UF', 'UG', 'UH', 'UI', 'UJ', 'UK', 'UL', 'UM', 'UN', 'UO', 'UP', 'UR', 'US', 'UT', 'UU', 'UV', 'UW', 'UX', 'UY', 'UZ'];
      case NotamGroup.firAdministrative:
        return ['GA', 'GB', 'GC', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GJ', 'GK', 'GL', 'GM', 'GN', 'GO', 'GP', 'GR', 'GS', 'GT', 'GU', 'GV', 'GW', 'GX', 'GY', 'GZ',
                'WA', 'WB', 'WC', 'WD', 'WE', 'WF', 'WG', 'WH', 'WI', 'WJ', 'WK', 'WL', 'WM', 'WN', 'WO', 'WP', 'WR', 'WS', 'WT', 'WU', 'WV', 'WW', 'WX', 'WY', 'WZ'];
    }
  }

  /// Sort NOTAMs within a group by time and significance
  List<Notam> sortNotamsInGroup(List<Notam> notams) {
    return List<Notam>.from(notams)
      ..sort((a, b) {
        // First sort by criticality (critical first)
        if (a.isCritical != b.isCritical) {
          return a.isCritical ? -1 : 1;
        }
        // Then sort by start time (earliest first)
        return a.validFrom.compareTo(b.validFrom);
      });
  }

  /// Group NOTAMs by their assigned group
  Map<NotamGroup, List<Notam>> groupNotams(List<Notam> notams) {
    final Map<NotamGroup, List<Notam>> groupedNotams = {};
    
    for (final notam in notams) {
      final group = notam.group;
      groupedNotams.putIfAbsent(group, () => []).add(notam);
    }
    
    // Sort NOTAMs within each group
    for (final group in groupedNotams.keys) {
      groupedNotams[group] = sortNotamsInGroup(groupedNotams[group]!);
    }
    
    return groupedNotams;
  }

  /// Get sorted groups by priority
  List<NotamGroup> getSortedGroups() {
    final groups = NotamGroup.values.toList();
    groups.sort((a, b) => getGroupPriority(a).compareTo(getGroupPriority(b)));
    return groups;
  }

  /// Get group statistics
  Map<NotamGroup, int> getGroupStatistics(List<Notam> notams) {
    final Map<NotamGroup, int> stats = {};
    
    for (final notam in notams) {
      stats[notam.group] = (stats[notam.group] ?? 0) + 1;
    }
    
    return stats;
  }

  /// Check if a NOTAM is operationally significant within its group
  bool isOperationallySignificant(Notam notam) {
    // Critical NOTAMs are always significant
    if (notam.isCritical) return true;
    
    // Check for significant keywords in the raw text
    final text = notam.rawText.toUpperCase();
    final significantKeywords = ['CLOSED', 'U/S', 'UNSERVICEABLE', 'DISPLACED', 'LIMITED', 'MISSING'];
    
    return significantKeywords.any((keyword) => text.contains(keyword));
  }
} 
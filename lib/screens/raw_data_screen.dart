import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/haptic_service.dart';
import '../providers/flight_provider.dart';
import '../providers/settings_provider.dart';
import '../models/notam.dart';
import '../models/weather.dart';
import '../models/decoded_weather_models.dart';
import '../services/decoder_service.dart';
import '../services/taf_state_manager.dart';
import '../services/cache_manager.dart';
import '../services/fir_notam_service.dart';
import '../services/fir_notam_grouping_service.dart';
import '../widgets/global_drawer.dart';
import '../widgets/zulu_time_widget.dart';
import '../widgets/flip_card_widget.dart';
import '../widgets/taf_time_slider.dart';
import '../widgets/taf_airport_selector.dart';
import '../widgets/notam_grouped_list.dart';
import '../widgets/metar_tab.dart';
import 'input_screen.dart';
import 'briefing_tabs_screen.dart';
import 'package:flutter/foundation.dart';

class RawDataScreen extends StatefulWidget {
  const RawDataScreen({super.key});

  @override
  _RawDataScreenState createState() => _RawDataScreenState();
}

class _RawDataScreenState extends State<RawDataScreen> with TickerProviderStateMixin {
  // Tab controller for managing tabs
  late TabController _tabController;
  
  // Airport selection is now managed by FlightProvider
  // Store slider positions per airport
  final Map<String, double> _sliderPositions = {};
  Map<String, dynamic>? _activePeriods;
  
  // Time filter for NOTAMs
  String _selectedTimeFilter = '24 hours'; // Default to 24 hours
  final List<String> _timeFilterOptions = [
    '6 hours',
    '12 hours', 
    '24 hours',
    '72 hours',
    'All'
  ];
  
  // Scroll controller for TAFs2 tab
  final ScrollController _tafs2ScrollController = ScrollController();
  
  // TAF State Manager - handles all business logic
  final TafStateManager _tafStateManager = TafStateManager();
  
  // Unified cache manager for UI-level caching
  final CacheManager _cacheManager = CacheManager();
  

  
  
  

  

  

  
  // Generate hash for NOTAM data to detect changes
  String _generateNotamHash(List<Notam> notams) {
    if (notams.isEmpty) return 'empty';
    return '${notams.length}_${notams.first.hashCode}_${notams.last.hashCode}';
  }
  
  // Clear cache when switching airports or when data changes
  void _clearCache() {
    _tafStateManager.clearCache();
    _cacheManager.clearPrefix('notam_');
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    
    // Add listener to save last viewed Raw Data tab
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        final flightProvider = context.read<FlightProvider>();
        flightProvider.setLastViewedRawDataTab(_tabController.index);
      }
    });
    
    // Restore last viewed Raw Data tab if available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final flightProvider = context.read<FlightProvider>();
      if (flightProvider.lastViewedRawDataTab != null) {
        _tabController.animateTo(flightProvider.lastViewedRawDataTab!);
      }
    });
  }

  // Calculate responsive TAF card height based on screen size
  double _calculateResponsiveTafCardHeight(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    
    // Calculate logical screen dimensions
    final logicalHeight = screenHeight;
    final logicalWidth = screenWidth;
    
    // iPhone screen size detection based on logical dimensions
    // iPhone Pro Max: ~926 logical height, ~428 logical width
    // iPhone Pro: ~844 logical height, ~390 logical width
    // iPhone Standard: ~667 logical height, ~375 logical width
    
    double baseHeight;
    if (logicalHeight >= 900) {
      // iPhone Pro Max or larger
      baseHeight = 500.0;
    } else if (logicalHeight >= 800) {
      // iPhone Pro
      baseHeight = 450.0;
    } else {
      // iPhone Standard or smaller
      baseHeight = 400.0;
    }
    
    // Adjust based on available space (subtract tab bar, airport selector, slider, etc.)
    final availableHeight = logicalHeight - 200; // Approximate space for UI elements
    final calculatedHeight = (availableHeight * 0.7).clamp(350.0, baseHeight);
    
    debugPrint('DEBUG: Screen dimensions - Height: $logicalHeight, Width: $logicalWidth');
    debugPrint('DEBUG: Calculated TAF card height: $calculatedHeight');
    
    return calculatedHeight;
  }

  @override
  void dispose() {
    _tabController.dispose();
    _tafs2ScrollController.dispose();
    super.dispose();
  }



  void _onSliderChanged(double value, Weather taf, FlightProvider flightProvider) {
    setState(() {
      // Update the slider value for the current airport
      _sliderPositions[flightProvider.selectedAirport!] = value;
      
      // Get timeline from the selected TAF
      final timeline = taf.decodedWeather?.timeline ?? [];
      final forecastPeriods = taf.decodedWeather?.forecastPeriods ?? [];
      
      if (timeline.isNotEmpty && forecastPeriods.isNotEmpty) {
        // Convert slider value to timeline index
        final index = (value * (timeline.length - 1)).round();
        final selectedTime = timeline[index];
        
        // Find active periods at this time
        final decoder = DecoderService();
        _activePeriods = decoder.findActivePeriodsAtTime(selectedTime, forecastPeriods);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          backgroundColor: const Color(0xFF1E3A8A),
          foregroundColor: Colors.white,
          elevation: 0,
          title: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              ZuluTimeWidget(showIcon: false, compact: true, fontSize: 13),
              SizedBox(height: 2),
              Text(
                'Raw Data',
                style: TextStyle(fontSize: 18, color: Colors.white),
              ),
            ],
          ),
          centerTitle: true,
          actions: [
            Builder(
              builder: (context) => IconButton(
              icon: const Icon(Icons.menu, color: Colors.white),
              onPressed: () {
                  debugPrint('DEBUG: Hamburger menu pressed - opening end drawer');
                  Scaffold.of(context).openEndDrawer();
              },
              ),
            ),
          ],
        ),
        endDrawer: const GlobalDrawer(currentScreen: '/briefing'),
        body: Consumer<FlightProvider>(
          builder: (context, flightProvider, child) {
            final flight = flightProvider.currentFlight;
            if (flight == null) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.code_outlined,
                        size: 80,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Raw Weather Data',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E3A8A),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'No weather data available',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Generate a briefing to view METARs, TAFs, and NOTAMs in raw format.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 32),
                                              ElevatedButton.icon(
                          onPressed: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) => const InputScreen()),
                            );
                          },
                          icon: const Icon(Icons.add),
                          label: const Text('Start New Briefing'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1E3A8A),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'or',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextButton.icon(
                          onPressed: () {
                            // Switch to Home tab (index 0) in the parent BriefingTabsScreen
                            BriefingTabsScreen.switchToTab(context, 0);
                          },
                          icon: const Icon(Icons.history, size: 16),
                          label: const Text(
                            'Open Previous Briefing',
                            style: TextStyle(fontSize: 14),
                          ),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.grey[600],
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            }
            // Get airports from the flight data (all airports in the briefing)
            final airports = flight.airports.map((a) => a.icao).toList();
            // Initialize selected airport if not set or if current selection is invalid
            if (flightProvider.selectedAirport == null || !airports.contains(flightProvider.selectedAirport)) {
              if (airports.isNotEmpty) {
                flightProvider.setSelectedAirport(airports.first);
              }
            }
            return Column(
              children: [
                // Tab bar at top (matching Airport Detail Screen)
                Container(
                  color: Colors.white,
                  height: 45, // Reduced height from default ~48px to 40px
                  child: TabBar(
                    controller: _tabController,
                    isScrollable: false,
                    labelColor: const Color(0xFF1E3A8A),
                    unselectedLabelColor: Colors.grey,
                    indicatorColor: const Color(0xFF1E3A8A),
                    labelStyle: const TextStyle(fontSize: 12), // Smaller text
                    unselectedLabelStyle: const TextStyle(fontSize: 12), // Smaller text
                    tabs: const [
                      Tab(
                        icon: Icon(Icons.access_time, size: 18), // Smaller icon
                        text: 'TAFs',
                      ),
                      Tab(
                        icon: Icon(Icons.cloud, size: 18), // Smaller icon
                        text: 'METAR/ATIS',
                      ),
                      Tab(
                        icon: Icon(Icons.warning_amber_outlined, size: 18), // Smaller icon
                        text: 'NOTAMs',
                      ),
                      Tab(
                        icon: Icon(Icons.flight_takeoff, size: 18), // Smaller icon
                        text: 'FIR NOTAMs',
                      ),
                    ],
                  ),
                ),
                // Pill selector below tabs (Airports for all tabs, FIR for FIR NOTAMs tab)
                _buildPillSelector(context, flightProvider),
                // Tab content below
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // TAFs tab: timeline-based TAF display
                      _buildTabContent(
                        'TAFs',
                        flightProvider.isLoading && 
                        flightProvider.loadingAirport != null && 
                        flightProvider.selectedAirport == flightProvider.loadingAirport,
                        'Fetching TAF data for ${flightProvider.loadingAirport}...',
                        _buildTafs2Tab(context, flightProvider.tafsByIcao, flightProvider),
                      ),
                      RefreshIndicator(
                        onRefresh: () async {
                          _clearCache();
                          final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);
                          debugPrint('DEBUG: 🔄 RawDataScreen - NAIPS settings from SettingsProvider: enabled=${settingsProvider.naipsEnabled}, using rotating accounts');
                          await flightProvider.refreshCurrentData(
                            naipsEnabled: settingsProvider.naipsEnabled,
                            naipsUsername: null, // Using rotating accounts
                            naipsPassword: null, // Using rotating accounts
                          );
                          // One-time snackbar if NAIPS fallback was used
                          if (flightProvider.consumeNaipsFallbackUsed()) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('NAIPS unavailable. Showing API data.'),
                                behavior: SnackBarBehavior.floating,
                                duration: Duration(seconds: 3),
                              ),
                            );
                          }
                        },
                        child: _buildTabContent(
                          'METAR/ATIS',
                          flightProvider.isLoading && 
                          flightProvider.loadingAirport != null && 
                          flightProvider.selectedAirport == flightProvider.loadingAirport,
                          'Fetching METAR and ATIS data for ${flightProvider.loadingAirport}...',
                          MetarTab(),
                        ),
                      ),
                      // NOTAMs tab: grouped NOTAMs for selected airport
                      _buildTabContent(
                        'NOTAMs',
                        flightProvider.isLoading && 
                        flightProvider.loadingAirport != null && 
                        flightProvider.selectedAirport == flightProvider.loadingAirport,
                        'Fetching NOTAMs and airport data for ${flightProvider.loadingAirport}...',
                        _buildNotams2Tab(context, flight.notams, flightProvider),
                      ),
                      // FIR NOTAMs tab: ungrouped FIR NOTAMs
                      _buildTabContent(
                        'FIR NOTAMs',
                        flightProvider.isLoading,
                        'Fetching FIR NOTAMs...',
                        _buildFIRNotamsTab(context, flight.notams, flightProvider),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
    );
  }

  Widget _buildTafs2Tab(BuildContext context, Map<String, List<Weather>> tafsByIcao, FlightProvider flightProvider) {
    debugPrint('DEBUG: TAFs2 tab - METHOD CALLED!');
    
    // Get TAFs directly from the flight's weather data (like NOTAMs do)
    final flightWeather = flightProvider.currentFlight?.weather ?? [];
    final airportsToShow = flightProvider.selectedAirport != null 
        ? [flightProvider.selectedAirport!]
        : flightProvider.currentFlight?.airports.map((a) => a.icao).toList() ?? [];
    
    final tafsToShow = <String, List<Weather>>{};
    for (final airport in airportsToShow) {
      final airportTafs = flightWeather
          .where((w) => w.type == 'TAF' && w.icao == airport)
          .toList();
      if (airportTafs.isNotEmpty) {
        tafsToShow[airport] = airportTafs;
      }
    }
    
    // Check if we have any TAFs to show after filtering
    if (tafsToShow.isEmpty) {
      debugPrint('DEBUG: TAFs2 tab - No TAFs available after filtering, showing empty state');
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.timeline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text(
              'No TAFs Available',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              flightProvider.selectedAirport != null 
                  ? 'No TAFs for ${flightProvider.selectedAirport}'
                  : 'No terminal area forecasts available',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    // Check if we have a selected airport and TAFs for it
    if (flightProvider.selectedAirport == null || !tafsToShow.containsKey(flightProvider.selectedAirport)) {
      debugPrint('DEBUG: TAFs2 tab - No valid selected airport, showing empty state');
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.timeline, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'No Airport Selected',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Please select an airport to view TAFs',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    final selectedTaf = tafsToShow[flightProvider.selectedAirport!]!.first;
    final decodedTaf = selectedTaf.decodedWeather;
    debugPrint('DEBUG: TAFs2 tab - Selected TAF: ${selectedTaf.icao}');
    debugPrint('DEBUG: TAFs2 tab - Decoded TAF: ${decodedTaf != null}');

    // Get slider position for this airport
    final forecastPeriods = decodedTaf?.forecastPeriods ?? [];
    double sliderValue = _sliderPositions[flightProvider.selectedAirport!] ?? 0.0;
    
    debugPrint('DEBUG: Main build - forecastPeriods length: ${forecastPeriods.length}');
    debugPrint('DEBUG: Main build - forecastPeriods types: ${forecastPeriods.map((p) => '${p.type} (concurrent: ${p.isConcurrent})').toList()}');

    if (forecastPeriods.isNotEmpty) {
      // Calculate active periods for the current slider position
      final decoder = DecoderService();
      final timeline = selectedTaf.decodedWeather?.timeline ?? [];
      
      if (timeline.isNotEmpty) {
        final index = (sliderValue * (timeline.length - 1)).round();
        final selectedTime = timeline[index];
        _activePeriods = decoder.findActivePeriodsAtTime(selectedTime, forecastPeriods);
        debugPrint('DEBUG: TAFs2 tab - Active periods: $_activePeriods');
      }
    }
    
    debugPrint('DEBUG: TAFs2 tab - Building RefreshIndicator with SingleChildScrollView');
    return RefreshIndicator(
      onRefresh: () async {
        debugPrint('DEBUG: TAFs2 tab - Refresh triggered');
        
        // Clear all caches for fresh data
        _clearCache();
        
        // Get current scroll position to lock it
        final currentOffset = _tafs2ScrollController.offset;
        debugPrint('DEBUG: TAFs2 tab - Current scroll offset: $currentOffset');
        
        // Keep content locked in pulled-down position for a minimum duration
        await Future.delayed(const Duration(milliseconds: 1500));
        
        // Manually maintain scroll position during refresh
        if (_tafs2ScrollController.hasClients) {
          _tafs2ScrollController.jumpTo(currentOffset);
        }
        
        // Then perform the actual refresh
        final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);
        await flightProvider.refreshCurrentData(
          naipsEnabled: settingsProvider.naipsEnabled,
          naipsUsername: null, // Using rotating accounts
          naipsPassword: null, // Using rotating accounts
        );
        
        // Add a small delay after refresh completes for smooth transition
        await Future.delayed(const Duration(milliseconds: 500));
      },
      child: Column(
        children: [
          // Scrollable content area
          Expanded(
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              controller: _tafs2ScrollController,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  children: [
                    // Flip Card Widget - combines raw and decoded views
                    SizedBox(
                      height: _calculateResponsiveTafCardHeight(context),
                      child: RepaintBoundary(
                        child: FlipCardWidget(
                          key: ValueKey('flip_${flightProvider.selectedAirport}'),
                          taf: selectedTaf,
                          activePeriods: _activePeriods,
                          baseline: _activePeriods != null ? _activePeriods!['baseline'] as DecodedForecastPeriod? : null,
                          completeWeather: _activePeriods != null && _activePeriods!['baseline'] != null
                              ? _tafStateManager.getCompleteWeatherForPeriod(
                                  _activePeriods!['baseline'] as DecodedForecastPeriod,
                                  flightProvider.selectedAirport ?? '',
                                  sliderValue,
                                  forecastPeriods,
                                )
                              : null,
                          concurrentPeriods: _activePeriods != null ? _activePeriods!['concurrent'] as List<DecodedForecastPeriod>? : null,
                          tafStateManager: _tafStateManager,
                          airport: flightProvider.selectedAirport,
                          sliderValue: sliderValue,
                          allPeriods: forecastPeriods,
                          timeline: selectedTaf.decodedWeather?.timeline,
                          cardHeight: _calculateResponsiveTafCardHeight(context),
                        ),
                      ),
                    ),
                    
                    // Bottom padding for pull-to-refresh
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
          
          // Fixed Time Slider at bottom
          Container(
            height: 110, // Increased from 89 to accommodate time display above slider
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              border: Border(
                top: BorderSide(
                  color: Colors.grey.withValues(alpha: 0.2),
                  width: 1,
                ),
              ),
            ),
            child: RepaintBoundary(
              child: selectedTaf.decodedWeather?.timeline.isNotEmpty == true
                        ? TafTimeSlider(
                            timeline: selectedTaf.decodedWeather!.timeline,
                            sliderValue: sliderValue,
                            onChanged: (value) => _onSliderChanged(value, selectedTaf, flightProvider),
                            airportIcao: flightProvider.selectedAirport,
                          )
                  : const SizedBox(
                      height: 110,
                      child: Center(child: Text('No timeline available')),
                    ),
            ),
          ),
        ],
      ),
    );
  }












  








  void _showAddAirportDialog(BuildContext context) {
    final TextEditingController controller = TextEditingController();
    
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Add Airport'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Enter the ICAO code for the airport you want to add:'),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                decoration: const InputDecoration(
                  labelText: 'ICAO Code',
                  hintText: 'e.g., KJFK',
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.characters,
                maxLength: 4,
                onChanged: (value) {
                  // Auto-capitalize and limit to 4 characters
                  if (value.length > 4) {
                    controller.text = value.substring(0, 4).toUpperCase();
                    controller.selection = TextSelection.fromPosition(
                      TextPosition(offset: controller.text.length),
                    );
                  }
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final icao = controller.text.trim().toUpperCase();
                if (icao.length == 4) {
                  Navigator.of(context).pop();
                  
                  // Get the FlightProvider and add the airport
                  final flightProvider = context.read<FlightProvider>();
                  
                  final success = await flightProvider.addAirportToFlight(icao);
                  
                  if (success) {
                    // Success haptic feedback for airport addition
                    HapticService.lightImpact(context);
                    
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Airport $icao added successfully!'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  } else {
                    // Check if it's because the airport already exists
                    final currentFlight = flightProvider.currentFlight;
                    if (currentFlight?.airports.any((airport) => airport.icao == icao) == true) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Airport $icao is already in your flight plan'),
                          backgroundColor: Colors.orange,
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Failed to add airport $icao. Please try again.'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  }
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please enter a valid 4-letter ICAO code'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              },
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
  }

  void _showEditAirportDialog(BuildContext context, String airport) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Edit Airport'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('What would you like to do with airport $airport?'),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).pop();
                        _showEditAirportCodeDialog(context, airport);
                      },
                      icon: const Icon(Icons.edit, size: 16),
                      label: const Text('Edit'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).pop();
                        _showRemoveAirportDialog(context, airport);
                      },
                      icon: const Icon(Icons.delete, size: 16),
                      label: const Text('Remove'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
          ],
        );
      },
    );
  }

  void _showEditAirportCodeDialog(BuildContext context, String oldAirport) {
    final TextEditingController controller = TextEditingController(text: oldAirport);
    
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Edit Airport Code'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Enter the new ICAO code for airport $oldAirport:'),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                decoration: const InputDecoration(
                  labelText: 'ICAO Code',
                  hintText: 'e.g., KJFK',
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.characters,
                maxLength: 4,
                onChanged: (value) {
                  // Auto-capitalize and limit to 4 characters
                  if (value.length > 4) {
                    controller.text = value.substring(0, 4).toUpperCase();
                    controller.selection = TextSelection.fromPosition(
                      TextPosition(offset: controller.text.length),
                    );
                  }
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final newIcao = controller.text.trim().toUpperCase();
                if (newIcao.length == 4 && newIcao != oldAirport) {
                  Navigator.of(context).pop();
                  
                  // Get the FlightProvider and update the airport
                  final flightProvider = context.read<FlightProvider>();
                  final success = await flightProvider.updateAirportCode(oldAirport, newIcao);
                  
                  if (success) {
                    // Success haptic feedback for airport update
                    HapticService.lightImpact(context);
                    
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Airport updated from $oldAirport to $newIcao successfully!'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Failed to update airport. Please try again.'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                } else if (newIcao == oldAirport) {
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('No changes made'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please enter a valid 4-letter ICAO code'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              },
              child: const Text('Update'),
            ),
          ],
        );
      },
    );
  }

  void _showRemoveAirportDialog(BuildContext context, String airport) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Remove Airport'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.warning,
                color: Colors.orange,
                size: 48,
              ),
              const SizedBox(height: 16),
              Text(
                'Are you sure you want to remove airport $airport from your flight plan?',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'This will also remove all associated weather data.',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.of(context).pop();
                
                // Get the FlightProvider and remove the airport
                final flightProvider = context.read<FlightProvider>();
                final success = await flightProvider.removeAirportFromFlight(airport);
                
                if (success) {
                  // Success haptic feedback for airport removal
                  HapticService.lightImpact(context);
                  
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Airport $airport removed successfully!'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Failed to remove airport. Please try again.'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: const Text('Remove'),
            ),
          ],
        );
      },
    );
  }

  // Get filtered NOTAMs with caching to prevent unnecessary processing
  List<Notam> _getFilteredNotams(List<Notam> notams, FlightProvider flightProvider) {
    // Generate cache key using unified cache manager
    final cacheKey = CacheManager.generateKey('notam_filtered', {
      'notamHash': _generateNotamHash(notams),
      'airport': flightProvider.selectedAirport ?? '',
      'timeFilter': _selectedTimeFilter,
    });
    
    // Check cache first
    final cachedResult = _cacheManager.get<List<Notam>>(cacheKey);
    if (cachedResult != null) {
      debugPrint('DEBUG: Using cached filtered NOTAMs (${cachedResult.length} NOTAMs)');
      debugPrint('DEBUG: Filtered NOTAM IDs (cached): ${cachedResult.map((n) => n.id).join(", ")}');
      return cachedResult;
    }
    
    // Process NOTAMs and cache results
    debugPrint('DEBUG: Processing NOTAMs (cache miss) - airport: ${flightProvider.selectedAirport}, filter: $_selectedTimeFilter');
    
    // Filter by airport first
    final airportFilteredNotams = flightProvider.selectedAirport != null 
        ? notams.where((notam) => _normalizeAirportCode(notam.icao) == flightProvider.selectedAirport).toList()
        : notams;
    debugPrint('DEBUG: After airport filter: ${airportFilteredNotams.length} NOTAMs');
    debugPrint('DEBUG: Airport filtered NOTAM IDs: ${airportFilteredNotams.map((n) => n.id).join(", ")}');
    
    // Filter by time
    final filteredNotams = _filterNotamsByTime(airportFilteredNotams);
    debugPrint('DEBUG: After time filter: ${filteredNotams.length} NOTAMs');
    debugPrint('DEBUG: Time filtered NOTAM IDs: ${filteredNotams.map((n) => n.id).join(", ")}');
    
    // Cache the result
    _cacheManager.set(cacheKey, filteredNotams);
    
    debugPrint('DEBUG: Cached ${filteredNotams.length} filtered NOTAMs');
    return filteredNotams;
  }

  // Filter NOTAMs based on selected time filter
  List<Notam> _filterNotamsByTime(List<Notam> notams) {
    debugPrint('DEBUG: _filterNotamsByTime called with ${notams.length} NOTAMs, filter: $_selectedTimeFilter');
    
    // Filter out CNL (Cancellation) NOTAMs - they don't provide useful operational information
    final activeNotams = notams.where((notam) => 
      !notam.rawText.toUpperCase().contains('CNL NOTAM')
    ).toList();
    
    debugPrint('DEBUG: After CNL filter: ${activeNotams.length} NOTAMs (filtered out ${notams.length - activeNotams.length} CNL NOTAMs)');
    
    if (_selectedTimeFilter == 'All') {
      debugPrint('DEBUG: Returning all ${activeNotams.length} NOTAMs (All filter)');
      return activeNotams;
    }
    
    final now = DateTime.now().toUtc(); // Use UTC time consistently
    Duration filterDuration;
    
    switch (_selectedTimeFilter) {
      case '6 hours':
        filterDuration = const Duration(hours: 6);
        break;
      case '12 hours':
        filterDuration = const Duration(hours: 12);
        break;
      case '24 hours':
        filterDuration = const Duration(hours: 24);
        break;
      case '72 hours':
        filterDuration = const Duration(hours: 72);
        break;
      default:
        debugPrint('DEBUG: Unknown filter, returning all ${activeNotams.length} NOTAMs');
        return activeNotams;
    }
    
    final filterEndTime = now.add(filterDuration);
    
    debugPrint('DEBUG: Current UTC time: ${now.toIso8601String()}');
    debugPrint('DEBUG: Filter end time: ${filterEndTime.toIso8601String()}');
    debugPrint('DEBUG: Filter duration: ${filterDuration.inHours} hours');
    
    // Reduced NOTAM logging to focus on TAF parsing
    debugPrint('DEBUG: Processing ${activeNotams.length} NOTAMs for time filter...');
    
    final filteredNotams = activeNotams.where((notam) {
      // Show NOTAMs that are either:
      // 1. Currently active (started before now, ends after now)
      // 2. Will become active within the time window
      return (notam.validFrom.isBefore(now) && notam.validTo.isAfter(now)) || // Currently active
             (notam.validFrom.isAfter(now) && notam.validFrom.isBefore(filterEndTime)); // Future active
    }).toList();
    
    debugPrint('DEBUG: Filtered NOTAMs result: ${filteredNotams.length} NOTAMs pass the filter');
    return filteredNotams;
  }

  // Normalize airport codes to ensure consistency across tabs
  String _normalizeAirportCode(String icao) {
    // If it's a 3-letter US airport code, add 'K' prefix
    if (icao.length == 3 && icao == icao.toUpperCase()) {
      return 'K$icao';
    }
    return icao.toUpperCase();
  }

  Widget _buildNotams2Tab(BuildContext context, List<Notam> notams, FlightProvider flightProvider) {
    // Get unique airports from NOTAMs
    final airports = notams.map((notam) => _normalizeAirportCode(notam.icao)).toSet().toList();
    // Use selected airport
    final selectedAirport = flightProvider.selectedAirport ?? (airports.isNotEmpty ? airports.first : null);
    // Get filtered NOTAMs using caching to prevent unnecessary processing
    final filteredNotamsByTime = _getFilteredNotams(notams, flightProvider);
    final filteredNotams = selectedAirport != null
        ? filteredNotamsByTime.where((n) => _normalizeAirportCode(n.icao) == selectedAirport).toList().cast<Notam>()
        : <Notam>[];
    
    return RefreshIndicator(
      onRefresh: () async {
        debugPrint('DEBUG: 🔄 NOTAMs2 tab refresh triggered!');
        // Clear all caches for fresh data
        _clearCache();
        final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);
        await flightProvider.refreshCurrentData(
          naipsEnabled: settingsProvider.naipsEnabled,
          naipsUsername: null, // Using rotating accounts
          naipsPassword: null, // Using rotating accounts
        );
        debugPrint('DEBUG: 🔄 NOTAMs2 tab refresh completed!');
      },
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            // Time filter
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  const Icon(Icons.access_time, size: 16, color: Color(0xFF1E3A8A)),
                  const SizedBox(width: 8),
                  const Text(
                    'Show NOTAMs for next:',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1E3A8A),
                    ),
                  ),
                  const SizedBox(width: 8),
                  PopupMenuButton<String>(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E3A8A),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _selectedTimeFilter,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.arrow_drop_down,
                            color: Colors.white,
                            size: 16,
                          ),
                        ],
                      ),
                    ),
                    itemBuilder: (context) => _timeFilterOptions.map((filter) {
                      return PopupMenuItem<String>(
                        value: filter,
                        child: Text(filter),
                      );
                    }).toList(),
                    onSelected: (value) {
                      setState(() {
                        _selectedTimeFilter = value;
                        // Clear NOTAM cache when filter changes
                        _clearCache();
                      });
                    },
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: filteredNotams.isEmpty 
                          ? Colors.grey[200] 
                          : const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          filteredNotams.isEmpty 
                              ? Icons.check_circle 
                              : Icons.warning,
                          size: 14,
                          color: filteredNotams.isEmpty 
                              ? Colors.grey[600] 
                              : Colors.white,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${filteredNotams.length}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: filteredNotams.isEmpty 
                                ? Colors.grey[600] 
                                : Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Grouped NOTAM list
            Expanded(
              child: NotamGroupedList(
                notams: filteredNotams,
                onNotamTap: (notam) {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: Row(
                        children: [
                          Expanded(
                            child: Text(
                              'NOTAM ${notam.id}',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: _getCategoryColor(notam.group),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _getCategoryLabel(notam.group),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                      content: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const SizedBox(height: 16),
                            
                            // Validity Section (Prominent)
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Absolute validity times
                                  Text(
                                    'Valid: ${_formatDateTime(notam.validFrom)} - ${notam.isPermanent ? 'PERM' : _formatDateTime(notam.validTo)}',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  // Relative status + countdown - match raw data page styling
                                  Row(
                                    children: [
                                      // Left side: Start time or Active status (orange)
                                      Expanded(
                                        child: Text(
                                          _getLeftSideText(notam),
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: const Color(0xFFF59E0B), // Orange to match list view
                                            fontWeight: FontWeight.w400, // No bold
                                          ),
                                        ),
                                      ),
                                      // Right side: End time (green)
                                      Text(
                                        _getRightSideText(notam),
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.green.shade600, // Green to match list view
                                          fontWeight: FontWeight.w400, // No bold
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            // Schedule Information (Field D) - only show if present
                            if (notam.fieldD.isNotEmpty) ...[
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.grey.shade200),
                                ),
                                child: Text(
                                  notam.fieldD,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.orange.shade700,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],
                            
                            // NOTAM Text (Main Content) - Field E + Altitude Info (Fields F & G)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Main NOTAM text (Field E)
                                  Text(
                                    notam.fieldE.isNotEmpty ? notam.fieldE : notam.rawText,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      height: 1.4,
                                    ),
                                  ),
                                  
                                  // Altitude information (Fields F & G) - only show if present
                                  if (notam.fieldF.isNotEmpty || notam.fieldG.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      _formatAltitudeInfo(notam.fieldF, notam.fieldG),
                                      style: const TextStyle(
                                        fontSize: 14,
                                        height: 1.4,
                                        color: Colors.blue,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            
                            // Metadata Footer (Single line, small, muted)
                            Text(
                              'Q: ${notam.qCode ?? 'N/A'} • Type: ${notam.type.name} • Group: ${notam.group.name}',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.grey.shade500,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        ),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text('Close'),
                        ),
                      ],
                    ),
                  );
                },
                showGroupHeaders: true,
                initiallyExpanded: false,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getCategoryColor(NotamGroup group) {
    switch (group) {
      // Airport-specific groups
      case NotamGroup.runways:
        return const Color(0xFFEF4444); // Red for runways
      case NotamGroup.taxiways:
        return const Color(0xFFF59E0B); // Amber for taxiways
      case NotamGroup.instrumentProcedures:
        return const Color(0xFF8B5CF6); // Purple for procedures
      case NotamGroup.airportServices:
        return const Color(0xFF3B82F6); // Blue for services
      case NotamGroup.lighting:
        return const Color(0xFFEAB308); // Yellow for lighting
      case NotamGroup.hazards:
        return const Color(0xFFF59E0B); // Amber for hazards
      case NotamGroup.admin:
        return const Color(0xFF6B7280); // Gray for admin
      case NotamGroup.other:
        return const Color(0xFF10B981); // Green for other
      
      // FIR-specific groups (distinct colors)
      case NotamGroup.firAirspaceRestrictions:
        return const Color(0xFFDC2626); // Dark red for airspace restrictions
      case NotamGroup.firAtcNavigation:
        return const Color(0xFF2563EB); // Blue for ATC/navigation
      case NotamGroup.firObstaclesCharts:
        return const Color(0xFFEA580C); // Orange for obstacles/charts
      case NotamGroup.firInfrastructure:
        return const Color(0xFF059669); // Emerald for infrastructure
      case NotamGroup.firDroneOperations:
        return const Color(0xFF7C3AED); // Violet for drone operations
      case NotamGroup.firAdministrative:
        return const Color(0xFF4B5563); // Slate for administrative
    }
  }

  String _getCategoryLabel(NotamGroup group) {
    switch (group) {
      // Airport-specific groups
      case NotamGroup.runways:
        return 'RWY';
      case NotamGroup.taxiways:
        return 'TWY';
      case NotamGroup.instrumentProcedures:
        return 'PROC';
      case NotamGroup.airportServices:
        return 'SVC';
      case NotamGroup.lighting:
        return 'LGT';
      case NotamGroup.hazards:
        return 'HAZ';
      case NotamGroup.admin:
        return 'ADM';
      case NotamGroup.other:
        return 'OTH';
      
      // FIR-specific groups
      case NotamGroup.firAirspaceRestrictions:
        return 'AIRSPACE';
      case NotamGroup.firAtcNavigation:
        return 'ATC/NAV';
      case NotamGroup.firObstaclesCharts:
        return 'OBST';
      case NotamGroup.firInfrastructure:
        return 'INFRA';
      case NotamGroup.firDroneOperations:
        return 'DRONE';
      case NotamGroup.firAdministrative:
        return 'ADMIN';
    }
  }

  String _getLeftSideText(Notam notam) {
    final now = DateTime.now().toUtc();
    final isCurrentlyActive = notam.validFrom.isBefore(now) && notam.validTo.isAfter(now);
    final isFutureActive = notam.validFrom.isAfter(now);

    if (isCurrentlyActive) {
      return 'Active';
    } else if (isFutureActive) {
      final timeUntilStart = notam.validFrom.difference(now);
      if (timeUntilStart.inDays > 0) {
        return 'Starts in ${timeUntilStart.inDays}d ${timeUntilStart.inHours % 24}h';
      } else if (timeUntilStart.inHours > 0) {
        return 'Starts in ${timeUntilStart.inHours}h ${timeUntilStart.inMinutes % 60}m';
      } else if (timeUntilStart.inMinutes > 0) {
        return 'Starts in ${timeUntilStart.inMinutes}m';
      } else {
        return 'Starts soon';
      }
    } else {
      final timeSinceExpiry = now.difference(notam.validTo);
      if (timeSinceExpiry.inDays > 0) {
        return 'Expired ${timeSinceExpiry.inDays}d ${timeSinceExpiry.inHours % 24}h ago';
      } else if (timeSinceExpiry.inHours > 0) {
        return 'Expired ${timeSinceExpiry.inHours}h ${timeSinceExpiry.inMinutes % 60}m ago';
      } else if (timeSinceExpiry.inMinutes > 0) {
        return 'Expired ${timeSinceExpiry.inMinutes}m ago';
      } else {
        return 'Expired just now';
      }
    }
  }

  String _getRightSideText(Notam notam) {
    // Check if this is a permanent NOTAM
    if (notam.isPermanent) {
      return 'PERM';
    }
    
    final now = DateTime.now().toUtc();
    final isCurrentlyActive = notam.validFrom.isBefore(now) && notam.validTo.isAfter(now);
    final isFutureActive = notam.validFrom.isAfter(now);

    if (isCurrentlyActive) {
      final timeUntilEnd = notam.validTo.difference(now);
      if (timeUntilEnd.inDays > 0) {
        return 'Ends in ${timeUntilEnd.inDays}d ${timeUntilEnd.inHours % 24}h';
      } else if (timeUntilEnd.inHours > 0) {
        return 'Ends in ${timeUntilEnd.inHours}h ${timeUntilEnd.inMinutes % 60}m';
      } else if (timeUntilEnd.inMinutes > 0) {
        return 'Ends in ${timeUntilEnd.inMinutes}m';
      } else {
        return 'Ends soon';
      }
    } else if (isFutureActive) {
      final timeUntilEnd = notam.validTo.difference(now);
      if (timeUntilEnd.inDays > 0) {
        return 'Ends in ${timeUntilEnd.inDays}d ${timeUntilEnd.inHours % 24}h';
      } else if (timeUntilEnd.inHours > 0) {
        return 'Ends in ${timeUntilEnd.inHours}h ${timeUntilEnd.inMinutes % 60}m';
      } else if (timeUntilEnd.inMinutes > 0) {
        return 'Ends in ${timeUntilEnd.inMinutes}m';
      } else {
        return 'Ends soon';
      }
    } else {
      return ''; // No end time for expired NOTAMs
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final utc = dateTime.toUtc();
    return '${utc.day.toString().padLeft(2, '0')}/${utc.month.toString().padLeft(2, '0')} ${utc.hour.toString().padLeft(2, '0')}:${utc.minute.toString().padLeft(2, '0')}Z';
  }

  String _formatAltitudeInfo(String fieldF, String fieldG) {
    if (fieldF.isNotEmpty && fieldG.isNotEmpty) {
      return '$fieldF TO $fieldG';
    } else if (fieldF.isNotEmpty) {
      return fieldF;
    } else if (fieldG.isNotEmpty) {
      return fieldG;
    }
    return '';
  }

  /// Build tab content with conditional loading overlay
  Widget _buildTabContent(String tabName, bool isLoading, String loadingMessage, Widget content) {
    if (isLoading) {
      return Stack(
        children: [
          // Show existing content (other airports)
          content,
          // Loading overlay
          Container(
            color: Colors.white.withValues(alpha: 0.9),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1E3A8A)),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    loadingMessage,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'This may take 30+ seconds...',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }
    return content;
  }

  /// Build FIR NOTAMs tab - displays FIR NOTAMs with filtering
  Widget _buildFIRNotamsTab(BuildContext context, List<Notam> allNotams, FlightProvider flightProvider) {
    debugPrint('DEBUG: Building FIR NOTAMs tab');
    
    // Extract FIR NOTAMs from all NOTAMs
    var firNotams = FIRNotamService.extractFIRNotams(allNotams);
    debugPrint('DEBUG: Found ${firNotams.length} FIR NOTAMs');
    
    // Filter by selected FIR pill
    if (flightProvider.selectedFir != null) {
      firNotams = firNotams.where((notam) => notam.icao == flightProvider.selectedFir).toList();
      debugPrint('DEBUG: After FIR filter (${flightProvider.selectedFir}): ${firNotams.length} FIR NOTAMs');
    }
    
    // Filter by time
    final filteredFirNotams = _filterNotamsByTime(firNotams);
    debugPrint('DEBUG: After time filter: ${filteredFirNotams.length} FIR NOTAMs');
    
    return RefreshIndicator(
      onRefresh: () async {
        debugPrint('DEBUG: 🔄 FIR NOTAMs tab refresh triggered!');
        _clearCache();
        final settingsProvider = Provider.of<SettingsProvider>(context, listen: false);
        await flightProvider.refreshCurrentData(
          naipsEnabled: settingsProvider.naipsEnabled,
          naipsUsername: null,
          naipsPassword: null,
        );
        debugPrint('DEBUG: 🔄 FIR NOTAMs tab refresh completed!');
      },
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            // Time filter
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  const Icon(Icons.access_time, size: 16, color: Color(0xFF1E3A8A)),
                  const SizedBox(width: 8),
                  const Text(
                    'Show NOTAMs for next:',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1E3A8A),
                    ),
                  ),
                  const SizedBox(width: 8),
                  PopupMenuButton<String>(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E3A8A),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _selectedTimeFilter,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.arrow_drop_down,
                            color: Colors.white,
                            size: 16,
                          ),
                        ],
                      ),
                    ),
                    itemBuilder: (context) => _timeFilterOptions.map((filter) {
                      return PopupMenuItem<String>(
                        value: filter,
                        child: Text(filter),
                      );
                    }).toList(),
                    onSelected: (value) {
                      setState(() {
                        _selectedTimeFilter = value;
                        // Clear NOTAM cache when filter changes
                        _clearCache();
                      });
                    },
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: filteredFirNotams.isEmpty 
                          ? Colors.grey[200] 
                          : const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          filteredFirNotams.isEmpty 
                              ? Icons.check_circle 
                              : Icons.warning,
                          size: 14,
                          color: filteredFirNotams.isEmpty 
                              ? Colors.grey[600] 
                              : Colors.white,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${filteredFirNotams.length}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: filteredFirNotams.isEmpty 
                                ? Colors.grey[600] 
                                : Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Grouped FIR NOTAM list
            Expanded(
              child: filteredFirNotams.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.flight_takeoff, size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text(
                            'No FIR NOTAMs Available',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'FIR NOTAMs will appear here when available',
                            style: TextStyle(fontSize: 14, color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : NotamGroupedList(
                      notams: FIRNotamGroupingService.applyFIRGrouping(filteredFirNotams),
                      onNotamTap: (notam) {
                        showDialog(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'FIR NOTAM ${notam.id}',
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF6B7280), // Grey for FIR
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    notam.icao, // Show FIR code (YMMM/YBBB)
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            content: SingleChildScrollView(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const SizedBox(height: 16),
                                  
                                  // Validity Section (Prominent) - matching airport NOTAMs
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade50,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Colors.grey.shade200),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Absolute validity times
                                        Text(
                                          'Valid: ${_formatDateTime(notam.validFrom)} - ${notam.isPermanent ? 'PERM' : _formatDateTime(notam.validTo)}',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        // Relative status + countdown - match raw data page styling
                                        Row(
                                          children: [
                                            // Left side: Start time or Active status (orange)
                                            Expanded(
                                              child: Text(
                                                _getLeftSideText(notam),
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  color: Color(0xFFF59E0B), // Orange to match list view
                                                  fontWeight: FontWeight.w400, // No bold
                                                ),
                                              ),
                                            ),
                                            // Right side: End time (green)
                                            Text(
                                              _getRightSideText(notam),
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.green.shade600, // Green to match list view
                                                fontWeight: FontWeight.w400, // No bold
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  
                                  // Schedule Information (Field D) - only show if present
                                  if (notam.fieldD.isNotEmpty) ...[
                                    const SizedBox(height: 16),
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade50,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: Colors.grey.shade200),
                                      ),
                                      child: Text(
                                        notam.fieldD,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.orange.shade700,
                                        ),
                                      ),
                                    ),
                                  ],
                                  
                                  // NOTAM Text (Main Content) - Field E + Altitude Info (Fields F & G)
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade50,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Colors.grey.shade200),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Main NOTAM text (Field E)
                                        Text(
                                          notam.fieldE.isNotEmpty ? notam.fieldE : notam.rawText,
                                          style: const TextStyle(
                                            fontSize: 14,
                                            height: 1.4,
                                          ),
                                        ),
                                        
                                        // Altitude information (Fields F & G) - only show if present
                                        if (notam.fieldF.isNotEmpty || notam.fieldG.isNotEmpty) ...[
                                          const SizedBox(height: 8),
                                          Text(
                                            _formatAltitudeInfo(notam.fieldF, notam.fieldG),
                                            style: const TextStyle(
                                              fontSize: 14,
                                              height: 1.4,
                                              color: Colors.blue,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  
                                  // Metadata Footer (Single line, small, muted)
                                  Text(
                                    'Q: ${notam.qCode ?? 'N/A'} • Type: ${notam.type.name} • Group: ${notam.group.name}',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: Colors.grey.shade500,
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.of(context).pop(),
                                child: const Text('Close'),
                              ),
                            ],
                          ),
                        );
                      },
                      showGroupHeaders: true,
                      initiallyExpanded: true,
                    ),
            ),
          ],
        ),
      ),
    );
  }


  /// Build pill selector - shows airport pills for most tabs, FIR pills for FIR NOTAMs tab
  Widget _buildPillSelector(BuildContext context, FlightProvider flightProvider) {
    final currentTab = _tabController.index;
    final isFIRNotamsTab = currentTab == 3; // FIR NOTAMs is the 4th tab (index 3)
    
    if (isFIRNotamsTab) {
      // Show FIR pills for FIR NOTAMs tab
      return Column(
        children: [
          const SizedBox(height: 4),
          SizedBox(
            height: 40,
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildFIRPill('YMMM', flightProvider.selectedFir == 'YMMM', () {
                    flightProvider.setSelectedFir('YMMM');
                  }),
                  const SizedBox(width: 8),
                  _buildFIRPill('YBBB', flightProvider.selectedFir == 'YBBB', () {
                    flightProvider.setSelectedFir('YBBB');
                  }),
                ],
              ),
            ),
          ),
          const SizedBox(height: 4),
        ],
      );
    } else {
      // Show airport pills for other tabs
      final airports = flightProvider.currentFlight?.airports.map((a) => a.icao).toList() ?? [];
      if (airports.isEmpty) return const SizedBox.shrink();
      
      return Column(
        children: [
          const SizedBox(height: 4),
          SizedBox(
            height: 40,
            child: RepaintBoundary(
              child: Center(
                child: TafAirportSelector(
                  airports: airports,
                  selectedAirport: flightProvider.selectedAirport ?? airports.first,
                  onAirportSelected: (String airport) {
                    _clearCache();
                    flightProvider.setSelectedAirport(airport);
                  },
                  onAddAirport: _showAddAirportDialog,
                  onAirportLongPress: _showEditAirportDialog,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
        ],
      );
    }
  }

  /// Build a single FIR pill
  Widget _buildFIRPill(String fir, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF97316) : Colors.grey[700]!,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFFF97316) : Colors.grey[600]!,
            width: 1,
          ),
        ),
        child: Text(
          fir,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

}

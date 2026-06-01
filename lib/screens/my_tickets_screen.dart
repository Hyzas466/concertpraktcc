import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'ticket_qr_screen.dart';

// Deep-cast any JSON object to Map<String, dynamic>
Map<String, dynamic> _toMap(dynamic raw) {
  if (raw is Map<String, dynamic>) return raw;
  if (raw is Map) return raw.map((k, v) => MapEntry(k.toString(), v));
  return {};
}

/// Check if ALL attendees in the order have been checked in
bool _isOrderCheckedIn(Map<String, dynamic> order) {
  final rawAttendees = order['Attendees'] ?? order['attendees'];
  if (rawAttendees is List && rawAttendees.isNotEmpty) {
    return rawAttendees.every((a) {
      final attendee = _toMap(a);
      return attendee['check_in_status'] == 'checked_in';
    });
  }
  // No attendee data → treat as available
  return false;
}

class MyTicketsScreen extends StatefulWidget {
  @override
  _MyTicketsScreenState createState() => _MyTicketsScreenState();
}

class _MyTicketsScreenState extends State<MyTicketsScreen>
    with SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> orders = [];
  bool isLoading = true;
  String? errorMessage;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    fetchOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> fetchOrders() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');

    if (token == null) {
      setState(() => isLoading = false);
      return;
    }

    try {
      final response = await http.get(
        Uri.parse(ApiConfig.orders),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        final rawList = decoded['data'];

        setState(() {
          if (rawList is List) {
            orders = rawList.map((e) => _toMap(e)).toList();
          } else if (rawList is Map) {
            // Single object returned — wrap in list
            orders = [_toMap(rawList)];
          } else {
            orders = [];
          }
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = 'Server error: ${response.statusCode}';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = e.toString();
        isLoading = false;
      });
      debugPrint('Error fetching orders: $e');
    }
  }

  /// Build a single ticket card
  Widget _buildTicketCard(Map<String, dynamic> order) {
    // 'Event' is returned as a plain string (event title)
    // or as an object — handle both
    final eventRaw = order['Event'] ?? order['event'];
    String eventTitle;
    String eventVenue = '';
    String eventDate = '';
    if (eventRaw is String) {
      eventTitle = eventRaw;
    } else if (eventRaw is Map) {
      final eventMap = _toMap(eventRaw);
      eventTitle = eventMap['title']?.toString() ?? 'Unknown Event';
      eventVenue = eventMap['venue']?.toString() ?? '';
      eventDate = eventMap['event_date']?.toString() ?? '';
    } else {
      eventTitle = 'Unknown Event';
    }

    // TicketType is returned as a plain string e.g. "Reguler"
    final ticketRaw = order['TicketType'] ??
        order['ticketType'] ??
        order['ticket_type'] ??
        order['Ticket'] ??
        order['ticket'];
    String ticketCategory;
    if (ticketRaw is String) {
      ticketCategory = ticketRaw;
    } else if (ticketRaw is Map) {
      ticketCategory = _toMap(ticketRaw)['category']?.toString() ?? '-';
    } else {
      ticketCategory = '-';
    }

    final quantity = order['quantity'] ?? 0;
    final totalPrice =
        double.tryParse((order['total_price'] ?? 0).toString()) ?? 0.0;

    final bool isCheckedIn = _isOrderCheckedIn(order);

    return Card(
      elevation: 4,
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TicketQRScreen(order: order),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                eventTitle,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text('Category: $ticketCategory'),
              Text('Quantity: $quantity'),
              Text('Total: Rp ${totalPrice.toStringAsFixed(0)}'),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Chip(
                    label: Text(
                      isCheckedIn ? 'UNAVAILABLE' : 'AVAILABLE',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold),
                    ),
                    backgroundColor:
                        isCheckedIn ? Colors.red : Colors.green,
                  ),
                  const Icon(Icons.arrow_forward_ios,
                      size: 16, color: Colors.grey),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  /// Build a list of tickets or an empty-state message
  Widget _buildTicketList(List<Map<String, dynamic>> items, String emptyMsg) {
    if (items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.confirmation_num_outlined,
                  size: 64, color: Colors.grey[400]),
              const SizedBox(height: 16),
              Text(
                emptyMsg,
                style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: fetchOrders,
      child: ListView.builder(
        padding: const EdgeInsets.all(10),
        itemCount: items.length,
        itemBuilder: (context, index) => _buildTicketCard(items[index]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Split orders into available and unavailable
    final availableOrders =
        orders.where((o) => !_isOrderCheckedIn(o)).toList();
    final unavailableOrders =
        orders.where((o) => _isOrderCheckedIn(o)).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Tickets'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            Tab(
              text: 'Available (${availableOrders.length})',
              icon: const Icon(Icons.check_circle_outline, size: 20),
            ),
            Tab(
              text: 'Unavailable (${unavailableOrders.length})',
              icon: const Icon(Icons.cancel_outlined, size: 20),
            ),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      'Error: $errorMessage',
                      style: const TextStyle(color: Colors.red),
                      textAlign: TextAlign.center,
                    ),
                  ),
                )
              : orders.isEmpty
                  ? const Center(
                      child: Text('You have not ordered any tickets yet.'))
                  : TabBarView(
                      controller: _tabController,
                      children: [
                        _buildTicketList(availableOrders,
                            'Semua tiket sudah di-scan.\nTidak ada tiket yang available.'),
                        _buildTicketList(unavailableOrders,
                            'Belum ada tiket yang di-scan.\nTiket yang sudah digunakan akan muncul di sini.'),
                      ],
                    ),
    );
  }
}

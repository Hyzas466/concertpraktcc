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

class MyTicketsScreen extends StatefulWidget {
  @override
  _MyTicketsScreenState createState() => _MyTicketsScreenState();
}

class _MyTicketsScreenState extends State<MyTicketsScreen> {
  List<Map<String, dynamic>> orders = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    fetchOrders();
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Tickets'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
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
                  : RefreshIndicator(
                      onRefresh: fetchOrders,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(10),
                        itemCount: orders.length,
                        itemBuilder: (context, index) {
                          final order = orders[index];

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
                          final totalPrice = double.tryParse(
                                  (order['total_price'] ?? 0).toString()) ??
                              0.0;

                          return Card(
                            elevation: 4,
                            margin: const EdgeInsets.symmetric(vertical: 8),
                            child: InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        TicketQRScreen(order: order),
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
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 8),
                                    Text('Category: $ticketCategory'),
                                    Text('Quantity: $quantity'),
                                    Text(
                                        'Total: Rp ${totalPrice.toStringAsFixed(0)}'),
                                    const SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Chip(
                                          label: const Text(
                                            'AVAILABLE',
                                            style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold),
                                          ),
                                          backgroundColor: Colors.green,
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
                        },
                      ),
                    ),
    );
  }
}

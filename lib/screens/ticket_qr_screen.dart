import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

// Deep-cast any JSON map to Map<String, dynamic>
Map<String, dynamic> _toMap(dynamic raw) {
  if (raw is Map<String, dynamic>) return raw;
  if (raw is Map) return raw.map((k, v) => MapEntry(k.toString(), v));
  return {};
}

class TicketQRScreen extends StatelessWidget {
  final Map<String, dynamic> order;

  const TicketQRScreen({required this.order});

  @override
  Widget build(BuildContext context) {
    // Event may be a plain string (title) or a nested object
    final eventRaw = order['Event'] ?? order['event'];
    String eventTitle;
    String eventVenue = '-';
    String eventDate = '-';
    if (eventRaw is String) {
      eventTitle = eventRaw;
    } else if (eventRaw is Map) {
      final eventMap = _toMap(eventRaw);
      eventTitle = eventMap['title']?.toString() ?? 'Unknown Event';
      eventVenue = eventMap['venue']?.toString() ?? '-';
      final rawDate = eventMap['event_date'];
      if (rawDate != null) {
        eventDate = DateTime.tryParse(rawDate.toString())
                ?.toLocal()
                .toString()
                .split('.')[0] ??
            '-';
      }
    } else {
      eventTitle = 'Unknown Event';
    }

    // TicketType may be a plain string like "Reguler" or an object
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

    // Attendees is a list — cast each item
    final rawAttendees = order['Attendees'];
    final List<Map<String, dynamic>> attendees = (rawAttendees is List)
        ? rawAttendees.map((e) => _toMap(e)).toList()
        : [];

    final String qrString = attendees.isNotEmpty
        ? (attendees[0]['qr_code']?.toString() ?? 'TICKET-NOT-GENERATED-YET')
        : 'TICKET-NOT-GENERATED-YET';

    final quantity = order['quantity'] ?? 0;
    final totalPrice =
        double.tryParse((order['total_price'] ?? 0).toString()) ?? 0.0;

    return Scaffold(
      appBar: AppBar(title: const Text('Ticket Scan')),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                eventTitle,
                style: const TextStyle(
                    fontSize: 28, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                eventVenue,
                style: const TextStyle(fontSize: 18, color: Colors.grey),
              ),
              const SizedBox(height: 5),
              Text(
                eventDate,
                style:
                    const TextStyle(fontSize: 16, color: Colors.blue),
              ),
              const Divider(height: 40),

              // QR Code
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(color: Colors.black12, blurRadius: 10)
                  ],
                ),
                child: QrImageView(
                  data: qrString,
                  version: QrVersions.auto,
                  size: 250.0,
                ),
              ),

              const SizedBox(height: 30),
              const Text(
                'Tunjukkan QR ini pada petugas gerbang.',
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  children: [
                    Text(
                      'Category: $ticketCategory',
                      style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Quantity: $quantity Tickets',
                      style: const TextStyle(fontSize: 16),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Total Paid: Rp ${totalPrice.toStringAsFixed(0)}',
                      style: const TextStyle(
                          fontSize: 16,
                          color: Colors.blue,
                          fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}

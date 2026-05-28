import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import 'booking_screen.dart';

class EventDetailScreen extends StatefulWidget {
  final Map<String, dynamic> event;

  EventDetailScreen({required this.event});

  @override
  _EventDetailScreenState createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  List<dynamic> tickets = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchTickets();
  }

  Future<void> fetchTickets() async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.eventTickets(widget.event['id'])),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          tickets = data['data'];
          isLoading = false;
        });
      } else {
        setState(() => isLoading = false);
      }
    } catch (e) {
      setState(() => isLoading = false);
      debugPrint('Error fetching tickets: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.event['title'])),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.event['title'],
                style:
                    TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.location_on, color: Colors.grey),
                SizedBox(width: 5),
                Expanded(
                  child: Text(widget.event['venue'],
                      style: TextStyle(fontSize: 16)),
                ),
              ],
            ),
            SizedBox(height: 5),
            Row(
              children: [
                Icon(Icons.calendar_today, color: Colors.grey, size: 20),
                SizedBox(width: 5),
                Text(DateTime.parse(widget.event['event_date'])
                    .toLocal()
                    .toString()
                    .split('.')[0]),
              ],
            ),
            SizedBox(height: 20),
            Text('Description',
                style:
                    TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 5),
            Text(widget.event['description'] ?? 'No description provided.'),
            SizedBox(height: 30),
            Text('Available Tickets',
                style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue)),
            SizedBox(height: 10),
            isLoading
                ? Center(child: CircularProgressIndicator())
                : tickets.isEmpty
                    ? Text('No tickets available yet.')
                    : ListView.builder(
                        shrinkWrap: true,
                        physics: NeverScrollableScrollPhysics(),
                        itemCount: tickets.length,
                        itemBuilder: (context, index) {
                          final ticket = tickets[index];
                          final int quota =
                              (ticket['quota'] as num).toInt();
                          final int sold = (ticket['sold'] as num).toInt();
                          final int availableQuota = quota - sold;
                          final bool isSoldOut = availableQuota <= 0;

                          return Card(
                            margin: EdgeInsets.only(bottom: 10),
                            elevation: 3,
                            child: Padding(
                              padding: EdgeInsets.all(16),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(ticket['category'],
                                          style: TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold)),
                                      Text(
                                          'Rp ${double.parse(ticket['price'].toString()).toStringAsFixed(0)}'),
                                      Text(
                                          'Sisa: $availableQuota tiket'),
                                    ],
                                  ),
                                  ElevatedButton(
                                    onPressed: isSoldOut
                                        ? null
                                        : () async {
                                            await Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    BookingScreen(
                                                  event: widget.event,
                                                  ticket: ticket,
                                                ),
                                              ),
                                            );
                                            fetchTickets();
                                          },
                                    child: Text(
                                        isSoldOut ? 'Sold Out' : 'Buy Now'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: isSoldOut
                                          ? Colors.grey
                                          : Colors.blue,
                                      foregroundColor: Colors.white,
                                    ),
                                  )
                                ],
                              ),
                            ),
                          );
                        },
                      )
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

class TicketQRScreen extends StatelessWidget {
  final Map<String, dynamic> order;

  TicketQRScreen({required this.order});

  @override
  Widget build(BuildContext context) {
    // Ambil QR Code dari tabel Attendees
    final attendees = order['Attendees'] as List?;
    final String qrString = (attendees != null && attendees.isNotEmpty) 
        ? attendees[0]['qr_code'] 
        : 'TICKET-NOT-GENERATED-YET';

    return Scaffold(
      appBar: AppBar(title: Text('Ticket Scan')),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(30),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(order['Event']['title'], style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              SizedBox(height: 10),
              Text(order['Event']['venue'], style: TextStyle(fontSize: 18, color: Colors.grey)),
              SizedBox(height: 5),
              Text(
                DateTime.parse(order['Event']['event_date']).toLocal().toString().split('.')[0],
                style: TextStyle(fontSize: 16, color: Colors.blue),
              ),
              Divider(height: 40),
              
              // Render String menjadi QR Code
              Container(
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10)]
                ),
                child: QrImageView(
                  data: qrString,
                  version: QrVersions.auto,
                  size: 250.0,
                ),
              ),
              
              SizedBox(height: 30),
              Text('Tunjukkan QR ini pada petugas gerbang.', style: TextStyle(fontSize: 16)),
              SizedBox(height: 20),
              Container(
                padding: EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.blue[200]!)
                ),
                child: Column(
                  children: [
                    Text('Category: ${order['Ticket']['category']}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    SizedBox(height: 5),
                    Text('Quantity: ${order['quantity']} Tickets', style: TextStyle(fontSize: 16)),
                    SizedBox(height: 5),
                    Text('Total Paid: Rp ${double.parse(order['total_price'].toString()).toStringAsFixed(0)}', style: TextStyle(fontSize: 16, color: Colors.blue, fontWeight: FontWeight.bold)),
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

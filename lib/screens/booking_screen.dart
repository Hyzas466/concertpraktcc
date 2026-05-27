import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class BookingScreen extends StatefulWidget {
  final Map<String, dynamic> event;
  final Map<String, dynamic> ticket;

  BookingScreen({required this.event, required this.ticket});

  @override
  _BookingScreenState createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  int quantity = 1;
  bool isLoading = false;
  final String apiUrl = kIsWeb ? 'http://localhost:5001/api/v1' : 'http://10.0.2.2:5001/api/v1';

  Future<void> confirmPurchase() async {
    setState(() => isLoading = true);
    
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/orders'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'event_id': widget.event['id'],
          'ticket_id': widget.ticket['id'],
          'quantity': quantity,
        }),
      );

      final data = json.decode(response.body);
      
      if (response.statusCode == 201 && data['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Pemesanan Berhasil! Tiket masuk ke My Tickets.'), backgroundColor: Colors.green),
        );
        Navigator.pop(context); // Kembali ke halaman detail event
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['message'] ?? 'Gagal memesan tiket.'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Terjadi kesalahan koneksi!'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Parsing harga ke double agar aman dari error FormatException MySQL .00
    final double price = double.parse(widget.ticket['price'].toString());
    final double totalPrice = price * quantity;

    return Scaffold(
      appBar: AppBar(title: Text('Booking Tiket')),
      body: Padding(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.event['title'], style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Text('Kategori: ${widget.ticket['category']}', style: TextStyle(fontSize: 18, color: Colors.blue)),
            Text('Harga per tiket: Rp ${price.toStringAsFixed(0)}', style: TextStyle(fontSize: 16)),
            Divider(height: 40),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Jumlah Tiket:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    IconButton(
                      icon: Icon(Icons.remove_circle_outline, color: Colors.red),
                      onPressed: () {
                        if (quantity > 1) setState(() => quantity--);
                      },
                    ),
                    Text('$quantity', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: Icon(Icons.add_circle_outline, color: Colors.green),
                      onPressed: () {
                        if (quantity < widget.ticket['quota']) setState(() => quantity++);
                      },
                    ),
                  ],
                ),
              ],
            ),
            
            Divider(height: 40),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total Harga:', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                Text('Rp ${totalPrice.toStringAsFixed(0)}', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.blue)),
              ],
            ),
            
            Spacer(),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: isLoading ? null : confirmPurchase,
                child: isLoading 
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('Confirm Purchase', style: TextStyle(fontSize: 18)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue, 
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

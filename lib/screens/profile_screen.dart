import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'my_tickets_screen.dart';
import 'login_screen.dart';

class ProfileScreen extends StatelessWidget {
  Future<void> _logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('My Profile')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(radius: 50, child: Icon(Icons.person, size: 50)),
            SizedBox(height: 20),
            Text('Penonton Musik', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            Text('penonton@gmail.com', style: TextStyle(fontSize: 16, color: Colors.grey)),
            SizedBox(height: 40),
            ElevatedButton.icon(
              icon: Icon(Icons.confirmation_number),
              label: Text('My Tickets'),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => MyTicketsScreen())),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
            ),
            SizedBox(height: 10),
            TextButton.icon(
              icon: Icon(Icons.logout, color: Colors.red),
              label: Text('Logout', style: TextStyle(color: Colors.red)),
              onPressed: () => _logout(context),
            )
          ],
        ),
      ),
    );
  }
}

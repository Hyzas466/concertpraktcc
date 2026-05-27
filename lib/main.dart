import 'package:flutter/material.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(ConcertTicketingApp());
}

class ConcertTicketingApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Concert Ticketing',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: LoginScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

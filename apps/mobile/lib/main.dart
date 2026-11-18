import 'package:flutter/material.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const HomeDashApp());
}

class HomeDashApp extends StatelessWidget {
  const HomeDashApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HomeDash — Family OS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1E88E5)),
      ),
      home: const Scaffold(
        body: Center(
          child: Text('HomeDash Family OS'),
        ),
      ),
    );
  }
}

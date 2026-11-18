import 'dart:convert';
import 'package:http/http.dart' as http;

class SyncPushResponse {
  final int appliedCount;
  final int conflictCount;
  final List<String> serverErrors;
  final String serverHlc;

  const SyncPushResponse({
    required this.appliedCount,
    required this.conflictCount,
    required this.serverErrors,
    required this.serverHlc,
  });

  factory SyncPushResponse.fromJson(Map<String, dynamic> json) {
    return SyncPushResponse(
      appliedCount: json['appliedCount'] as int? ?? 0,
      conflictCount: json['conflictCount'] as int? ?? 0,
      serverErrors: (json['serverErrors'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      serverHlc: json['serverHlc'] as String? ?? '',
    );
  }
}

class SyncPullResponse {
  final List<Map<String, dynamic>> changes;
  final int nextCursor;
  final bool hasMore;
  final String serverHlc;

  const SyncPullResponse({
    required this.changes,
    required this.nextCursor,
    required this.hasMore,
    required this.serverHlc,
  });

  factory SyncPullResponse.fromJson(Map<String, dynamic> json) {
    return SyncPullResponse(
      changes: (json['changes'] as List<dynamic>?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ??
          [],
      nextCursor: json['nextCursor'] as int? ?? 0,
      hasMore: json['hasMore'] as bool? ?? false,
      serverHlc: json['serverHlc'] as String? ?? '',
    );
  }
}

class SyncClient {
  final String baseUrl;
  final String Function() getAuthToken;
  final http.Client _httpClient;

  SyncClient({
    required this.baseUrl,
    required this.getAuthToken,
    http.Client? httpClient,
  }) : _httpClient = httpClient ?? http.Client();

  Map<String, String> _buildHeaders() {
    final token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  Future<SyncPushResponse> push({
    required String householdId,
    required String clientId,
    required List<Map<String, dynamic>> mutations,
  }) async {
    final url = Uri.parse('$baseUrl/sync/push');
    final body = jsonEncode({
      'householdId': householdId,
      'clientId': clientId,
      'mutations': mutations,
    });

    final res = await _httpClient.post(url, headers: _buildHeaders(), body: body);
    if (res.statusCode != 200) {
      throw Exception('Sync push failed [${res.statusCode}]: ${res.body}');
    }

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return SyncPushResponse.fromJson(data);
  }

  Future<SyncPullResponse> pull({
    required String householdId,
    int cursor = 0,
    int limit = 100,
  }) async {
    final url = Uri.parse('$baseUrl/sync/pull');
    final body = jsonEncode({
      'householdId': householdId,
      'cursor': cursor,
      'limit': limit,
    });

    final res = await _httpClient.post(url, headers: _buildHeaders(), body: body);
    if (res.statusCode != 200) {
      throw Exception('Sync pull failed [${res.statusCode}]: ${res.body}');
    }

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return SyncPullResponse.fromJson(data);
  }

  void close() {
    _httpClient.close();
  }
}

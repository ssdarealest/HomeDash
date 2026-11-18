import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/hlc/hlc.dart';
import 'sync_client.dart';
import 'reconciler.dart';

typedef RemoteChangeHandler = Future<void> Function(Map<String, dynamic> change);
typedef OutboxBatchProvider = Future<List<Map<String, dynamic>>> Function();
typedef OutboxSuccessHandler = Future<void> Function(List<String> mutationIds);

class SyncCoordinator {
  final SyncClient client;
  final String householdId;
  final String clientId;
  final HybridLogicalClock hlc;
  final OutboxBatchProvider getPendingMutations;
  final OutboxSuccessHandler onMutationsSynced;
  final RemoteChangeHandler applyRemoteChange;

  bool _isSyncing = false;
  bool _isDisposed = false;
  int _lastServerCursor = 0;
  StreamSubscription? _sseSubscription;
  http.Client? _sseClient;

  SyncCoordinator({
    required this.client,
    required this.householdId,
    required this.clientId,
    required this.hlc,
    required this.getPendingMutations,
    required this.onMutationsSynced,
    required this.applyRemoteChange,
  });

  bool get isSyncing => _isSyncing;
  bool get isDisposed => _isDisposed;
  int get lastCursor => _lastServerCursor;

  /// Trigger full sync cycle: flush local outbox first, then pull remote deltas.
  /// Concurrency mutex guarantees only one sync runs at any time.
  Future<void> triggerSync() async {
    if (_isSyncing || _isDisposed) return;
    _isSyncing = true;

    try {
      // Step 1: Push pending local mutations
      final pending = await getPendingMutations();
      if (pending.isNotEmpty) {
        final pushRes = await client.push(
          householdId: householdId,
          clientId: clientId,
          mutations: pending,
        );

        if (pushRes.serverHlc.isNotEmpty) {
          final serverTs = HybridLogicalClock.unpack(pushRes.serverHlc);
          hlc.receive(serverTs);
        }

        final syncedIds = pending.map((m) => m['id'] as String).toList();
        await onMutationsSynced(syncedIds);
      }

      // Step 2: Pull remote changes since last cursor
      bool hasMore = true;
      while (hasMore && !_isDisposed) {
        final pullRes = await client.pull(
          householdId: householdId,
          cursor: _lastServerCursor,
          limit: 100,
        );

        if (pullRes.serverHlc.isNotEmpty) {
          final serverTs = HybridLogicalClock.unpack(pullRes.serverHlc);
          hlc.receive(serverTs);
        }

        for (final change in pullRes.changes) {
          if (_isDisposed) break;
          await applyRemoteChange(change);
        }

        _lastServerCursor = pullRes.nextCursor;
        hasMore = pullRes.hasMore;
      }
    } finally {
      _isSyncing = false;
    }
  }

  /// Listens to SSE realtime event stream for instant invalidation triggers
  void startRealtimeListener() {
    if (_isDisposed) return;

    _sseSubscription?.cancel();
    _sseClient?.close();

    final sseUrl = Uri.parse('${client.baseUrl}/sync/realtime');
    final request = http.Request('GET', sseUrl);
    request.headers.addAll({
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Authorization': 'Bearer ${client.getAuthToken()}',
    });

    final sseClient = http.Client();
    _sseClient = sseClient;

    sseClient.send(request).then((response) {
      if (_isDisposed) {
        sseClient.close();
        return;
      }

      if (response.statusCode == 200) {
        _sseSubscription = response.stream
            .transform(utf8.decoder)
            .transform(const LineSplitter())
            .listen((line) {
          if (_isDisposed) return;
          if (line.startsWith('event: sync:invalidate') || line.contains('sync:invalidate')) {
            triggerSync();
          }
        }, onError: (err) {
          // Reconnect with backoff
        });
      }
    }).catchError((err) {
      // Reconnect with backoff
    });
  }

  void dispose() {
    _isDisposed = true;
    _sseSubscription?.cancel();
    _sseSubscription = null;
    _sseClient?.close();
    _sseClient = null;
  }
}

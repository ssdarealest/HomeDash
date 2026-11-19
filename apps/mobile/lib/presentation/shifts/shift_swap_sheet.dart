import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class ShiftSwapSheet extends StatefulWidget {
  final String shiftId;
  final String currentAssigneeName;
  final String shiftTimeWindow;
  final Function(String targetMemberId, String notes)? onSwapConfirmed;

  const ShiftSwapSheet({
    Key? key,
    required this.shiftId,
    required this.currentAssigneeName,
    required this.shiftTimeWindow,
    this.onSwapConfirmed,
  }) : super(key: key);

  @override
  State<ShiftSwapSheet> createState() => _ShiftSwapSheetState();
}

class _ShiftSwapSheetState extends State<ShiftSwapSheet> {
  final _targetMemberController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _targetMemberController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    final targetId = _targetMemberController.text.trim();
    if (targetId.isNotEmpty) {
      widget.onSwapConfirmed?.call(targetId, _notesController.text.trim());
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: EdgeInsets.only(
        left: 20.0,
        right: 20.0,
        top: 20.0,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24.0,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surfaceWarm,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.0)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Claim or Swap Shift',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const SizedBox(height: 12.0),
          Text(
            'Shift Window: ${widget.shiftTimeWindow}',
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            'Currently Assigned: ${widget.currentAssigneeName}',
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppColors.neutralDark.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 16.0),
          TextField(
            controller: _targetMemberController,
            decoration: const InputDecoration(
              labelText: 'Target Caregiver Member ID',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12.0),
          TextField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: 'Handoff / Swap Reason',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20.0),
          SizedBox(
            height: AppTheme.minTouchTarget,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryEmerald,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.0),
                ),
              ),
              onPressed: _submit,
              child: const Text(
                'Confirm Shift Swap',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

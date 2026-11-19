import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class GroceryCheckoutSheet extends StatefulWidget {
  final String householdId;
  final int checkedItemCount;
  final Function(int totalAmountCents)? onCompleted;

  const GroceryCheckoutSheet({
    Key? key,
    required this.householdId,
    required this.checkedItemCount,
    this.onCompleted,
  }) : super(key: key);

  @override
  State<GroceryCheckoutSheet> createState() => _GroceryCheckoutSheetState();
}

class _GroceryCheckoutSheetState extends State<GroceryCheckoutSheet> {
  final _amountController = TextEditingController();
  final _notesController = TextEditingController(text: 'Supermarket checkout');

  @override
  void dispose() {
    _amountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    final amountText = _amountController.text.trim().replaceAll('$', '');
    final amount = double.tryParse(amountText) ?? 0.0;
    final cents = (amount * 100).round();
    widget.onCompleted?.call(cents);
    Navigator.of(context).pop();
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
                'Checkout & Log Expense',
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
            'Convert ${widget.checkedItemCount} checked grocery items into an expense transaction.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppColors.neutralDark.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 16.0),
          TextField(
            controller: _amountController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: 'Total Receipt Amount (\$)',
              prefixText: '\$ ',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12.0),
          TextField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: 'Store / Receipt Notes',
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
                'Checkout & Log Expense',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

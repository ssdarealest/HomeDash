import 'package:flutter/material.dart';

class ExpenseQuickLogSheet extends StatefulWidget {
  final Function(int amountCents, String category, String note) onAddExpense;

  const ExpenseQuickLogSheet({super.key, required this.onAddExpense});

  static Future<void> show(BuildContext context, {required Function(int amountCents, String category, String note) onAddExpense}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => ExpenseQuickLogSheet(onAddExpense: onAddExpense),
    );
  }

  @override
  State<ExpenseQuickLogSheet> createState() => _ExpenseQuickLogSheetState();
}

class _ExpenseQuickLogSheetState extends State<ExpenseQuickLogSheet> {
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();
  String _selectedCategory = 'Groceries';

  final List<String> _categories = ['Groceries', 'Utilities', 'Medical', 'Child Allowance', 'Dining', 'Other'];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Quick Expense Log', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                prefixText: '\$ ',
                labelText: 'Amount',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _selectedCategory,
              decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _selectedCategory = val);
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(labelText: 'Description / Note', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              onPressed: () {
                final amount = double.tryParse(_amountController.text) ?? 0.0;
                final cents = (amount * 100).round();
                widget.onAddExpense(cents, _selectedCategory, _noteController.text);
                Navigator.pop(context);
              },
              child: const Text('Save Expense'),
            ),
          ],
        ),
      ),
    );
  }
}

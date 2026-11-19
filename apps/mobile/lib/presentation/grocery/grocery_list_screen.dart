import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import 'grocery_checkout_sheet.dart';

class GroceryListScreen extends StatelessWidget {
  final String householdId;
  final List<Map<String, dynamic>> items;
  final Function(String itemId, bool isChecked)? onItemToggle;
  final Function(int totalCents)? onCheckout;

  const GroceryListScreen({
    Key? key,
    required this.householdId,
    required this.items,
    this.onItemToggle,
    this.onCheckout,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final grouped = <String, List<Map<String, dynamic>>>{};

    for (final item in items) {
      final aisle = (item['aisleCategory'] as String?) ?? 'pantry';
      grouped.putIfAbsent(aisle, () => []).add(item);
    }

    final checkedItems = items.where((i) => i['isChecked'] == true).toList();
    final checkedCount = checkedItems.length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Household Grocery List'),
        actions: [
          if (checkedCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: TextButton.icon(
                icon: const Icon(Icons.shopping_cart_checkout),
                label: Text('Checkout ($checkedCount)'),
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (ctx) => GroceryCheckoutSheet(
                      householdId: householdId,
                      checkedItemCount: checkedCount,
                      onCompleted: (amountCents) {
                        onCheckout?.call(amountCents);
                      },
                    ),
                  );
                },
              ),
            ),
        ],
      ),
      body: grouped.isEmpty
          ? Center(
              child: Text(
                'No grocery items yet',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: AppColors.neutralDark.withOpacity(0.6),
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16.0),
              children: grouped.entries.map((entry) {
                final aisleName = entry.key.replaceAll('_', ' ').toUpperCase();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                      child: Text(
                        aisleName,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryEmerald,
                        ),
                      ),
                    ),
                    ...entry.value.map((item) {
                      final isChecked = item['isChecked'] == true;
                      return Container(
                        constraints: const BoxConstraints(minHeight: AppTheme.minTouchTarget),
                        margin: const EdgeInsets.only(bottom: 8.0),
                        decoration: BoxDecoration(
                          color: isChecked
                              ? AppColors.surfaceWarm.withOpacity(0.5)
                              : AppColors.surfaceWarm,
                          borderRadius: BorderRadius.circular(12.0),
                          border: Border.all(
                            color: AppColors.neutralDark.withOpacity(0.08),
                          ),
                        ),
                        child: CheckboxListTile(
                          value: isChecked,
                          title: Text(
                            item['name'] ?? '',
                            style: TextStyle(
                              decoration: isChecked ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          subtitle: Text('Qty: ${item['quantity'] ?? '1'}'),
                          onChanged: (val) {
                            if (val != null) {
                              onItemToggle?.call(item['id'] ?? '', val);
                            }
                          },
                        ),
                      );
                    }).toList(),
                  ],
                );
              }).toList(),
            ),
    );
  }
}

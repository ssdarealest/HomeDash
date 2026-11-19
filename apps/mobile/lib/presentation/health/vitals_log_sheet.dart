import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class VitalsLogSheet extends StatefulWidget {
  final String householdId;
  final String memberId;
  final Function(Map<String, dynamic> vitalData)? onSaved;

  const VitalsLogSheet({
    Key? key,
    required this.householdId,
    required this.memberId,
    this.onSaved,
  }) : super(key: key);

  @override
  State<VitalsLogSheet> createState() => _VitalsLogSheetState();
}

class _VitalsLogSheetState extends State<VitalsLogSheet> {
  String _selectedVital = 'blood_pressure';
  final _primaryController = TextEditingController(text: '120');
  final _secondaryController = TextEditingController(text: '80');
  final _unitController = TextEditingController(text: 'mmHg');
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _primaryController.dispose();
    _secondaryController.dispose();
    _unitController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _onVitalChanged(String vital) {
    setState(() {
      _selectedVital = vital;
      if (vital == 'blood_pressure') {
        _unitController.text = 'mmHg';
        _primaryController.text = '120';
        _secondaryController.text = '80';
      } else if (vital == 'blood_glucose') {
        _unitController.text = 'mg/dL';
        _primaryController.text = '95';
        _secondaryController.clear();
      } else if (vital == 'heart_rate') {
        _unitController.text = 'bpm';
        _primaryController.text = '72';
        _secondaryController.clear();
      } else if (vital == 'temperature') {
        _unitController.text = 'degF';
        _primaryController.text = '98.6';
        _secondaryController.clear();
      }
    });
  }

  void _submit() {
    final primary = double.tryParse(_primaryController.text.trim()) ?? 0.0;
    final secondary = _secondaryController.text.trim().isNotEmpty
        ? double.tryParse(_secondaryController.text.trim())
        : null;

    final data = {
      'householdId': widget.householdId,
      'memberId': widget.memberId,
      'vitalType': _selectedVital,
      'valuePrimary': primary,
      'valueSecondary': secondary,
      'unit': _unitController.text.trim(),
      'notes': _notesController.text.trim(),
      'recordedAt': DateTime.now().toIso8601String(),
    };

    widget.onSaved?.call(data);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isBp = _selectedVital == 'blood_pressure';

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
                'Log Health Vitals',
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
          DropdownButtonFormField<String>(
            value: _selectedVital,
            decoration: const InputDecoration(
              labelText: 'Vital Type',
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(value: 'blood_pressure', child: Text('Blood Pressure (Systolic/Diastolic)')),
              DropdownMenuItem(value: 'blood_glucose', child: Text('Blood Glucose')),
              DropdownMenuItem(value: 'heart_rate', child: Text('Heart Rate')),
              DropdownMenuItem(value: 'temperature', child: Text('Body Temperature')),
            ],
            onChanged: (val) {
              if (val != null) _onVitalChanged(val);
            },
          ),
          const SizedBox(height: 12.0),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _primaryController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: isBp ? 'Systolic' : 'Value',
                    border: const OutlineInputBorder(),
                  ),
                ),
              ),
              if (isBp) ...[
                const SizedBox(width: 12.0),
                Expanded(
                  child: TextField(
                    controller: _secondaryController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Diastolic',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12.0),
          TextField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: 'Measurement Context / Notes',
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
                'Save Vital Reading',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

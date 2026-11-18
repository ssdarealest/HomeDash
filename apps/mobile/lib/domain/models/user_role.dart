enum UserRole {
  admin('admin', 'Admin (Head of Household)'),
  senior('senior', 'Senior / Grandparent'),
  teenChild('teen_child', 'Teen / Child'),
  caregiverGuest('caregiver_guest', 'Caregiver / Guest');

  final String value;
  final String label;

  const UserRole(this.value, this.label);

  static UserRole fromString(String val) {
    switch (val) {
      case 'admin':
        return UserRole.admin;
      case 'senior':
        return UserRole.senior;
      case 'teen_child':
        return UserRole.teenChild;
      case 'caregiver_guest':
        return UserRole.caregiverGuest;
      default:
        return UserRole.teenChild;
    }
  }

  bool get isCaregiver => this == UserRole.caregiverGuest;
  bool get isSenior => this == UserRole.senior;
  bool get isAdmin => this == UserRole.admin;
}

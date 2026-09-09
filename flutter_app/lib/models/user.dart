enum UserRole {
  farmer,
  buyer,
  transporter,
  fpo,
  admin;

  static UserRole fromString(String roleStr) {
    switch (roleStr.toUpperCase()) {
      case 'ROLE_FARMER':
      case 'FARMER':
        return UserRole.farmer;
      case 'ROLE_BUYER':
      case 'BUYER':
        return UserRole.buyer;
      case 'ROLE_TRANSPORTER':
      case 'TRANSPORTER':
        return UserRole.transporter;
      case 'ROLE_FPO':
      case 'FPO':
        return UserRole.fpo;
      case 'ROLE_ADMIN':
      case 'ADMIN':
        return UserRole.admin;
      default:
        return UserRole.farmer;
    }
  }

  String toApiRole() {
    switch (this) {
      case UserRole.farmer:
        return 'FARMER';
      case UserRole.buyer:
        return 'BUYER';
      case UserRole.transporter:
        return 'TRANSPORTER';
      case UserRole.fpo:
        return 'FPO';
      case UserRole.admin:
        return 'ADMIN';
    }
  }

  String get displayName {
    switch (this) {
      case UserRole.farmer:
        return 'Farmer';
      case UserRole.buyer:
        return 'Buyer / Trader';
      case UserRole.transporter:
        return 'Transporter';
      case UserRole.fpo:
        return 'FPO Desk';
      case UserRole.admin:
        return 'Platform Admin';
    }
  }
}

class User {
  final String id;
  final String email;
  final String name;
  final UserRole role;
  final String? phone;
  final String? profileId;
  final String? token;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
    this.profileId,
    this.token,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['userId']?.toString() ?? json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString() ?? 'KisanLink User',
      role: UserRole.fromString(json['role']?.toString() ?? 'FARMER'),
      phone: json['phone']?.toString(),
      profileId: json['profileId']?.toString(),
      token: json['token']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role.toApiRole(),
      if (phone != null) 'phone': phone,
      if (profileId != null) 'profileId': profileId,
      if (token != null) 'token': token,
    };
  }

  User copyWith({
    String? id,
    String? email,
    String? name,
    UserRole? role,
    String? phone,
    String? profileId,
    String? token,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      phone: phone ?? this.phone,
      profileId: profileId ?? this.profileId,
      token: token ?? this.token,
    );
  }
}

class MandiPrice {
  final String id;
  final String cropName;
  final String marketName;
  final String state;
  final double modalPrice;
  final double minPrice;
  final double maxPrice;
  final double? mspPrice;
  final String arrivalDate;

  MandiPrice({
    required this.id,
    required this.cropName,
    required this.marketName,
    required this.state,
    required this.modalPrice,
    required this.minPrice,
    required this.maxPrice,
    this.mspPrice,
    required this.arrivalDate,
  });

  factory MandiPrice.fromJson(Map<String, dynamic> json) {
    return MandiPrice(
      id: json['id']?.toString() ?? '',
      cropName: json['cropName']?.toString() ?? json['crop']?.toString() ?? 'Commodity',
      marketName: json['marketName']?.toString() ?? json['market']?.toString() ?? 'Mandi Yard',
      state: json['state']?.toString() ?? 'India',
      modalPrice: (json['modalPrice'] as num?)?.toDouble() ?? 0.0,
      minPrice: (json['minPrice'] as num?)?.toDouble() ?? 0.0,
      maxPrice: (json['maxPrice'] as num?)?.toDouble() ?? 0.0,
      mspPrice: (json['mspPrice'] as num?)?.toDouble(),
      arrivalDate: json['arrivalDate']?.toString() ?? json['date']?.toString() ?? 'Today',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'cropName': cropName,
      'marketName': marketName,
      'state': state,
      'modalPrice': modalPrice,
      'minPrice': minPrice,
      'maxPrice': maxPrice,
      if (mspPrice != null) 'mspPrice': mspPrice,
      'arrivalDate': arrivalDate,
    };
  }

  /// Whether modal price is above government MSP
  bool? get isAboveMsp {
    if (mspPrice == null || mspPrice == 0) return null;
    return modalPrice >= mspPrice!;
  }
}

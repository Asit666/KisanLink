class ProduceListing {
  final String id;
  final String cropName;
  final String variety;
  final double quantityQuintals;
  final double expectedPricePerQuintal;
  final String qualityGrade; // Grade A, FAQ, etc.
  final String harvestDate;
  final String status; // ACTIVE, POOLED, SOLD
  final String location;

  ProduceListing({
    required this.id,
    required this.cropName,
    required this.variety,
    required this.quantityQuintals,
    required this.expectedPricePerQuintal,
    required this.qualityGrade,
    required this.harvestDate,
    required this.status,
    required this.location,
  });

  factory ProduceListing.fromJson(Map<String, dynamic> json) {
    return ProduceListing(
      id: json['id']?.toString() ?? '',
      cropName: json['cropName']?.toString() ?? json['crop']?.toString() ?? 'Crop',
      variety: json['variety']?.toString() ?? 'Standard',
      quantityQuintals: (json['quantity'] as num?)?.toDouble() ?? (json['quantityQuintals'] as num?)?.toDouble() ?? 0.0,
      expectedPricePerQuintal: (json['expectedPrice'] as num?)?.toDouble() ?? (json['price'] as num?)?.toDouble() ?? 0.0,
      qualityGrade: json['grade']?.toString() ?? json['qualityGrade']?.toString() ?? 'Grade A',
      harvestDate: json['harvestDate']?.toString() ?? 'Recent',
      status: json['status']?.toString().toUpperCase() ?? 'ACTIVE',
      location: json['location']?.toString() ?? json['village']?.toString() ?? 'Local Farm',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'cropName': cropName,
      'variety': variety,
      'quantity': quantityQuintals,
      'expectedPrice': expectedPricePerQuintal,
      'grade': qualityGrade,
      'harvestDate': harvestDate,
      'status': status,
      'location': location,
    };
  }

  double get totalValuation => quantityQuintals * expectedPricePerQuintal;
}

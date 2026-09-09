class PricePrediction {
  final String cropName;
  final double currentPrice;
  final double forecastPrice7d;
  final double forecastPrice15d;
  final double forecastPrice30d;
  final String trend; // 'BULLISH', 'BEARISH', 'STABLE'
  final int confidencePercent;
  final String recommendation; // 'HOLD', 'SELL', 'SPLIT'

  PricePrediction({
    required this.cropName,
    required this.currentPrice,
    required this.forecastPrice7d,
    required this.forecastPrice15d,
    required this.forecastPrice30d,
    required this.trend,
    required this.confidencePercent,
    required this.recommendation,
  });

  factory PricePrediction.fromJson(Map<String, dynamic> json) {
    return PricePrediction(
      cropName: json['cropName']?.toString() ?? json['crop']?.toString() ?? 'Commodity',
      currentPrice: (json['currentPrice'] as num?)?.toDouble() ?? 0.0,
      forecastPrice7d: (json['forecastPrice7d'] as num?)?.toDouble() ?? (json['forecast7d'] as num?)?.toDouble() ?? 0.0,
      forecastPrice15d: (json['forecastPrice15d'] as num?)?.toDouble() ?? (json['forecast15d'] as num?)?.toDouble() ?? 0.0,
      forecastPrice30d: (json['forecastPrice30d'] as num?)?.toDouble() ?? (json['forecast30d'] as num?)?.toDouble() ?? 0.0,
      trend: json['trend']?.toString().toUpperCase() ?? 'STABLE',
      confidencePercent: (json['confidencePercent'] as num?)?.toInt() ?? 85,
      recommendation: json['recommendation']?.toString().toUpperCase() ?? 'HOLD',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'cropName': cropName,
      'currentPrice': currentPrice,
      'forecastPrice7d': forecastPrice7d,
      'forecastPrice15d': forecastPrice15d,
      'forecastPrice30d': forecastPrice30d,
      'trend': trend,
      'confidencePercent': confidencePercent,
      'recommendation': recommendation,
    };
  }

  bool get isBullish => trend == 'BULLISH' || trend == 'UP';
  bool get isBearish => trend == 'BEARISH' || trend == 'DOWN';
}

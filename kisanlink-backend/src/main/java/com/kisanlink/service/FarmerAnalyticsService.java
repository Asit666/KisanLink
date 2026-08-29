package com.kisanlink.service;

import com.kisanlink.dto.FarmerAnalyticsResponse;
import com.kisanlink.dto.MonthlyEarningsData;
import com.kisanlink.entity.Farmer;
import com.kisanlink.entity.MarketPrice;
import com.kisanlink.entity.TradeDeal;
import com.kisanlink.entity.TradeStatus;
import com.kisanlink.repository.FarmerRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.TradeDealRepository;
import com.kisanlink.security.OwnershipService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FarmerAnalyticsService {

    private final FarmerRepository farmerRepository;
    private final TradeDealRepository tradeDealRepository;
    private final MarketPriceRepository marketPriceRepository;
    private final OwnershipService ownershipService;

    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("MMM yyyy");

    public FarmerAnalyticsService(FarmerRepository farmerRepository,
                                  TradeDealRepository tradeDealRepository,
                                  MarketPriceRepository marketPriceRepository,
                                  OwnershipService ownershipService) {
        this.farmerRepository = farmerRepository;
        this.tradeDealRepository = tradeDealRepository;
        this.marketPriceRepository = marketPriceRepository;
        this.ownershipService = ownershipService;
    }

    @Transactional(readOnly = true)
    public FarmerAnalyticsResponse getFarmerAnalytics(Long farmerId, String userEmail) {
        ownershipService.checkFarmerOwnership(farmerId, userEmail);

        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found: " + farmerId));

        List<TradeDeal> allDeals = tradeDealRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);

        // Include all active / contracted deals in total lifetime analytics
        List<TradeDeal> activeDeals = allDeals.stream()
                .filter(d -> d.getStatus() != TradeStatus.CANCELLED)
                .toList();

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalVolumeKg = BigDecimal.ZERO;
        BigDecimal totalBenchmarkRevenue = BigDecimal.ZERO;
        int completedCount = 0;

        for (TradeDeal deal : activeDeals) {

            BigDecimal returnVal = deal.getNetFarmerReturn() != null ? deal.getNetFarmerReturn() : deal.getTotalAmount();
            if (returnVal != null) {
                totalRevenue = totalRevenue.add(returnVal);
            }
            if (deal.getQuantity() != null) {
                totalVolumeKg = totalVolumeKg.add(deal.getQuantity());
            }
            if (deal.getStatus() == TradeStatus.COMPLETED) {
                completedCount++;
            }

            // Calculate local mandi benchmark price for this crop (standardized in ₹/kg)
            BigDecimal benchmarkPrice = getBenchmarkPrice(deal.getCrop().getId(), deal.getAgreedPricePerKg());
            BigDecimal benchmarkDealRev = benchmarkPrice.multiply(deal.getQuantity() != null ? deal.getQuantity() : BigDecimal.ZERO);
            totalBenchmarkRevenue = totalBenchmarkRevenue.add(benchmarkDealRev);
        }

        // If no settled deals exist, provide zeroed baseline
        if (totalVolumeKg.compareTo(BigDecimal.ZERO) == 0) {
            return new FarmerAnalyticsResponse(
                    farmerId,
                    farmer.getUser().getName(),
                    farmer.getDistrict(),
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    0,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    List.of()
            );
        }

        BigDecimal totalVolumeTons = totalVolumeKg.divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
        BigDecimal avgPricePerKg = totalRevenue.divide(totalVolumeKg, 2, RoundingMode.HALF_UP);
        BigDecimal avgBenchmarkPricePerKg = totalBenchmarkRevenue.divide(totalVolumeKg, 2, RoundingMode.HALF_UP);

        BigDecimal extraProfit = totalRevenue.subtract(totalBenchmarkRevenue);
        if (extraProfit.compareTo(BigDecimal.ZERO) < 0) {
            extraProfit = BigDecimal.ZERO;
        }

        BigDecimal premiumIndexPercent = BigDecimal.ZERO;
        if (totalBenchmarkRevenue.compareTo(BigDecimal.ZERO) > 0) {
            premiumIndexPercent = extraProfit.divide(totalBenchmarkRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
        }

        // Group monthly data from actual transactions
        List<MonthlyEarningsData> monthlyList = buildMonthlyEarnings(activeDeals, premiumIndexPercent);


        return new FarmerAnalyticsResponse(
                farmerId,
                farmer.getUser().getName(),
                farmer.getDistrict(),
                totalRevenue.setScale(2, RoundingMode.HALF_UP),
                totalVolumeKg.setScale(2, RoundingMode.HALF_UP),
                totalVolumeTons,
                completedCount,
                avgPricePerKg,
                avgBenchmarkPricePerKg,
                premiumIndexPercent,
                extraProfit.setScale(2, RoundingMode.HALF_UP),
                monthlyList
        );
    }

    private BigDecimal getBenchmarkPrice(Long cropId, BigDecimal agreedPrice) {
        if (cropId != null) {
            List<MarketPrice> prices = marketPriceRepository.findByCropIdOrderByDateDesc(cropId);
            if (!prices.isEmpty() && prices.get(0).getModalPrice() != null) {
                // Market modal price is standardized in ₹/kg
                return prices.get(0).getModalPrice();
            }
        }
        // Fallback: local market modal baseline is ~82% of direct buyer deal price
        return (agreedPrice != null)
                ? agreedPrice.multiply(BigDecimal.valueOf(0.82)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(20.0);
    }

    private List<MonthlyEarningsData> buildMonthlyEarnings(List<TradeDeal> deals,
                                                          BigDecimal premiumPct) {
        Map<String, List<TradeDeal>> byMonth = deals.stream()
                .collect(Collectors.groupingBy(d ->
                        d.getCreatedAt().atZone(ZoneId.systemDefault()).format(MONTH_FORMAT)
                ));

        List<MonthlyEarningsData> result = new ArrayList<>();
        for (Map.Entry<String, List<TradeDeal>> entry : byMonth.entrySet()) {
            String month = entry.getKey();
            List<TradeDeal> mDeals = entry.getValue();

            BigDecimal mRev = mDeals.stream()
                    .map(d -> d.getNetFarmerReturn() != null ? d.getNetFarmerReturn() : d.getTotalAmount())
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal mVol = mDeals.stream()
                    .map(TradeDeal::getQuantity)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal mTons = mVol.divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
            int mCompleted = (int) mDeals.stream().filter(d -> d.getStatus() == TradeStatus.COMPLETED).count();

            BigDecimal mBenchmark = mDeals.stream()
                    .map(d -> getBenchmarkPrice(d.getCrop().getId(), d.getAgreedPricePerKg()).multiply(d.getQuantity() != null ? d.getQuantity() : BigDecimal.ZERO))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal mExtraProfit = mRev.subtract(mBenchmark);
            if (mExtraProfit.compareTo(BigDecimal.ZERO) < 0) mExtraProfit = BigDecimal.ZERO;

            result.add(new MonthlyEarningsData(
                    month,
                    mRev.setScale(2, RoundingMode.HALF_UP),
                    mVol.setScale(2, RoundingMode.HALF_UP),
                    mTons,
                    mCompleted,
                    premiumPct,
                    mExtraProfit.setScale(2, RoundingMode.HALF_UP)
            ));
        }

        return result;
    }

}

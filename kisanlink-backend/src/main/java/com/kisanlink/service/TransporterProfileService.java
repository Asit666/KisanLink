package com.kisanlink.service;

import com.kisanlink.dto.TransporterProfileRequest;
import com.kisanlink.entity.Transporter;
import com.kisanlink.entity.User;
import com.kisanlink.repository.TransporterRepository;
import com.kisanlink.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransporterProfileService {

    private final TransporterRepository transporterRepo;
    private final UserRepository userRepository;

    public TransporterProfileService(TransporterRepository transporterRepo, UserRepository userRepository) {
        this.transporterRepo = transporterRepo;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Transporter getProfile(Long transporterId, String email) {
        Transporter t = transporterRepo.findById(transporterId)
                .orElseThrow(() -> new IllegalArgumentException("Transporter not found"));
        if (!t.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new SecurityException("Access denied");
        }
        return t;
    }

    @Transactional
    public Transporter updateProfile(Long transporterId, TransporterProfileRequest req, String email) {
        Transporter t = transporterRepo.findById(transporterId)
                .orElseThrow(() -> new IllegalArgumentException("Transporter not found"));
        if (!t.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new SecurityException("Access denied");
        }
        t.setVehicleType(req.vehicleType());
        if (req.vehicleNumber() != null) t.setVehicleNumber(req.vehicleNumber());
        if (req.capacityKg() != null) t.setCapacityKg(req.capacityKg());
        if (req.baseDistrict() != null) t.setBaseDistrict(req.baseDistrict());
        if (req.baseState() != null) t.setBaseState(req.baseState());
        if (req.baseLatitude() != null) t.setBaseLatitude(req.baseLatitude());
        if (req.baseLongitude() != null) t.setBaseLongitude(req.baseLongitude());
        if (req.ratePerKm() != null) t.setRatePerKm(req.ratePerKm());
        if (req.baseCharge() != null) t.setBaseCharge(req.baseCharge());
        if (req.alertPhone() != null) t.setAlertPhone(req.alertPhone());
        t.setAvailable(req.available());
        return transporterRepo.save(t);
    }
}

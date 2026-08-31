package com.kisanlink.service;

import com.kisanlink.dto.TransporterVehicleRequest;
import com.kisanlink.entity.Transporter;
import com.kisanlink.entity.TransporterVehicle;
import com.kisanlink.repository.TransporterRepository;
import com.kisanlink.repository.TransporterVehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransporterVehicleService {

    private final TransporterVehicleRepository vehicleRepo;
    private final TransporterRepository transporterRepo;

    public TransporterVehicleService(TransporterVehicleRepository vehicleRepo, TransporterRepository transporterRepo) {
        this.vehicleRepo = vehicleRepo;
        this.transporterRepo = transporterRepo;
    }

    @Transactional(readOnly = true)
    public List<TransporterVehicle> getMyVehicles(String email) {
        Transporter t = transporterRepo.findByUserEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Transporter profile not found for email: " + email));
        return vehicleRepo.findByTransporterIdOrderByCreatedAtDesc(t.getId());
    }

    @Transactional
    public TransporterVehicle addVehicle(TransporterVehicleRequest req, String email) {
        Transporter t = transporterRepo.findByUserEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Transporter profile not found for email: " + email));

        TransporterVehicle vehicle = new TransporterVehicle();
        vehicle.setTransporter(t);
        vehicle.setVehicleType(req.vehicleType());
        vehicle.setVehicleNumber(req.vehicleNumber().trim().toUpperCase());
        vehicle.setCapacityKg(req.capacityKg());
        vehicle.setRatePerKm(req.ratePerKm());
        vehicle.setBaseCharge(req.baseCharge());
        vehicle.setActive(req.active() != null ? req.active() : true);
        vehicle.setStatus(req.status() != null ? req.status() : "AVAILABLE");

        return vehicleRepo.save(vehicle);
    }

    @Transactional
    public TransporterVehicle updateVehicle(Long vehicleId, TransporterVehicleRequest req, String email) {
        Transporter t = transporterRepo.findByUserEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Transporter profile not found"));

        TransporterVehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + vehicleId));

        if (!vehicle.getTransporter().getId().equals(t.getId())) {
            throw new SecurityException("You do not own this vehicle");
        }

        if (req.vehicleType() != null) vehicle.setVehicleType(req.vehicleType());
        if (req.vehicleNumber() != null) vehicle.setVehicleNumber(req.vehicleNumber().trim().toUpperCase());
        if (req.capacityKg() != null) vehicle.setCapacityKg(req.capacityKg());
        if (req.ratePerKm() != null) vehicle.setRatePerKm(req.ratePerKm());
        if (req.baseCharge() != null) vehicle.setBaseCharge(req.baseCharge());
        if (req.active() != null) vehicle.setActive(req.active());
        if (req.status() != null) vehicle.setStatus(req.status());

        return vehicleRepo.save(vehicle);
    }

    @Transactional
    public void deleteVehicle(Long vehicleId, String email) {
        Transporter t = transporterRepo.findByUserEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Transporter profile not found"));

        TransporterVehicle vehicle = vehicleRepo.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + vehicleId));

        if (!vehicle.getTransporter().getId().equals(t.getId())) {
            throw new SecurityException("You do not own this vehicle");
        }

        vehicleRepo.delete(vehicle);
    }
}

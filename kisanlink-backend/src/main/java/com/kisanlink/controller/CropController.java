package com.kisanlink.controller;

import com.kisanlink.entity.Crop;
import com.kisanlink.entity.CropCategory;
import com.kisanlink.service.CropService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crops")
public class CropController {
    private final CropService cropService;

    public CropController(CropService cropService) {
        this.cropService = cropService;
    }

    /**
     * Returns all valid crop categories. Intended for populating dropdowns
     * in the farmer produce entry and buyer requirement forms.
     */
    @GetMapping("/categories")
    public List<CropCategory> listCategories() {
        return cropService.findAllCategories();
    }

    /**
     * Returns all crops, optionally filtered by category.
     * Example: GET /api/crops?category=VEGETABLE
     */
    @GetMapping
    public List<Crop> findAll(@RequestParam(required = false) CropCategory category) {
        if (category != null) {
            return cropService.findByCategory(category);
        }
        return cropService.findAll();
    }

    @GetMapping("/{id}")
    public Crop findById(@PathVariable Long id) {
        return cropService.findById(id);
    }

    @GetMapping("/search")
    public List<Crop> search(@RequestParam String query) {
        return cropService.search(query);
    }


    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Crop create(@Valid @RequestBody Crop crop) {
        return cropService.create(crop);
    }
}


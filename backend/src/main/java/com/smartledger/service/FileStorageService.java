package com.smartledger.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class FileStorageService {

    private Cloudinary cloudinary;
    private final boolean useCloudinary;

    public FileStorageService(Environment env) {
        String cloudinaryUrl = env.getProperty("CLOUDINARY_URL");
        if (cloudinaryUrl != null && !cloudinaryUrl.isEmpty()) {
            this.cloudinary = new Cloudinary(cloudinaryUrl);
            this.useCloudinary = true;
        } else {
            this.useCloudinary = false;
        }
    }

    public String storeFile(MultipartFile file) {
        if (!useCloudinary) {
            System.err.println("WARNING: CLOUDINARY_URL is not set. File uploads will fail in production.");
            throw new RuntimeException("File storage is not configured (missing CLOUDINARY_URL).");
        }

        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return uploadResult.get("secure_url").toString();
        } catch (IOException ex) {
            throw new RuntimeException("Could not upload file to Cloudinary. Please try again!", ex);
        }
    }
}

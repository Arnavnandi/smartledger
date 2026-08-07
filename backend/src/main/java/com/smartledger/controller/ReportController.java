package com.smartledger.controller;

import com.smartledger.model.dto.ReportSummaryResponse;
import com.smartledger.security.CustomUserDetails;
import com.smartledger.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ((CustomUserDetails) authentication.getPrincipal()).getUsername();
    }

    @GetMapping("/monthly")
    public ResponseEntity<ReportSummaryResponse> getMonthlyReport(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(reportService.generateMonthlyReport(getAuthenticatedUserEmail(), year, month));
    }

    @GetMapping("/yearly")
    public ResponseEntity<ReportSummaryResponse> getYearlyReport(
            @RequestParam int year) {
        return ResponseEntity.ok(reportService.generateYearlyReport(getAuthenticatedUserEmail(), year));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam String format,
            @RequestParam int year,
            @RequestParam(required = false) Integer month) {
        
        String email = getAuthenticatedUserEmail();
        byte[] data;
        String filename = "report_" + year + (month != null ? "_" + month : "");
        MediaType mediaType;
        
        switch (format.toLowerCase()) {
            case "csv":
                data = reportService.exportToCsv(email, year, month);
                filename += ".csv";
                mediaType = MediaType.parseMediaType("text/csv");
                break;
            case "excel":
                data = reportService.exportToExcel(email, year, month);
                filename += ".xlsx";
                mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                break;
            case "pdf":
                data = reportService.exportToPdf(email, year, month);
                filename += ".pdf";
                mediaType = MediaType.APPLICATION_PDF;
                break;
            default:
                throw new RuntimeException("Unsupported format");
        }
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDispositionFormData("filename", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }
}

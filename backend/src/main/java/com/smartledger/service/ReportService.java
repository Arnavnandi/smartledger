package com.smartledger.service;

import com.smartledger.model.Company;
import com.smartledger.model.Expense;
import com.smartledger.model.Invoice;
import com.smartledger.model.User;
import com.smartledger.model.dto.ChartDataPoint;
import com.smartledger.model.dto.ExpenseResponse;
import com.smartledger.model.dto.InvoiceResponse;
import com.smartledger.model.dto.ReportSummaryResponse;
import com.smartledger.repository.CompanyRepository;
import com.smartledger.repository.ExpenseRepository;
import com.smartledger.repository.InvoiceRepository;
import com.smartledger.repository.UserRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final InvoiceRepository invoiceRepository;
    private final ExpenseRepository expenseRepository;
    private final AuthContextService authContextService;
    private final CurrencyService currencyService;

    public ReportService(InvoiceRepository invoiceRepository, ExpenseRepository expenseRepository, AuthContextService authContextService, CurrencyService currencyService) {
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
        this.authContextService = authContextService;
        this.currencyService = currencyService;
    }



    @Transactional(readOnly = true)
    public ReportSummaryResponse generateMonthlyReport(String email, int year, int month) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        
        List<Invoice> invoices = getPaidInvoicesInRange(company, startDate, endDate);
        List<Expense> expenses = getExpensesInRange(company, startDate, endDate);
        
        double totalRevenue = invoices.stream().mapToDouble(Invoice::getTotalAmount).sum();
        double totalExpenses = expenses.stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();
        
        double convertedRev = currencyService.convertToDisplay(totalRevenue, company.getCurrency());
        double convertedExp = currencyService.convertToDisplay(totalExpenses, company.getCurrency());
        double convertedNet = convertedRev - convertedExp;
        
        // Breakdown by week (simplified to just weeks in month)
        List<ChartDataPoint> breakdown = new ArrayList<>();
        // Simplify: just return the totals for this specific month as 1 point
        breakdown.add(new ChartDataPoint("Week 1-4", convertedRev, convertedExp));
        
        List<InvoiceResponse> topInvoices = invoices.stream()
                .sorted((a, b) -> Double.compare(b.getTotalAmount(), a.getTotalAmount()))
                .limit(5).map(i -> {
                    InvoiceResponse r = new InvoiceResponse(i);
                    r.setSubTotal(currencyService.convertToDisplay(i.getSubTotal(), company.getCurrency()));
                    r.setTaxTotal(currencyService.convertToDisplay(i.getTaxTotal(), company.getCurrency()));
                    r.setDiscountTotal(currencyService.convertToDisplay(i.getDiscountTotal(), company.getCurrency()));
                    r.setTotalAmount(currencyService.convertToDisplay(i.getTotalAmount(), company.getCurrency()));
                    return r;
                }).collect(Collectors.toList());
                
        List<ExpenseResponse> topExpenses = expenses.stream()
                .sorted((a, b) -> b.getAmount().compareTo(a.getAmount()))
                .limit(5).map(e -> {
                    ExpenseResponse r = new ExpenseResponse(e);
                    r.setAmount(currencyService.convertToDisplay(e.getAmount(), company.getCurrency()));
                    return r;
                }).collect(Collectors.toList());
        
        return new ReportSummaryResponse(startDate.format(DateTimeFormatter.ofPattern("MMMM yyyy")), convertedRev, convertedExp, convertedNet, breakdown, topInvoices, topExpenses);
    }
    
    @Transactional(readOnly = true)
    public ReportSummaryResponse generateYearlyReport(String email, int year) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        LocalDate startDate = LocalDate.of(year, 1, 1);
        LocalDate endDate = LocalDate.of(year, 12, 31);
        
        List<Invoice> invoices = getPaidInvoicesInRange(company, startDate, endDate);
        List<Expense> expenses = getExpensesInRange(company, startDate, endDate);
        
        double totalRevenue = invoices.stream().mapToDouble(Invoice::getTotalAmount).sum();
        double totalExpenses = expenses.stream().mapToDouble(e -> e.getAmount().doubleValue()).sum();
        
        double convertedRev = currencyService.convertToDisplay(totalRevenue, company.getCurrency());
        double convertedExp = currencyService.convertToDisplay(totalExpenses, company.getCurrency());
        double convertedNet = convertedRev - convertedExp;
        
        Map<String, ChartDataPoint> monthlyData = new LinkedHashMap<>();
        for (int i = 1; i <= 12; i++) {
            String monthName = LocalDate.of(year, i, 1).format(DateTimeFormatter.ofPattern("MMM"));
            monthlyData.put(monthName, new ChartDataPoint(monthName, 0.0, 0.0));
        }
        
        for (Invoice inv : invoices) {
            String m = inv.getIssueDate().format(DateTimeFormatter.ofPattern("MMM"));
            if (monthlyData.containsKey(m)) {
                ChartDataPoint pt = monthlyData.get(m);
                monthlyData.put(m, new ChartDataPoint(m, pt.getRevenue() + inv.getTotalAmount(), pt.getExpense()));
            }
        }
        
        for (Expense exp : expenses) {
            String m = exp.getExpenseDate().format(DateTimeFormatter.ofPattern("MMM"));
            if (monthlyData.containsKey(m)) {
                ChartDataPoint pt = monthlyData.get(m);
                monthlyData.put(m, new ChartDataPoint(m, pt.getRevenue(), pt.getExpense() + exp.getAmount().doubleValue()));
            }
        }
        
        List<ChartDataPoint> finalMonthly = monthlyData.values().stream().map(pt -> new ChartDataPoint(
            pt.getMonth(),
            currencyService.convertToDisplay(pt.getRevenue(), company.getCurrency()),
            currencyService.convertToDisplay(pt.getExpense(), company.getCurrency())
        )).collect(Collectors.toList());
        
        List<InvoiceResponse> topInvoices = invoices.stream()
                .sorted((a, b) -> Double.compare(b.getTotalAmount(), a.getTotalAmount()))
                .limit(5).map(i -> {
                    InvoiceResponse r = new InvoiceResponse(i);
                    r.setSubTotal(currencyService.convertToDisplay(i.getSubTotal(), company.getCurrency()));
                    r.setTaxTotal(currencyService.convertToDisplay(i.getTaxTotal(), company.getCurrency()));
                    r.setDiscountTotal(currencyService.convertToDisplay(i.getDiscountTotal(), company.getCurrency()));
                    r.setTotalAmount(currencyService.convertToDisplay(i.getTotalAmount(), company.getCurrency()));
                    return r;
                }).collect(Collectors.toList());
                
        List<ExpenseResponse> topExpenses = expenses.stream()
                .sorted((a, b) -> b.getAmount().compareTo(a.getAmount()))
                .limit(5).map(e -> {
                    ExpenseResponse r = new ExpenseResponse(e);
                    r.setAmount(currencyService.convertToDisplay(e.getAmount(), company.getCurrency()));
                    return r;
                }).collect(Collectors.toList());
                
        return new ReportSummaryResponse("Year " + year, convertedRev, convertedExp, convertedNet, finalMonthly, topInvoices, topExpenses);
    }

    private List<Invoice> getPaidInvoicesInRange(Company company, LocalDate start, LocalDate end) {
        // Simple fetch all and filter in memory for prototype; ideally use JPA Spec
        return invoiceRepository.findAll().stream()
                .filter(i -> i.getCompany().getId().equals(company.getId()) && i.getStatus() == com.smartledger.model.InvoiceStatus.PAID)
                .filter(i -> !i.getIssueDate().isBefore(start) && !i.getIssueDate().isAfter(end))
                .collect(Collectors.toList());
    }

    private List<Expense> getExpensesInRange(Company company, LocalDate start, LocalDate end) {
        return expenseRepository.findAll().stream()
                .filter(e -> e.getCompany().getId().equals(company.getId()))
                .filter(e -> !e.getExpenseDate().isBefore(start) && !e.getExpenseDate().isAfter(end))
                .collect(Collectors.toList());
    }

    // EXPORTS
    @Transactional(readOnly = true)
    public byte[] exportToCsv(String email, int year, Integer month) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        LocalDate start = month != null ? LocalDate.of(year, month, 1) : LocalDate.of(year, 1, 1);
        LocalDate end = month != null ? start.withDayOfMonth(start.lengthOfMonth()) : LocalDate.of(year, 12, 31);
        
        List<Invoice> invoices = getPaidInvoicesInRange(company, start, end);
        List<Expense> expenses = getExpensesInRange(company, start, end);
        
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             PrintWriter writer = new PrintWriter(out);
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader("Type", "Date", "Description", "Amount"))) {
            
            for (Invoice i : invoices) {
                csvPrinter.printRecord("Income", i.getIssueDate(), "Invoice " + i.getInvoiceNumber() + " - " + i.getClient().getName(), currencyService.convertToDisplay(i.getTotalAmount(), company.getCurrency()));
            }
            
            for (Expense e : expenses) {
                csvPrinter.printRecord("Expense", e.getExpenseDate(), e.getVendorName() + (e.getCategory() != null ? " (" + e.getCategory().getName() + ")" : ""), currencyService.convertToDisplay(e.getAmount(), company.getCurrency()));
            }
            
            csvPrinter.flush();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV", e);
        }
    }
    
    @Transactional(readOnly = true)
    public byte[] exportToExcel(String email, int year, Integer month) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        LocalDate start = month != null ? LocalDate.of(year, month, 1) : LocalDate.of(year, 1, 1);
        LocalDate end = month != null ? start.withDayOfMonth(start.lengthOfMonth()) : LocalDate.of(year, 12, 31);
        
        List<Invoice> invoices = getPaidInvoicesInRange(company, start, end);
        List<Expense> expenses = getExpensesInRange(company, start, end);
        
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Financial Report");
            
            // Header
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Type", "Date", "Description", "Amount"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }
            
            int rowIdx = 1;
            for (Invoice i : invoices) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue("Income");
                row.createCell(1).setCellValue(i.getIssueDate().toString());
                row.createCell(2).setCellValue("Invoice " + i.getInvoiceNumber() + " - " + i.getClient().getName());
                row.createCell(3).setCellValue(currencyService.convertToDisplay(i.getTotalAmount(), company.getCurrency()));
            }
            
            for (Expense e : expenses) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue("Expense");
                row.createCell(1).setCellValue(e.getExpenseDate().toString());
                row.createCell(2).setCellValue(e.getVendorName() + (e.getCategory() != null ? " (" + e.getCategory().getName() + ")" : ""));
                row.createCell(3).setCellValue(currencyService.convertToDisplay(e.getAmount(), company.getCurrency()).doubleValue());
            }
            
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Excel", e);
        }
    }
    
    @Transactional(readOnly = true)
    public byte[] exportToPdf(String email, int year, Integer month) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        LocalDate start = month != null ? LocalDate.of(year, month, 1) : LocalDate.of(year, 1, 1);
        LocalDate end = month != null ? start.withDayOfMonth(start.lengthOfMonth()) : LocalDate.of(year, 12, 31);
        
        List<Invoice> invoices = getPaidInvoicesInRange(company, start, end);
        List<Expense> expenses = getExpensesInRange(company, start, end);
        
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            com.lowagie.text.Document document = new com.lowagie.text.Document();
            com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
            document.open();
            
            com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 18);
            document.add(new com.lowagie.text.Paragraph("Financial Report - " + company.getName(), titleFont));
            document.add(new com.lowagie.text.Paragraph("Period: " + start.toString() + " to " + end.toString()));
            document.add(new com.lowagie.text.Paragraph(" "));
            
            com.lowagie.text.pdf.PdfPTable table = new com.lowagie.text.pdf.PdfPTable(4);
            table.setWidthPercentage(100);
            table.addCell("Type");
            table.addCell("Date");
            table.addCell("Description");
            table.addCell("Amount");
            
            String currency = company.getCurrency() != null ? company.getCurrency() : "INR";

            for (Invoice i : invoices) {
                table.addCell("Income");
                table.addCell(i.getIssueDate().toString());
                table.addCell("Invoice " + i.getInvoiceNumber() + " - " + i.getClient().getName());
                table.addCell(currency + " " + String.format("%.2f", currencyService.convertToDisplay(i.getTotalAmount(), currency)));
            }
            
            for (Expense e : expenses) {
                table.addCell("Expense");
                table.addCell(e.getExpenseDate().toString());
                table.addCell(e.getVendorName() + (e.getCategory() != null ? " (" + e.getCategory().getName() + ")" : ""));
                table.addCell(currency + " " + String.format("%.2f", currencyService.convertToDisplay(e.getAmount(), currency)));
            }
            
            document.add(table);
            document.close();
            
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}

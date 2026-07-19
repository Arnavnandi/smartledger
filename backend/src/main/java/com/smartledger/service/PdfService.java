package com.smartledger.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.smartledger.model.Invoice;
import com.smartledger.model.InvoiceItem;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Paths;

@Service
public class PdfService {

    private final CurrencyService currencyService;

    public PdfService(CurrencyService currencyService) {
        this.currencyService = currencyService;
    }

    public byte[] generateInvoicePdf(Invoice invoice) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            String currency = invoice.getCompany().getCurrency() != null ? invoice.getCompany().getCurrency() : "INR";

            // Font configurations
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font bodyBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            // Add Logo if exists
            if (invoice.getCompany().getLogoUrl() != null && !invoice.getCompany().getLogoUrl().isEmpty()) {
                try {
                    // Extract local path from URL
                    String logoUrl = invoice.getCompany().getLogoUrl();
                    String fileName = logoUrl.substring(logoUrl.lastIndexOf("/") + 1);
                    File logoFile = Paths.get("./uploads", fileName).toFile();
                    
                    if (logoFile.exists()) {
                        Image logo = Image.getInstance(logoFile.getAbsolutePath());
                        logo.scaleToFit(120, 80);
                        logo.setAlignment(Element.ALIGN_LEFT);
                        document.add(logo);
                    }
                } catch (Exception e) {
                    System.err.println("Could not load logo: " + e.getMessage());
                }
            }

            // Header Section
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setSpacingBefore(10);
            headerTable.setSpacingAfter(20);

            // Company Details
            PdfPCell companyCell = new PdfPCell();
            companyCell.setBorder(Rectangle.NO_BORDER);
            companyCell.addElement(new Paragraph(invoice.getCompany().getName(), headerFont));
            if (invoice.getCompany().getAddress() != null) {
                companyCell.addElement(new Paragraph(invoice.getCompany().getAddress(), bodyFont));
            }
            if (invoice.getCompany().getGstNumber() != null) {
                companyCell.addElement(new Paragraph("GST: " + invoice.getCompany().getGstNumber(), bodyFont));
            }
            headerTable.addCell(companyCell);

            // Invoice Title & Details
            PdfPCell invoiceDetailsCell = new PdfPCell();
            invoiceDetailsCell.setBorder(Rectangle.NO_BORDER);
            invoiceDetailsCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            
            Paragraph title = new Paragraph("INVOICE", titleFont);
            title.setAlignment(Element.ALIGN_RIGHT);
            invoiceDetailsCell.addElement(title);
            
            Paragraph invNum = new Paragraph("#" + invoice.getInvoiceNumber(), bodyBoldFont);
            invNum.setAlignment(Element.ALIGN_RIGHT);
            invoiceDetailsCell.addElement(invNum);
            
            Paragraph date = new Paragraph("Date: " + invoice.getIssueDate(), bodyFont);
            date.setAlignment(Element.ALIGN_RIGHT);
            invoiceDetailsCell.addElement(date);
            
            Paragraph dueDate = new Paragraph("Due Date: " + invoice.getDueDate(), bodyFont);
            dueDate.setAlignment(Element.ALIGN_RIGHT);
            invoiceDetailsCell.addElement(dueDate);
            
            headerTable.addCell(invoiceDetailsCell);
            document.add(headerTable);

            // Billed To Section
            Paragraph billedToTitle = new Paragraph("Bill To:", headerFont);
            billedToTitle.setSpacingBefore(10);
            document.add(billedToTitle);

            Paragraph clientName = new Paragraph(invoice.getClient().getName(), bodyBoldFont);
            document.add(clientName);
            if (invoice.getClient().getAddress() != null) {
                document.add(new Paragraph(invoice.getClient().getAddress(), bodyFont));
            }
            if (invoice.getClient().getEmail() != null) {
                document.add(new Paragraph(invoice.getClient().getEmail(), bodyFont));
            }

            // Line Items Table
            PdfPTable itemsTable = new PdfPTable(new float[]{4, 1, 1.5f, 1, 1, 1.5f});
            itemsTable.setWidthPercentage(100);
            itemsTable.setSpacingBefore(20);
            itemsTable.setSpacingAfter(20);

            String[] headers = {"Description", "Qty", "Price", "Tax%", "Disc%", "Total"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, bodyBoldFont));
                cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                cell.setPadding(5);
                itemsTable.addCell(cell);
            }

            for (InvoiceItem item : invoice.getItems()) {
                itemsTable.addCell(new Phrase(item.getDescription(), bodyFont));
                itemsTable.addCell(new Phrase(String.valueOf(item.getQuantity()), bodyFont));
                itemsTable.addCell(new Phrase(String.format("%s%.2f", currency, currencyService.convertToDisplay(item.getUnitPrice(), currency)), bodyFont));
                itemsTable.addCell(new Phrase(String.format("%.1f", item.getTaxRate()), bodyFont));
                itemsTable.addCell(new Phrase(String.format("%.1f", item.getDiscount()), bodyFont));
                itemsTable.addCell(new Phrase(String.format("%s%.2f", currency, currencyService.convertToDisplay(item.getTotal(), currency)), bodyFont));
            }
            document.add(itemsTable);

            // Totals Section
            PdfPTable totalsTable = new PdfPTable(new float[]{7, 3});
            totalsTable.setWidthPercentage(100);
            
            totalsTable.addCell(getCell("Subtotal:", Element.ALIGN_RIGHT, bodyFont));
            totalsTable.addCell(getCell(String.format("%s%.2f", currency, currencyService.convertToDisplay(invoice.getSubTotal(), currency)), Element.ALIGN_RIGHT, bodyFont));
            
            if (invoice.getDiscountTotal() > 0) {
                totalsTable.addCell(getCell("Discount:", Element.ALIGN_RIGHT, bodyFont));
                totalsTable.addCell(getCell(String.format("-%s%.2f", currency, currencyService.convertToDisplay(invoice.getDiscountTotal(), currency)), Element.ALIGN_RIGHT, bodyFont));
            }
            
            totalsTable.addCell(getCell("Tax:", Element.ALIGN_RIGHT, bodyFont));
            totalsTable.addCell(getCell(String.format("%s%.2f", currency, currencyService.convertToDisplay(invoice.getTaxTotal(), currency)), Element.ALIGN_RIGHT, bodyFont));
            
            totalsTable.addCell(getCell("Total Due:", Element.ALIGN_RIGHT, headerFont));
            totalsTable.addCell(getCell(String.format("%s%.2f", currency, currencyService.convertToDisplay(invoice.getTotalAmount(), currency)), Element.ALIGN_RIGHT, headerFont));
            
            document.add(totalsTable);

            // Notes and Terms
            if (invoice.getNotes() != null && !invoice.getNotes().isEmpty()) {
                document.add(new Paragraph("Notes:", bodyBoldFont));
                document.add(new Paragraph(invoice.getNotes(), bodyFont));
            }
            
            if (invoice.getTerms() != null && !invoice.getTerms().isEmpty()) {
                document.add(new Paragraph("\nTerms & Conditions:", bodyBoldFont));
                document.add(new Paragraph(invoice.getTerms(), bodyFont));
            }

            // QR Code
            try {
                String qrData = String.format("Invoice: %s | Total: %s%.2f | Due: %s", 
                        invoice.getInvoiceNumber(), currency, invoice.getTotalAmount(), invoice.getDueDate());
                
                QRCodeWriter qrCodeWriter = new QRCodeWriter();
                BitMatrix bitMatrix = qrCodeWriter.encode(qrData, BarcodeFormat.QR_CODE, 100, 100);
                
                ByteArrayOutputStream qrOut = new ByteArrayOutputStream();
                MatrixToImageWriter.writeToStream(bitMatrix, "PNG", qrOut);
                
                Image qrImage = Image.getInstance(qrOut.toByteArray());
                qrImage.setAlignment(Element.ALIGN_CENTER);
                qrImage.setSpacingBefore(30);
                document.add(qrImage);
                
            } catch (Exception e) {
                System.err.println("Could not generate QR Code: " + e.getMessage());
            }

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    private PdfPCell getCell(String text, int alignment, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        cell.setHorizontalAlignment(alignment);
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }
}

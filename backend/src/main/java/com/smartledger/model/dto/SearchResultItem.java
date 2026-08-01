package com.smartledger.model.dto;

public class SearchResultItem {
    private String id;
    private String title;
    private String subtitle;
    private String type; // INVOICE, CLIENT, EXPENSE
    private String url;

    public SearchResultItem() {}

    public SearchResultItem(String id, String title, String subtitle, String type, String url) {
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.type = type;
        this.url = url;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}

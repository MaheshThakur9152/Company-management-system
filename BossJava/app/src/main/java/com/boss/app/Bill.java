package com.boss.app;

public class Bill {
    public String id;
    public String vendor;
    public String date;
    public int amount;
    public String status;
    public boolean isPaid;

    public Bill(String id, String vendor, String date, int amount, String status, boolean isPaid) {
        this.id = id;
        this.vendor = vendor;
        this.date = date;
        this.amount = amount;
        this.status = status;
        this.isPaid = isPaid;
    }
}

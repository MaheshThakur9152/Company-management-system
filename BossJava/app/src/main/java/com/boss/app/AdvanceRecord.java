package com.boss.app;

public class AdvanceRecord {
    public String name;
    public String site;
    public int totalAdvance;
    public int recovered;
    public int pending;

    public AdvanceRecord(String name, String site, int totalAdvance, int recovered, int pending) {
        this.name = name;
        this.site = site;
        this.totalAdvance = totalAdvance;
        this.recovered = recovered;
        this.pending = pending;
    }

    public int getRecoveryPercentage() {
        if (totalAdvance == 0)
            return 0;
        return (recovered * 100) / totalAdvance;
    }
}

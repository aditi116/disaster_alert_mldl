package com.disasteralert.ml.model;

public enum ReputationEventType {
    ALERT_CONFIRMED(10),
    RESOURCE_HELPFUL(15),
    COMMENT_HELPFUL(5),
    ACCOUNT_VERIFIED(20),
    ALERT_FLAGGED_SPAM(-20),
    ABUSE_REPORT_CONFIRMED(-30),
    DUPLICATE_ALERT(-10),
    LOW_RELIABILITY(-5);

    private final int points;

    ReputationEventType(int points) {
        this.points = points;
    }

    public int getPoints() {
        return points;
    }
}

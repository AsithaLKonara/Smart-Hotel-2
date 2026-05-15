# SmartHotel OS — Predictive Analytics Model Specification

This document defines the mathematical forecasting engines, probability predictors, and operational risk metrics that drive predictive intelligence in SmartHotel OS.

---

## 1. Room Readiness Forecasting Model

To predict whether a room will be clean and ready before a guest arrives (especially VIPs), the engine calculates an **Estimated Time to Clean (ETC)**:

$$\text{ETC (Minutes)} = \text{BaseDuration}_{\text{RoomType}} \times \alpha_{\text{CleanerSkill}} \times \beta_{\text{DirtySeverity}} + \delta_{\text{InspectorDelay}}$$

### Readiness Overlap Risk:
If the calculated check-in time of an incoming reservation is less than the ETC plus current clock time:
- **State Mutation**: The room is tagged `OVERBOOKED_RISK`.
- **Dispatcher Alert**: Prompts front desk receptionists to prioritize this specific room clean sequence, or suggests a vacant alternative room upgrade.

---

## 2. Cancellation Probability Engine

The PMS calculates a guest's cancellation probability $P(\text{Cancel})$ at booking confirmation to optimize inventory allocation rates:

$$P(\text{Cancel}) = \frac{1}{1 + e^{-z}}$$

Where:
$$z = w_1 \times \text{LeadTimeDays} + w_2 \times \text{IsSpecialOffer} + w_3 \times \text{HistoricalNoShowRate} - w_4 \times \text{LoyaltyPoints}$$

### Risk Action Tiers:
- **$P(\text{Cancel}) \ge 0.75$**: Marked as high-risk. The platform may suggest slight overbookings to dynamic reservation channels.
- **$P(\text{Cancel}) \le 0.15$**: High-fidelity booking. Locked against any automatic allocation swaps.

---

## 3. Guest Complaint Risk Predictor

An operational risk engine calculates the likelihood of guest friction during check-in:

- **Input Signals**: Long queue wait times ($>10$m), unassigned rooms on arrival, previous stay complaints, or high KDS delays.
- **Auto-Mitigation**: When complaint probability exceeds $65\%$, the receptionist dashboard triggers a purple spark indicator, recommending a complimentary minibar key or early check-in discount voucher.

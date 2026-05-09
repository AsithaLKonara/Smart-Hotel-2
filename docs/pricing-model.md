# SmartHotel OS — SaaS Pricing Tiers & Billing Framework
**Document Version**: `1.0.0-billing`
**Status**: ACTIVE

This guide outlines our commercial tiers, plan-specific feature-gating parameters, failed payment retry configurations, and Stripe subscription setups.

---

## 💳 1. SaaS Pricing Tiers & Catalog

SmartHotel OS offers three highly optimized tiers suited for different hospitality operators:

| Pricing Plan | Ideal Audience | Monthly Price | Included Key Features |
| :--- | :--- | :--- | :--- |
| **Starter** | Small Guest Houses, Bed & Breakfasts | **$29 / mo** | Max 15 rooms, standard reservations, receptionist dashboards, basic reporting. |
| **Professional** | Boutique Hotels, Small Resorts | **$89 / mo** | Max 60 rooms, interactive room cards, AI cleaning allocation, Stripe payments, multi-channel guest Super App. |
| **Enterprise Lite** | Small Hotel Chains, Premium Resorts | **$249 / mo** | Unlimited rooms, multi-property oversight maps, digital twin simulators, satellite edge offline resilience. |

---

## 🔒 2. Plan-Specific Feature Gating

We enforce strict software gating at our router and middleware layers based on the registered tenant plan metadata:

```typescript
// Conceptual layout of feature gating checks in route handles:
export function verifyPlanAccess(tenantPlan: string, featureRequired: string): boolean {
  const gates: { [key: string]: string[] } = {
    STARTER: ['RESERVATIONS', 'DASHBOARD'],
    PROFESSIONAL: ['RESERVATIONS', 'DASHBOARD', 'AI_CLEANING', 'STRIPE_CHECKOUT', 'MOBILE_APP'],
    ENTERPRISE_LITE: ['RESERVATIONS', 'DASHBOARD', 'AI_CLEANING', 'STRIPE_CHECKOUT', 'MOBILE_APP', 'MULTI_PROPERTY', 'DIGITAL_TWIN', 'EDGE_RESILIENCE']
  };

  return gates[tenantPlan]?.includes(featureRequired) || false;
}
```

---

## ⚡ 3. Stripe Invoice & Failed Payment Policies
To protect operators from unexpected service interruptions:
1.  **Subscription Invoicing**: Automatically generated monthly via Stripe Billing engines.
2.  **Grace Period**: If a payment fails, the system grants a 3-day grace period. During this period, administrators are notified via email, but receptionist checkout flows remain active.
3.  **Smart Retries**: Stripe is configured to retry card charges 4 times over a 12-day window (utilizing behavioral decline analytics).
4.  **Suspension Block**: If payment is not secured within 14 days, the tenant database is frozen in read-only mode, and staff are redirected to our update-billing portal.

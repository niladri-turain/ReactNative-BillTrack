// Shapes the `subscription/current-subscription` response (or the AuthContext
// `subscription` object, which already spreads that same response) into the
// handful of fields screens actually need.
class CurrentSubscriptionModel {
  constructor(data) {
    this.planId = data?.planId ?? data?.planDetails?.id ?? null;
    this.planName = data?.planDetails?.name || '';
    this.planCode = data?.planDetails?.code || '';
    this.startDate = data?.startDate || null;
    this.endDate = data?.endDate || null;
    this.entitlements = data?.entitlements || {};
  }

  hasFeature(featureKey) {
    return !!this.entitlements?.[featureKey]?.enabled;
  }
}

const mapCurrentSubscription = data => new CurrentSubscriptionModel(data || {});

export {CurrentSubscriptionModel, mapCurrentSubscription};

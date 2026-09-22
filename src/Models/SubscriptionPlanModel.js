// Builds a single checklist of every feature that appears across all plans,
// so each plan card renders the same rows (checkmark or cross) for comparison.
const collectFeatureCatalog = (plans = []) => {
  const catalog = new Map();
  plans.forEach(plan => {
    (plan?.planFeatures || []).forEach(planFeature => {
      const feature = planFeature?.feature;
      if (feature?.id != null && !catalog.has(feature.id)) {
        catalog.set(feature.id, feature);
      }
    });
  });
  return Array.from(catalog.values()).sort((a, b) => a.id - b.id);
};

const getUnit = billingCycle => {
  switch (billingCycle) {
    case 'yearly':
      return '/ Year';
    case 'monthly':
      return '/ Month';
    case 'weekly':
      return '/ Week';
    default:
      return billingCycle ? `/ ${billingCycle}` : '';
  }
};

class SubscriptionPlanModel {
  constructor(plan, featureCatalog = []) {
    this.id = plan?.id;
    this.code = plan?.code;
    this.name = plan?.name;
    this.description = plan?.description;
    this.price = Math.round(Number(plan?.basePrice)) || 0;
    this.billingCycle = plan?.billingCycle;
    this.unit = getUnit(plan?.billingCycle);
    this.trialDays = plan?.trialDays;
    this.displayOrder = plan?.displayOrder ?? 0;

    const planFeatureByFeatureId = new Map(
      (plan?.planFeatures || []).map(planFeature => [
        planFeature?.featureId,
        planFeature,
      ]),
    );

    this.features = featureCatalog.map(feature => {
      const planFeature = planFeatureByFeatureId.get(feature.id);
      return {
        key: feature?.key,
        label: feature?.name,
        value: !!planFeature?.enabled,
      };
    });
  }
}

const mapSubscriptionPlans = (plans = []) => {
  const sortedPlans = (plans || [])
    .slice()
    .sort((a, b) => (a?.displayOrder ?? 0) - (b?.displayOrder ?? 0));
  const featureCatalog = collectFeatureCatalog(sortedPlans);
  return sortedPlans.map(plan => new SubscriptionPlanModel(plan, featureCatalog));
};

export {SubscriptionPlanModel, mapSubscriptionPlans};

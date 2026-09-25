// Shapes the `payment/create-order` response for a subscription purchase.
class SubscriptionOrderModel {
  constructor(data) {
    this.orderId = data?.order?.id ?? null;
    this.amount = data?.order?.amount ?? 0;
    this.currency = data?.order?.currency || 'INR';
    this.planId = data?.planId ?? null;
    this.reused = !!data?.reused;
  }
}

const mapSubscriptionOrder = data => new SubscriptionOrderModel(data || {});

export {SubscriptionOrderModel, mapSubscriptionOrder};

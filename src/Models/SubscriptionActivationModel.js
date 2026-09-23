// Shapes the `payment/activate-subscription` response.
class SubscriptionActivationModel {
  constructor(data) {
    this.id = data?.id ?? null;
    this.businessId = data?.businessId ?? null;
    this.plan = data?.plan ?? null;
    this.source = data?.source ?? null;
    this.planId = data?.planId ?? null;
    this.orderId = data?.orderId ?? null;
    this.paymentId = data?.paymentId ?? null;
    this.paymentSignature = data?.paymentSignature ?? null;
    this.amount = data?.amount ?? 0;
    this.startDate = data?.startDate ?? null;
    this.endDate = data?.endDate ?? null;
    this.createdAt = data?.createdAt ?? null;
    this.updatedAt = data?.updatedAt ?? null;
  }
}

const mapSubscriptionActivation = data =>
  new SubscriptionActivationModel(data || {});

export {SubscriptionActivationModel, mapSubscriptionActivation};

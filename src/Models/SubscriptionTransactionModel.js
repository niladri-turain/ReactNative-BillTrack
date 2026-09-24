// Shapes a row from `subscription/subscription` (the transaction/purchase history).
class SubscriptionTransactionModel {
  constructor(data) {
    this.id = data?.id ?? null;
    this.businessId = data?.businessId ?? null;
    this.planId = data?.planId ?? null;
    this.planName = data?.planName || data?.plan || 'N/A';
    this.source = data?.source ?? null;
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

const mapSubscriptionTransactions = (list = []) =>
  (list || []).map(item => new SubscriptionTransactionModel(item));

export {SubscriptionTransactionModel, mapSubscriptionTransactions};

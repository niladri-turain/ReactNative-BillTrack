// Shapes an invoice returned by subscription/invoices.
class SubscriptionTransactionModel {
  constructor(data) {
    this.id = data?.id ?? null;
    this.billNumber = data?.billNumber ?? '';
    this.businessId = data?.businessId ?? null;
    this.subscriptionId = data?.subscriptionId ?? null;
    this.paymentTransactionId = data?.paymentTransactionId ?? null;
    this.invoiceType = data?.invoiceType ?? '';
    this.planId = data?.planId ?? null;
    this.planVersionId = data?.planVersionId ?? null;
    this.orderId = data?.orderId ?? null;
    this.paymentId = data?.paymentId ?? null;
    this.businessName = data?.businessName ?? '';
    this.businessEmail = data?.businessEmail ?? '';
    this.businessPhone = data?.businessPhone ?? '';
    this.businessAddress = data?.businessAddress ?? '';
    this.businessPinCode = data?.businessPinCode ?? '';
    this.businessGstNumber = data?.businessGstNumber ?? null;
    this.planName = data?.planName ?? 'N/A';
    this.billingCycle = data?.billingCycle ?? '';
    this.basePrice = data?.basePrice ?? '0.00';
    this.setupCharge = data?.setupCharge ?? '0.00';
    this.printerCharge = data?.printerCharge ?? '0.00';
    this.totalAmount = data?.totalAmount ?? '0.00';
    this.gstRate = data?.gstRate ?? '0.00';
    this.taxableAmount = data?.taxableAmount ?? '0.00';
    this.cgstAmount = data?.cgstAmount ?? '0.00';
    this.sgstAmount = data?.sgstAmount ?? '0.00';
    this.igstAmount = data?.igstAmount ?? '0.00';
    this.currency = data?.currency ?? 'INR';
    this.paidAt = data?.paidAt ?? null;
    this.subscriptionStartDate = data?.subscriptionStartDate ?? null;
    this.subscriptionEndDate = data?.subscriptionEndDate ?? null;
    this.paymentStatus = data?.paymentStatus ?? '';
    this.emailSentAt = data?.emailSentAt ?? null;
    this.smsSentAt = data?.smsSentAt ?? null;
    this.createdAt = data?.createdAt ?? null;
    this.updatedAt = data?.updatedAt ?? null;
    this.emailSent = Boolean(data?.emailSent);
    this.smsSent = Boolean(data?.smsSent);
    this.downloadUrl = data?.downloadUrl ?? '';
  }
}

const mapSubscriptionTransactions = (response = {}) => {
  const items = Array.isArray(response) ? response : response?.items;
  return (items || []).map(item => new SubscriptionTransactionModel(item));
};

export {SubscriptionTransactionModel, mapSubscriptionTransactions};

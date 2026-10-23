export class BusinessUpiModel {
  constructor(data = {}) {
    this.id = Number.parseInt(data.id, 10);
    this.businessId = Number.parseInt(data.businessId, 10);
    this.upiId = data.upiId || '';
    this.label = data.label ?? null;
    this.isDefault = Boolean(data.isDefault);
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromJson(data) {
    return new BusinessUpiModel(data);
  }
}

export const mapBusinessUpiList = (items = []) =>
  (Array.isArray(items) ? items : []).map(BusinessUpiModel.fromJson);

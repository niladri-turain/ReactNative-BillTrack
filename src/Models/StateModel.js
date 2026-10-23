export class StateModel {
  constructor({id, name, code, gstCode, isUnionTerritory}) {
    this.id = Number.parseInt(id, 10);
    this.name = name;
    this.code = code;
    this.gstCode = gstCode;
    this.isUnionTerritory = isUnionTerritory;
  }

  static fromJson(json) {
    return new StateModel(json);
  }
}

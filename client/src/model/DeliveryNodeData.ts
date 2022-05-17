class DeliveryNodeData {
  static readonly STATUS = ['Online', 'Offline'];

  nodeName?: string;
  nodeStatus?: string;
  nodeAddress?: string;

  constructor(_nodeName: string, _nodeStatus: string, _nodeAddress: string) {
    this.nodeName = _nodeName;
    this.nodeStatus = _nodeStatus;
    this.nodeAddress = _nodeAddress;
  }
}

export default DeliveryNodeData;

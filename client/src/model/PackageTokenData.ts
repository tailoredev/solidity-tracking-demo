class PackageTokenData {
  tokenId?: number;
  packageContents?: string;
  packageWeight?: string;
  ownerAddress?: string;
  owner?: string;

  constructor(
    _tokenId: number,
    _packageContents: string,
    _packageWeight: string,
    _ownerAddress?: string,
    _owner?: string
  ) {
    this.tokenId = _tokenId;
    this.packageContents = _packageContents;
    this.packageWeight = _packageWeight;
    this.ownerAddress = _ownerAddress;
    this.owner = _owner;
  }
}

export default PackageTokenData;

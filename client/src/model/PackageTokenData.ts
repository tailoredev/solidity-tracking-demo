class PackageTokenData {
  tokenId?: number;
  packageContents?: string;
  packageWeight?: string;

  constructor(_tokenId: number, _packageContents: string, _packageWeight: string) {
    this.tokenId = _tokenId;
    this.packageContents = _packageContents;
    this.packageWeight = _packageWeight;
  }
}

export default PackageTokenData;

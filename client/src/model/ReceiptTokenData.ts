class ReceiptTokenData {
  tokenId?: number;
  correspondingPackageTokenId?: number;
  ownerAddress?: string;
  owner?: string;

  constructor(
    _tokenId: number,
    _correspondingPackageTokenId: number,
    _ownerAddress?: string,
    _owner?: string
  ) {
    this.tokenId = _tokenId;
    this.correspondingPackageTokenId = _correspondingPackageTokenId;
    this.ownerAddress = _ownerAddress;
    this.owner = _owner;
  }
}

export default ReceiptTokenData;

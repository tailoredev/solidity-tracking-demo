class ReceiptTokenData {
  tokenId?: number;
  correspondingPackageTokenId?: number;

  constructor(_tokenId: number, _correspondingPackageTokenId: number) {
    this.tokenId = _tokenId;
    this.correspondingPackageTokenId = _correspondingPackageTokenId;
  }
}

export default ReceiptTokenData;

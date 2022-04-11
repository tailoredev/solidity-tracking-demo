// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';

import "./PackageToken.sol";
import "./ReceiptToken.sol";

contract DeliveryNode is ERC721Holder, Ownable {

  enum NodeStatus{
    ONLINE,
    OFFILINE
  }

  string public name;
  NodeStatus public status;
  address public packageTokenAddress;
  address public receiptTokenAddress;

  // TODO - Secure the constructor such that only the deliver coordinator can call it, if that's possible?
  // This may require some sort of intermediary factory contract
  constructor(string memory _name, NodeStatus _status, address _packageTokenAddress, address _receiptTokenAddress) {
    name = _name;
    status = _status;
    packageTokenAddress = _packageTokenAddress;
    receiptTokenAddress = _receiptTokenAddress;
  }

  function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public override returns (bytes4) {
    require(status == NodeStatus.ONLINE, "Delivery node is not online");
    require(msg.sender == packageTokenAddress || msg.sender == receiptTokenAddress, "ERC721 received is not from known token address");

    if (msg.sender == receiptTokenAddress) {
      receiptTokenReceived(from, tokenId);
    }

    return super.onERC721Received(operator, from, tokenId, data);
  }

  function receiptTokenReceived(address from, uint256 receiptTokenId) internal {
    PackageToken deployedPackageTokenContract = PackageToken(packageTokenAddress);
    ReceiptToken deployedReceiptTokenContract = ReceiptToken(receiptTokenAddress);
    
    uint256 correspondingPackageTokenId = deployedReceiptTokenContract.receiptData(receiptTokenId);

    require(address(this) == deployedPackageTokenContract.ownerOf(correspondingPackageTokenId), "This delivery node does not currently hold the corresponding package token");

    deployedPackageTokenContract.safeTransferFrom(address(this), from, correspondingPackageTokenId);
    deployedReceiptTokenContract.burn(receiptTokenId);
  }

  function forwardPackage(address deliveryNodeAddress, uint256 packageTokenId) external onlyOwner {
    PackageToken deployedTokenContract = PackageToken(packageTokenAddress);
    
    deployedTokenContract.safeTransferFrom(address(this), deliveryNodeAddress, packageTokenId);
  }

  function setNodeStatus(NodeStatus _status) external onlyOwner {
    status = _status;
  }

}

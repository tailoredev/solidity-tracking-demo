// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';

import "./DeliveryNode.sol";
import "./PackageToken.sol";
import "./ReceiptToken.sol";

contract DeliveryCoordinator is ERC721Holder, Ownable {

  DeliveryNode[] public deliveryNodes;
  mapping(address => bool) private knownDeliveryNodes;

  address public packageTokenAddress;
  address public receiptTokenAddress;

  constructor(address _packageTokenAddress, address _receiptTokenAddress) {
    packageTokenAddress = _packageTokenAddress;
    receiptTokenAddress = _receiptTokenAddress;
  }

  function addDeliveryNode(string memory _nodeName) external onlyOwner {
    DeliveryNode newDeliveryNode = new DeliveryNode(_nodeName, DeliveryNode.NodeStatus.ONLINE, packageTokenAddress);
    deliveryNodes.push(newDeliveryNode);
    knownDeliveryNodes[address(newDeliveryNode)] = true;
  }

  function createPackage(string memory _packageContents, string memory _packageWeight) external returns (uint256) {
    PackageToken deployedTokenContract = PackageToken(packageTokenAddress);
    return deployedTokenContract.createPackage(msg.sender, _packageContents, _packageWeight);
  }

  function forwardPackage(address destinationNode, uint256 packageTokenId) external {
    require(knownDeliveryNodes[destinationNode] == true, "The provided destination address is not that of a known delivery node");

    PackageToken deployedTokenContract = PackageToken(packageTokenAddress);
    address currentPackageOwner = deployedTokenContract.ownerOf(packageTokenId);

    require(knownDeliveryNodes[currentPackageOwner] == true || currentPackageOwner == address(this),
      "The package token is neither held by the delivery coordinator, nor a known delivery node");

    if (knownDeliveryNodes[currentPackageOwner] == true) {
      DeliveryNode deliveryNodeContract = DeliveryNode(currentPackageOwner);
      deliveryNodeContract.forwardPackage(destinationNode, packageTokenId);
    } else if (currentPackageOwner == address(this)) {
      deployedTokenContract.safeTransferFrom(address(this), destinationNode, packageTokenId);
    }
  }

  function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public override returns (bytes4) {
      require(msg.sender == packageTokenAddress || msg.sender == receiptTokenAddress, "ERC721 received is not from known token address");

      if (msg.sender == packageTokenAddress) {
        packageTokenReceived(from, tokenId);
      }

      if (msg.sender == receiptTokenAddress) {
        receiptTokenReceived(from, tokenId);
      }

      return super.onERC721Received(operator, from, tokenId, data);
  }

  function packageTokenReceived(address from, uint256 packageTokenId) internal {
    ReceiptToken deployedTokenContract = ReceiptToken(receiptTokenAddress);
    deployedTokenContract.createReceipt(from, packageTokenId);
  }

  function receiptTokenReceived(address from, uint256 receiptTokenId) internal {
    PackageToken deployedPackageTokenContract = PackageToken(packageTokenAddress);
    ReceiptToken deployedReceiptTokenContract = ReceiptToken(receiptTokenAddress);
    
    uint256 correspondingPackageTokenId = deployedReceiptTokenContract.receiptData(receiptTokenId);
    address currentPackageOwner = deployedPackageTokenContract.ownerOf(correspondingPackageTokenId);

    require(knownDeliveryNodes[currentPackageOwner] == true, "The package token is not currently being held by a known delivery node");

    DeliveryNode packageHolder = DeliveryNode(currentPackageOwner);

    packageHolder.forwardPackage(from, correspondingPackageTokenId);
    deployedReceiptTokenContract.burn(receiptTokenId);
  }

}

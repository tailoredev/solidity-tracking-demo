// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';

import "./DeliveryNode.sol";
import "./PackageToken.sol";
import "./ReceiptToken.sol";

contract DeliveryCoordinator is ERC721Holder {

  PackageToken public packageToken;
  ReceiptToken public receiptToken;
  DeliveryNode[] public deliveryNodes; // TODO - Use only one of the two delivery node properties
  mapping(address => bool) private knownDeliveryNodes;

  constructor(address packageTokenAddress, address receiptTokenAddress) {
    packageToken = PackageToken(packageTokenAddress);
    receiptToken = ReceiptToken(receiptTokenAddress);
  }

  function addDeliveryNode(string memory _nodeName) external {
    DeliveryNode newDeliveryNode = new DeliveryNode(_nodeName, DeliveryNode.NodeStatus.ONLINE, address(packageToken));
    deliveryNodes.push(newDeliveryNode);
    knownDeliveryNodes[address(newDeliveryNode)] = true;
  }

  function numberOfDeliveryNodes() external view returns(uint256) {
    return deliveryNodes.length;
  }

  function createPackage(string memory _packageContents, string memory _packageWeight) external returns (uint256) {
    return packageToken.createPackage(msg.sender, _packageContents, _packageWeight);
  }

  function forwardPackage(address destinationNode, uint256 packageTokenId) external {
    require(knownDeliveryNodes[destinationNode] == true, "The provided destination address is not that of a known delivery node");

    address currentPackageOwner = packageToken.ownerOf(packageTokenId);

    require(knownDeliveryNodes[currentPackageOwner] == true || currentPackageOwner == address(this),
      "The package token is neither held by the delivery coordinator, nor a known delivery node");

    if (knownDeliveryNodes[currentPackageOwner] == true) {
      DeliveryNode deliveryNodeContract = DeliveryNode(currentPackageOwner);
      deliveryNodeContract.forwardPackage(destinationNode, packageTokenId);
    } else if (currentPackageOwner == address(this)) {
      packageToken.safeTransferFrom(address(this), destinationNode, packageTokenId);
    }
  }

  function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public override returns (bytes4) {
      require(msg.sender == address(packageToken) || msg.sender == address(receiptToken), "ERC721 received is not from known token address");

      if (msg.sender == address(packageToken)) {
        address recipient = from;

        if (data.length > 0) {
          recipient = bytesToAddress(data);
        }

        packageTokenReceived(recipient, tokenId);
      }

      if (msg.sender == address(receiptToken)) {
        receiptTokenReceived(from, tokenId);
      }

      return super.onERC721Received(operator, from, tokenId, data);
  }

  function bytesToAddress(bytes memory _bytes) internal pure returns (address addr) {
    require(_bytes.length == 20, "Data provided is not the required address length of 20 bytes");

    assembly {
        addr := mload(add(_bytes, 20))
    } 
  }

  function packageTokenReceived(address recipient, uint256 packageTokenId) internal {
    receiptToken.createReceipt(recipient, packageTokenId);
  }

  function receiptTokenReceived(address from, uint256 receiptTokenId) internal {    
    uint256 correspondingPackageTokenId = receiptToken.receiptData(receiptTokenId);
    address currentPackageOwner = packageToken.ownerOf(correspondingPackageTokenId);

    require(knownDeliveryNodes[currentPackageOwner] == true, "The package token is not currently being held by a known delivery node");

    DeliveryNode packageHolder = DeliveryNode(currentPackageOwner);

    packageHolder.forwardPackage(from, correspondingPackageTokenId);
    receiptToken.burn(receiptTokenId);
  }

}

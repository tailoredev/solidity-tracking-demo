// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';

import "./DeliveryNode.sol";
import "./PackageToken.sol";
import "./ReceiptToken.sol";

contract DeliveryCoordinator is ERC721Holder, Ownable {

  DeliveryNode[] public deliveryNodes;
  address public packageTokenAddress;
  address public receiptTokenAddress;

  constructor(address _packageTokenAddress, address _receiptTokenAddress) {
    packageTokenAddress = _packageTokenAddress;
    receiptTokenAddress = _receiptTokenAddress;
  }

  function addDeliveryNode(string memory _nodeName) public onlyOwner {
    deliveryNodes.push(new DeliveryNode(_nodeName, DeliveryNode.NodeStatus.ONLINE));
  }

  function createPackage(string memory _packageContents, string memory _packageWeight) public {
    PackageToken deployedTokenContract = PackageToken(packageTokenAddress);
    deployedTokenContract.createPackage(msg.sender, _packageContents, _packageWeight);
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

  function receiptTokenReceived(address, uint256) pure internal {
    require(false, "Receiving receipt tokens is not yet implemented");
  }

}

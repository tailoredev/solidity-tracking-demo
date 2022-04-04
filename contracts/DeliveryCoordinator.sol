// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

import "./DeliveryNode.sol";
import "./PackageToken.sol";
import "./ReceiptToken.sol";

contract DeliveryCoordinator is Ownable {

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

}

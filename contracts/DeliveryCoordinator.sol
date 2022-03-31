// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';

import "./DeliveryNode.sol";

contract DeliveryCoordinator is Ownable {

  DeliveryNode[] public deliveryNodes;

  function addDeliveryNode(string memory _nodeName) public onlyOwner {
    deliveryNodes.push(new DeliveryNode(_nodeName, DeliveryNode.NodeStatus.ONLINE));
  }

}

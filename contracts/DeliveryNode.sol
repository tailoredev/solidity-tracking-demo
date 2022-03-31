// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DeliveryNode {

  enum NodeStatus{
    ONLINE,
    OFFILINE
  }

  string public name;
  NodeStatus public status;

  constructor(string memory _name, NodeStatus _status) {
    name = _name;
    status = _status;
  }

}

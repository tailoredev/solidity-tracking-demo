// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';

import "./PackageToken.sol";
import "./ReceiptToken.sol";

contract DeliveryNode is ERC721Holder, Ownable {

  enum NodeStatus{
    ONLINE,
    OFFLINE
  }

  string public name;
  NodeStatus public status;
  address public packageTokenAddress;

  constructor(string memory _name, NodeStatus _status, address _packageTokenAddress) {
    name = _name;
    status = _status;
    packageTokenAddress = _packageTokenAddress;
  }

  function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public override returns (bytes4) {
    require(status == NodeStatus.ONLINE, "Delivery node is offline");
    require(msg.sender == packageTokenAddress, "ERC721 received is not from known token address");

    return super.onERC721Received(operator, from, tokenId, data);
  }

  function forwardPackage(address recipientAddress, uint256 packageTokenId) external onlyOwner {
    PackageToken deployedTokenContract = PackageToken(packageTokenAddress);
    
    deployedTokenContract.safeTransferFrom(address(this), recipientAddress, packageTokenId);
  }

  function setNodeStatus(NodeStatus _status) external onlyOwner {
    status = _status;
  }

}

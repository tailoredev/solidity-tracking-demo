// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract ReceiptToken is ERC721Burnable, Ownable {
    
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    mapping(uint256 => uint256) public receiptData;

    constructor() ERC721("ReceiptToken", "RPT") {}

    function createReceipt(address packageSender, uint256 packageTokenId) external onlyOwner returns (uint256) {
        _tokenIds.increment();
        
        uint256 newReceiptId = _tokenIds.current();
        _safeMint(packageSender, newReceiptId);
        receiptData[newReceiptId] = packageTokenId;

        return newReceiptId;
    }

}

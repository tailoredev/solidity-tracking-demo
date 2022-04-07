// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract ReceiptToken is ERC721Burnable {
    
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    mapping(uint256 => uint256) public receiptData;

    constructor() ERC721("ReceiptToken", "RPT") {}

    function createReceipt(address packageSender, uint256 packageTokenId) public returns (uint256) {
        // TODO - assert that the sender owns the package in question or restrict access to this method to the delivery coordinator only
        _tokenIds.increment();
        
        uint256 newReceiptId = _tokenIds.current();
        _safeMint(packageSender, newReceiptId);
        receiptData[newReceiptId] = packageTokenId;

        return newReceiptId;
    }

}

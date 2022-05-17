// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract ReceiptToken is ERC721Enumerable, Ownable {
    
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

    // Taken from ERC721Burnable
    function burn(uint256 tokenId) public virtual {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721Burnable: caller is not owner nor approved");
        _burn(tokenId);
    }

}

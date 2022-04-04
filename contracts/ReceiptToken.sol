// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';

contract ReceiptToken is ERC721Burnable {
  
    constructor() ERC721("ReceiptToken", "RPT") {}

}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract PackageToken is ERC721 {

    using Counters for Counters.Counter;

    struct PackageInfo {
        string packageContents;
        string packageWeight;
    }

    Counters.Counter private _tokenIds;

    mapping(uint256 => PackageInfo) public packageData;
  
    constructor() ERC721("PackageToken", "PKG") {}

    function createPackage(address packageSender, string memory packageContents, string memory packageWeight) public returns (uint256) {
        _tokenIds.increment();
        
        uint256 newPackageId = _tokenIds.current();
        _safeMint(packageSender, newPackageId);
        packageData[newPackageId] = PackageInfo(packageContents, packageWeight);

        return newPackageId;
    }

}

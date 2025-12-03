// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CareerPassportNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => string) private _tokenNames;
    mapping(uint256 => string) private _tokenRarities;
    mapping(uint256 => string[]) private _tokenOrganizations;

    constructor() ERC721("CareerPassportNFT", "CPNFT") Ownable(msg.sender) {}

    function mint(
        address to,
        string memory tokenURI,
        string memory name,
        string memory rarity,
        string[] memory organizations
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = tokenURI;
        _tokenNames[tokenId] = name;
        _tokenRarities[tokenId] = rarity;
        _tokenOrganizations[tokenId] = organizations;
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function getTokenName(uint256 tokenId) public view returns (string memory) {
        return _tokenNames[tokenId];
    }

    function getTokenRarity(uint256 tokenId) public view returns (string memory) {
        return _tokenRarities[tokenId];
    }

    function getTokenOrganizations(uint256 tokenId) public view returns (string[] memory) {
        return _tokenOrganizations[tokenId];
    }

    // 譲渡を禁止（キャリア証明書は譲渡不可）
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        require(to == ownerOf(tokenId) || to == address(0), "Transfer not allowed");
        return super._update(to, tokenId, auth);
    }

    function getTotalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}


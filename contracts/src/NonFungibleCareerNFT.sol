// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NonFungibleCareerNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;                    // トークンIDカウンター（発行時にインクリメント）
    mapping(uint256 => string) private _tokenUrIs;     // メタデータURI（IPFSやHTTP URL）
    mapping(uint256 => string) private _tokenNames;     // トークン名
    mapping(uint256 => string) private _tokenRarities;  // レアリティ（例: "Common", "Rare", "Epic"）
    mapping(uint256 => string[]) private _tokenOrganizations; // 関連組織の配列

    constructor() ERC721("NonFungibleCareerNFT", "NFCNFT") Ownable(msg.sender) {}
    // NFTの名前とシンボルを設定し、デプロイしたアドレスを所有者に設定

    // NFT発行（所有者のみ実行可能）
    function mint(
        address to,
        string memory uri,  // tokenURI関数と名前が被らないようにuriに変更
        string memory name,
        string memory rarity,
        string[] memory organizations
    ) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);  // コントラクトアドレスへの送信時はERC721Receiverをチェック
        _tokenUrIs[tokenId] = uri;
        _tokenNames[tokenId] = name;
        _tokenRarities[tokenId] = rarity;
        _tokenOrganizations[tokenId] = organizations;
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // ERC721標準のtokenURI関数をオーバーライド
        return _tokenUrIs[tokenId];
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
    // 所有者への返却（to == ownerOf(tokenId)）とバーン（to == address(0)）のみ許可
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);  // 内部関数を使用（トークンが存在しない場合はaddress(0)を返す）
        // mint時（from == address(0)）は許可、バーン時（to == address(0)）も許可
        // それ以外の場合は、現在の所有者への返却のみ許可
        require(from == address(0) || to == address(0) || to == from, "Transfer not allowed");
        return super._update(to, tokenId, auth);  // 親クラスの_updateを呼び出して実際の更新処理を実行
    }

    function getTotalSupply() public view returns (uint256) {
        return _tokenIdCounter;  // カウンターの現在値が発行済みNFTの総数
    }
}


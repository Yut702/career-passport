// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CareerStampSFT
 * @dev キャリアスタンプをSFT（Semi-Fungible Token、ERC1155）として実装
 * 
 * スタンプは企業とカテゴリの組み合わせで識別され、同じタイプのスタンプは複数枚持つことができます。
 * 各スタンプタイプは異なるtokenIdとして管理されます。
 */
contract CareerStampSFT is ERC1155, Ownable {
    using Strings for uint256;

    // スタンプメタデータ
    struct StampMetadata {
        string name;          // スタンプ名
        string organization;  // 発行組織
        string category;      // カテゴリ
        uint256 createdAt;    // 作成日時
    }

    // tokenId => スタンプメタデータ
    mapping(uint256 => StampMetadata) public stampMetadata;
    
    // 組織名とカテゴリの組み合わせ => tokenId
    mapping(string => mapping(string => uint256)) public orgCategoryToTokenId;
    
    // 次のtokenId
    uint256 private _nextTokenId = 1;

    // 組織別スタンプ数のカウント（ユーザーアドレス => 組織名 => スタンプ数）
    mapping(address => mapping(string => uint256)) public organizationStampCount;

    event StampMinted(
        address indexed to,
        uint256 indexed tokenId,
        string name,
        string organization,
        string category,
        uint256 amount
    );

    constructor() ERC1155("") Ownable(msg.sender) {
        // ベースURIは空文字列（各tokenIdごとに個別のURIを設定可能）
    }

    /**
     * @dev スタンプを発行（所有者または許可されたminterのみ実行可能）
     * @param to 受け取るユーザーのアドレス
     * @param name スタンプ名
     * @param organization 発行組織
     * @param category カテゴリ
     * @param amount 発行数量（通常は1）
     * @return tokenId 発行されたスタンプのtokenId
     */
    function mintStamp(
        address to,
        string memory name,
        string memory organization,
        string memory category,
        uint256 amount
    ) public onlyOwner returns (uint256) {
        // 既存のtokenIdを確認、なければ新規作成
        uint256 tokenId = orgCategoryToTokenId[organization][category];
        
        if (tokenId == 0) {
            // 新しいスタンプタイプを作成
            tokenId = _nextTokenId++;
            orgCategoryToTokenId[organization][category] = tokenId;
            
            stampMetadata[tokenId] = StampMetadata({
                name: name,
                organization: organization,
                category: category,
                createdAt: block.timestamp
            });
        }

        // SFTをmint
        _mint(to, tokenId, amount, "");

        // 組織別スタンプ数を更新
        organizationStampCount[to][organization] += amount;

        emit StampMinted(to, tokenId, name, organization, category, amount);
        
        return tokenId;
    }

    /**
     * @dev スタンプのメタデータを取得
     * @param tokenId トークンID
     * @return metadata スタンプメタデータ
     */
    function getStampMetadata(uint256 tokenId) public view returns (StampMetadata memory) {
        return stampMetadata[tokenId];
    }

    /**
     * @dev 組織とカテゴリからtokenIdを取得
     * @param organization 組織名
     * @param category カテゴリ
     * @return tokenId トークンID（存在しない場合は0）
     */
    function getTokenIdByOrgCategory(string memory organization, string memory category) 
        public 
        view 
        returns (uint256) 
    {
        return orgCategoryToTokenId[organization][category];
    }

    /**
     * @dev ユーザーの組織別スタンプ数を取得
     * @param user ユーザーアドレス
     * @param organization 組織名
     * @return count スタンプ数
     */
    function getOrganizationStampCount(address user, string memory organization) 
        public 
        view 
        returns (uint256) 
    {
        return organizationStampCount[user][organization];
    }

    /**
     * @dev ユーザーが所有するスタンプのtokenIdリストを取得
     * @param user ユーザーアドレス
     * @return tokenIds 所有しているtokenIdの配列
     * @return amounts 各tokenIdの数量
     */
    function getUserStamps(address user) 
        public 
        view 
        returns (uint256[] memory tokenIds, uint256[] memory amounts) 
    {
        // 注意: この実装は全tokenIdを走査するため、gas効率が悪い
        // 本番環境では、イベントログから取得するか、別のマッピングを使用することを推奨
        uint256[] memory tempTokenIds = new uint256[](_nextTokenId);
        uint256[] memory tempAmounts = new uint256[](_nextTokenId);
        uint256 count = 0;

        for (uint256 i = 1; i < _nextTokenId; i++) {
            uint256 balance = balanceOf(user, i);
            if (balance > 0) {
                tempTokenIds[count] = i;
                tempAmounts[count] = balance;
                count++;
            }
        }

        // 実際のサイズに合わせて配列をリサイズ
        tokenIds = new uint256[](count);
        amounts = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = tempTokenIds[i];
            amounts[i] = tempAmounts[i];
        }
    }

    /**
     * @dev tokenURIをオーバーライド（メタデータURIを返す）
     * @param tokenId トークンID
     * @return uri メタデータURI
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        // 簡易的なURI生成（実際の実装ではIPFS URIなどを返す）
        // メタデータは必要に応じてtokenIdから取得可能
        return string(abi.encodePacked(
            "https://api.career-passport.com/stamps/",
            tokenId.toString(),
            ".json"
        ));
    }

    /**
     * @dev 譲渡を制限（スタンプは譲渡不可、バーンは許可）
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override {
        // バーン（to == address(0)）は許可
        if (to == address(0)) {
            super._update(from, to, ids, values);
            // 組織別スタンプ数を更新
            for (uint256 i = 0; i < ids.length; i++) {
                StampMetadata memory metadata = stampMetadata[ids[i]];
                if (from != address(0) && bytes(metadata.organization).length > 0) {
                    organizationStampCount[from][metadata.organization] -= values[i];
                }
            }
            return;
        }

        // その他の譲渡は禁止
        require(from == address(0), "Transfer not allowed");
        super._update(from, to, ids, values);
    }
}


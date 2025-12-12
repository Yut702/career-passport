// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CareerStampSFT} from "./CareerStampSFT.sol";
import {NonFungibleCareerNFT} from "./NonFungibleCareerNFT.sol";

struct MintRule {
    uint256 id;                    // ルールID
    string rarity;                 // レアリティ名（例: "Common", "Rare", "Epic", "Legendary"）
    uint256 requiredOrganizations; // 必要な企業数
    uint256 stampsPerOrg;          // 企業あたりのスタンプ数
    bool isActive;                 // 有効かどうか
}

/**
 * @title StampManager
 * @dev スタンプ管理コントラクト（SFTベース）
 * 
 * CareerStampSFTコントラクトを使用してスタンプを発行・管理します。
 * スタンプはSFT（ERC1155）として実装され、証明書はNFT（ERC721）として実装されます。
 */
contract StampManager {
    CareerStampSFT public stampSFT;  // SFTコントラクトへの参照
    NonFungibleCareerNFT public nftContract;  // NFTコントラクトへの参照
    address public owner;

    // ルールベースシステム
    mapping(uint256 => MintRule) public mintRules;  // ルールID => ルール情報
    uint256 public nextRuleId = 1;                 // 次のルールID

    // 企業発行権限管理（将来の拡張用、現在は使用しない）
    mapping(address => bool) public authorizedIssuers;  // 発行権限を持つアドレス
    mapping(address => string) public issuerOrganization;  // 発行者アドレス => 組織名
    
    // プラットフォーム参加企業NFTコントラクト（将来の実装用、現在はモック）
    // address public platformNFTContract;  // 将来実装時に使用

    event StampIssued(address indexed user, string name, string organization, uint256 timestamp, uint256 tokenId);
    // indexedによりイベントログで検索可能
    
    event MintRuleAdded(uint256 indexed ruleId, string rarity, uint256 requiredOrganizations, uint256 stampsPerOrg);
    event MintRuleUpdated(uint256 indexed ruleId, bool isActive);
    event NFTMinted(address indexed to, uint256 indexed tokenId, string name, string organization);
    event AuthorizedIssuerAdded(address indexed issuer, string organization);
    event AuthorizedIssuerRemoved(address indexed issuer);

    constructor(address _stampSFTAddress) {
        owner = msg.sender;  // デプロイしたアドレスを所有者に設定
        stampSFT = CareerStampSFT(_stampSFTAddress);  // SFTコントラクトのアドレスを設定
        
        // デフォルトルールを追加（既存の動作を維持）
        // ルールID 1: 1企業から3スタンプ = Common
        _addMintRuleInternal("Common", 1, 3);
    }

    /**
     * @dev SFTコントラクトのアドレスを更新（所有者のみ）
     */
    function setStampSFT(address _stampSFTAddress) public onlyOwner {
        stampSFT = CareerStampSFT(_stampSFTAddress);
    }

    /**
     * @dev NFTコントラクトのアドレスを設定（所有者のみ）
     */
    function setNFTContract(address _nftContractAddress) public onlyOwner {
        nftContract = NonFungibleCareerNFT(_nftContractAddress);
    }

    /**
     * @dev プラットフォーム参加企業NFTを所有しているかチェック（PoC: モック実装）
     * @param issuer チェックするアドレス
     * @return 参加企業NFTを所有しているかどうか（現在は常にtrue）
     */
    function hasPlatformNFT(address issuer) public pure returns (bool) {
        // PoCのため、すべてのアドレスが参加企業NFTを持っているとみなす
        // 将来の実装: platformNFTContract.balanceOf(issuer) > 0
        return true;
    }

    /**
     * @dev NFT証明書を発行（所有者または参加企業NFT所有者が実行可能、条件チェック付き）
     * @param to 受け取るユーザーのアドレス
     * @param uri メタデータURI
     * @param name NFT名
     * @param rarity レアリティ
     * @param organization 組織名
     * @return tokenId 発行されたNFTのtokenId
     */
    function mintNFT(
        address to,
        string memory uri,
        string memory name,
        string memory rarity,
        string memory organization
    ) public returns (uint256) {
        // 所有者または参加企業NFT所有者のみが実行可能
        require(
            msg.sender == owner || hasPlatformNFT(msg.sender),
            "Not authorized: must be owner or have platform NFT"
        );

        // 発行条件をチェック（3枚以上のスタンプが必要）
        require(
            canMintNft(to, organization),
            "User does not have enough stamps to mint NFT"
        );

        // NFTコントラクトが設定されているか確認
        require(
            address(nftContract) != address(0),
            "NFT contract not set"
        );

        // NFTを発行
        string[] memory organizations = new string[](1);
        organizations[0] = organization;
        uint256 tokenId = nftContract.mint(to, uri, name, rarity, organizations);

        emit NFTMinted(to, tokenId, name, organization);
        return tokenId;
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;  // 元の関数のコードを実行する位置
    }

    function _onlyOwner() internal view {
        require(msg.sender == owner, "Not owner");
    }

    /**
     * @dev 企業アドレスを発行権限付きで登録（所有者のみ）
     * @param issuer 発行権限を付与する企業アドレス
     * @param organization 企業の組織名
     */
    function addAuthorizedIssuer(address issuer, string memory organization) public onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        authorizedIssuers[issuer] = true;
        issuerOrganization[issuer] = organization;
        emit AuthorizedIssuerAdded(issuer, organization);
    }

    /**
     * @dev 企業アドレスの発行権限を削除（所有者のみ）
     * @param issuer 発行権限を削除する企業アドレス
     */
    function removeAuthorizedIssuer(address issuer) public onlyOwner {
        require(authorizedIssuers[issuer], "Issuer not authorized");
        authorizedIssuers[issuer] = false;
        delete issuerOrganization[issuer];
        emit AuthorizedIssuerRemoved(issuer);
    }

    /**
     * @dev スタンプを発行（所有者または認証された発行者が実行可能）
     * SFTコントラクトを使用してスタンプをmintします。
     * 
     * @param user 受け取るユーザーのアドレス
     * @param name スタンプ名
     * @param organization 発行組織
     * @param category カテゴリ
     * @param amount 発行数量（通常は1）
     * @return tokenId 発行されたスタンプのtokenId
     */
    function issueStamp(
        address user,
        string memory name,
        string memory organization,
        string memory category,
        uint256 amount
    ) public returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        
        // 所有者または参加企業NFT所有者のみが実行可能
        require(
            msg.sender == owner || hasPlatformNFT(msg.sender),
            "Not authorized: must be owner or have platform NFT"
        );
        
        // SFTコントラクトを使用してスタンプをmint
        uint256 tokenId = stampSFT.mintStamp(user, name, organization, category, amount);
        
        emit StampIssued(user, name, organization, block.timestamp, tokenId);
        
        return tokenId;
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
        return stampSFT.getUserStamps(user);
    }

    /**
     * @dev スタンプのメタデータを取得（SFTコントラクト経由）
     * @param tokenId トークンID
     * @return metadata スタンプメタデータ
     */
    function getStampMetadata(uint256 tokenId) 
        public 
        view 
        returns (CareerStampSFT.StampMetadata memory) 
    {
        return stampSFT.getStampMetadata(tokenId);
    }

    /**
     * @dev 組織別スタンプ数を取得
     * @param user ユーザーアドレス
     * @param org 組織名
     * @return count スタンプ数
     */
    function getOrganizationStampCount(address user, string memory org) 
        public 
        view 
        returns (uint256) 
    {
        return stampSFT.getOrganizationStampCount(user, org);
    }

    /**
     * @dev カテゴリ別スタンプ数を取得
     * @param user ユーザーアドレス
     * @param category カテゴリ
     * @return count スタンプ数
     */
    function getCategoryStampCount(address user, string memory category) 
        public 
        view 
        returns (uint256) 
    {
        // SFTからカテゴリ別のスタンプ数を計算
        (uint256[] memory tokenIds, uint256[] memory amounts) = stampSFT.getUserStamps(user);
        uint256 count = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            CareerStampSFT.StampMetadata memory metadata = stampSFT.getStampMetadata(tokenIds[i]);
            if (keccak256(bytes(metadata.category)) == keccak256(bytes(category))) {
                count += amounts[i];
            }
        }
        
        return count;
    }

    /**
     * @dev 同一組織から3つ以上のスタンプがあればNFT発行可能
     * @param user ユーザーアドレス
     * @param organization 組織名
     * @return 発行可能かどうか
     */
    function canMintNft(address user, string memory organization) public view returns (bool) {
        return stampSFT.getOrganizationStampCount(user, organization) >= 3;
    }

    /**
     * @dev ユーザーの総スタンプ数を取得
     * @param user ユーザーアドレス
     * @return count 総スタンプ数
     */
    function getUserStampCount(address user) public view returns (uint256) {
        (uint256[] memory tokenIds, uint256[] memory amounts) = stampSFT.getUserStamps(user);
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        return total;
    }

    // ========== ルールベースシステム ==========

    /**
     * @dev 新しいNFT発行ルールを追加（所有者のみ）
     * @param rarity レアリティ名（例: "Rare", "Epic", "Legendary"）
     * @param requiredOrganizations 必要な企業数
     * @param stampsPerOrg 企業あたりのスタンプ数
     * @return ruleId 追加されたルールのID
     */
    function addMintRule(
        string memory rarity,
        uint256 requiredOrganizations,
        uint256 stampsPerOrg
    ) public onlyOwner returns (uint256) {
        require(requiredOrganizations > 0, "Required organizations must be > 0");
        require(stampsPerOrg > 0, "Stamps per org must be > 0");
        return _addMintRuleInternal(rarity, requiredOrganizations, stampsPerOrg);
    }

    /**
     * @dev 内部関数：ルールを追加
     */
    function _addMintRuleInternal(
        string memory rarity,
        uint256 requiredOrganizations,
        uint256 stampsPerOrg
    ) internal returns (uint256) {
        uint256 ruleId = nextRuleId++;
        mintRules[ruleId] = MintRule({
            id: ruleId,
            rarity: rarity,
            requiredOrganizations: requiredOrganizations,
            stampsPerOrg: stampsPerOrg,
            isActive: true
        });
        emit MintRuleAdded(ruleId, rarity, requiredOrganizations, stampsPerOrg);
        return ruleId;
    }

    /**
     * @dev ルールの有効/無効を切り替え（所有者のみ）
     */
    function setRuleActive(uint256 ruleId, bool isActive) public onlyOwner {
        require(mintRules[ruleId].id != 0, "Rule does not exist");
        mintRules[ruleId].isActive = isActive;
        emit MintRuleUpdated(ruleId, isActive);
    }

    /**
     * @dev ユーザーが特定のルールを満たしているかチェック
     * @param user チェックするユーザーのアドレス
     * @param ruleId ルールID
     * @return ルールを満たしているかどうか
     */
    function canMintWithRule(address user, uint256 ruleId) public view returns (bool) {
        MintRule memory rule = mintRules[ruleId];
        require(rule.id != 0, "Rule does not exist");
        require(rule.isActive, "Rule is not active");
        
        // ユーザーのスタンプを取得（SFTから）
        (uint256[] memory tokenIds,) = getUserStamps(user);
        if (tokenIds.length == 0) {
            return false;
        }
        
        // 組織ごとのスタンプ数をカウント
        // 効率化のため、既にチェックした組織を記録
        string[] memory checkedOrgs = new string[](tokenIds.length);
        uint256 checkedCount = 0;
        uint256 qualifiedOrgs = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            CareerStampSFT.StampMetadata memory metadata = stampSFT.getStampMetadata(tokenIds[i]);
            string memory org = metadata.organization;
            
            // 既にチェックした組織かどうか確認
            bool alreadyChecked = false;
            for (uint256 j = 0; j < checkedCount; j++) {
                if (keccak256(bytes(checkedOrgs[j])) == keccak256(bytes(org))) {
                    alreadyChecked = true;
                    break;
                }
            }
            
            if (!alreadyChecked) {
                // この組織のスタンプ数を取得（SFTから）
                uint256 orgCount = stampSFT.getOrganizationStampCount(user, org);
                if (orgCount >= rule.stampsPerOrg) {
                    qualifiedOrgs++;
                }
                checkedOrgs[checkedCount] = org;
                checkedCount++;
            }
        }
        
        return qualifiedOrgs >= rule.requiredOrganizations;
    }

    /**
     * @dev ユーザーが満たせるルールのIDリストを取得
     * @param user チェックするユーザーのアドレス
     * @return ruleIds 満たせるルールIDの配列
     */
    function getAvailableRules(address user) public view returns (uint256[] memory) {
        // 最大でnextRuleId個のルールがある可能性があるため、動的配列を使用
        uint256[] memory temp = new uint256[](nextRuleId);
        uint256 count = 0;
        
        // 全ルールをチェック
        for (uint256 i = 1; i < nextRuleId; i++) {
            if (mintRules[i].isActive && canMintWithRule(user, i)) {
                temp[count] = i;
                count++;
            }
        }
        
        // 実際のサイズに合わせて配列をリサイズ
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }

    /**
     * @dev ルール情報を取得
     * @param ruleId ルールID
     * @return rule ルール情報
     */
    function getRule(uint256 ruleId) public view returns (MintRule memory) {
        require(mintRules[ruleId].id != 0, "Rule does not exist");
        return mintRules[ruleId];
    }
    
    /**
     * @dev MintRule構造体を取得（外部アクセス用）
     */
    function getMintRule(uint256 ruleId) public view returns (MintRule memory) {
        return getRule(ruleId);
    }

    /**
     * @dev 全ルールIDを取得
     * @return ruleIds 全ルールIDの配列
     */
    function getAllRuleIds() public view returns (uint256[] memory) {
        uint256[] memory ruleIds = new uint256[](nextRuleId - 1);
        for (uint256 i = 1; i < nextRuleId; i++) {
            ruleIds[i - 1] = i;
        }
        return ruleIds;
    }
}


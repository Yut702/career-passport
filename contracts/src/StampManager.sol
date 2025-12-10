// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct Stamp {
    uint256 id;           // スタンプID（タイムスタンプ）
    string name;          // スタンプ名
    string organization;  // 発行組織
    string category;      // カテゴリ
    uint256 issuedAt;     // 発行日時
}

struct MintRule {
    uint256 id;                    // ルールID
    string rarity;                 // レアリティ名（例: "Common", "Rare", "Epic", "Legendary"）
    uint256 requiredOrganizations; // 必要な企業数
    uint256 stampsPerOrg;          // 企業あたりのスタンプ数
    bool isActive;                 // 有効かどうか
}

contract StampManager {
    mapping(address => Stamp[]) private userStamps;  // ユーザーごとのスタンプリスト
    mapping(address => mapping(string => uint256)) private organizationStampCount;  // 組織別スタンプ数
    mapping(address => mapping(string => uint256)) private categoryStampCount;      // カテゴリ別スタンプ数
    address public owner;

    // ルールベースシステム
    mapping(uint256 => MintRule) public mintRules;  // ルールID => ルール情報
    uint256 public nextRuleId = 1;                 // 次のルールID

    event StampIssued(address indexed user, string name, string organization, uint256 timestamp);
    // indexedによりイベントログで検索可能
    
    event MintRuleAdded(uint256 indexed ruleId, string rarity, uint256 requiredOrganizations, uint256 stampsPerOrg);
    event MintRuleUpdated(uint256 indexed ruleId, bool isActive);

    constructor() {
        owner = msg.sender;  // デプロイしたアドレスを所有者に設定
        
        // デフォルトルールを追加（既存の動作を維持）
        // ルールID 1: 1企業から3スタンプ = Common
        _addMintRuleInternal("Common", 1, 3);
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;  // 元の関数のコードを実行する位置
    }

    function _onlyOwner() internal view {
        require(msg.sender == owner, "Not owner");
    }

    // スタンプ発行（所有者のみ実行可能）
    function issueStamp(
        address user,
        string memory name,
        string memory organization,
        string memory category
    ) public onlyOwner {
        Stamp memory newStamp = Stamp({
            id: block.timestamp,  // 現在のブロックタイムスタンプをIDとして使用
            name: name,
            organization: organization,
            category: category,
            issuedAt: block.timestamp
        });
        userStamps[user].push(newStamp);
        organizationStampCount[user][organization]++;  // 組織別スタンプ数をインクリメント
        categoryStampCount[user][category]++;          // カテゴリ別スタンプ数をインクリメント
        emit StampIssued(user, name, organization, block.timestamp);
    }

    function getUserStamps(address user) public view returns (Stamp[] memory) {
        return userStamps[user];
    }

    function getOrganizationStampCount(address user, string memory org) public view returns (uint256) {
        return organizationStampCount[user][org];
    }

    function getCategoryStampCount(address user, string memory category) public view returns (uint256) {
        return categoryStampCount[user][category];
    }

    // 同一組織から3つ以上のスタンプがあればNFT発行可能
    function canMintNft(address user, string memory organization) public view returns (bool) {
        return organizationStampCount[user][organization] >= 3;
    }

    function getUserStampCount(address user) public view returns (uint256) {
        return userStamps[user].length;  // スタンプ配列の長さが総数
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
        
        // ユーザーのスタンプを取得
        Stamp[] memory stamps = getUserStamps(user);
        if (stamps.length == 0) {
            return false;
        }
        
        // 組織ごとのスタンプ数をカウント
        // 注意: Solidityでは動的配列のmappingが使えないため、別の方法を使用
        // ここでは既存のorganizationStampCountを活用
        
        // 条件を満たす組織数をカウント
        uint256 qualifiedOrgs = 0;
        
        // ユーザーの全スタンプを走査して、条件を満たす組織をカウント
        // 効率化のため、既にチェックした組織を記録
        string[] memory checkedOrgs = new string[](stamps.length);
        uint256 checkedCount = 0;
        
        for (uint256 i = 0; i < stamps.length; i++) {
            string memory org = stamps[i].organization;
            
            // 既にチェックした組織かどうか確認
            bool alreadyChecked = false;
            for (uint256 j = 0; j < checkedCount; j++) {
                if (keccak256(bytes(checkedOrgs[j])) == keccak256(bytes(org))) {
                    alreadyChecked = true;
                    break;
                }
            }
            
            if (!alreadyChecked) {
                // この組織のスタンプ数を取得
                uint256 orgCount = organizationStampCount[user][org];
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


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {StampManager, MintRule} from "../src/StampManager.sol";
import {CareerStampSFT} from "../src/CareerStampSFT.sol";

contract StampManagerTest is Test {
    // Testを継承してテストコントラクトを作成
    StampManager public stampManager;
    CareerStampSFT public stampSft;
    address public owner;
    address public user;

    function setUp() public {
        // 各テストの前に実行されるセットアップ関数
        owner = address(this);  // テストコントラクト自体が所有者になる
        user = address(0x1);    // テスト用のユーザーアドレス
        
        // SFTコントラクトをデプロイ
        stampSft = new CareerStampSFT();
        
        // StampManagerコントラクトをデプロイ（SFTコントラクトのアドレスを渡す）
        stampManager = new StampManager(address(stampSft));
        
        // StampManagerをSFTコントラクトの所有者に設定
        // 注意: 実際の実装では、StampManagerがSFTをmintできるようにする必要があります
    }

    function test_IssueStamp() public {
        // スタンプ発行の基本テスト
        string memory name = unicode"優秀な成績";
        string memory organization = unicode"東京大学";
        string memory category = unicode"学業";

        // スタンプを発行（amount=1）
        uint256 tokenId = stampManager.issueStamp(user, name, organization, category, 1);

        // ユーザーのスタンプリストを取得（SFTベース）
        (uint256[] memory tokenIds, uint256[] memory amounts) = stampManager.getUserStamps(user);
        
        // スタンプが1つ発行されていることを確認
        assertEq(tokenIds.length, 1);
        assertEq(tokenIds[0], tokenId);
        assertEq(amounts[0], 1);
        
        // スタンプのメタデータを取得
        CareerStampSFT.StampMetadata memory metadata = stampSft.getStampMetadata(tokenId);
        // スタンプの名前が正しく設定されているか確認
        assertEq(metadata.name, name);
        // スタンプの組織が正しく設定されているか確認
        assertEq(metadata.organization, organization);
        // スタンプのカテゴリが正しく設定されているか確認
        assertEq(metadata.category, category);
        // 作成日時がタイムスタンプであることを確認
        assertGt(metadata.createdAt, 0);
    }

    function test_GetOrganizationStampCount() public {
        // 組織別スタンプ数の取得テスト
        string memory organization = unicode"東京大学";
        string memory category = unicode"学業";

        // 初期状態では0であることを確認
        assertEq(stampManager.getOrganizationStampCount(user, organization), 0);

        // 1つ目のスタンプを発行
        stampManager.issueStamp(user, unicode"スタンプ1", organization, category, 1);
        assertEq(stampManager.getOrganizationStampCount(user, organization), 1);

        // 2つ目のスタンプを発行
        stampManager.issueStamp(user, unicode"スタンプ2", organization, category, 1);
        assertEq(stampManager.getOrganizationStampCount(user, organization), 2);
    }

    function test_GetCategoryStampCount() public {
        // カテゴリ別スタンプ数の取得テスト
        string memory organization = unicode"東京大学";
        string memory category = unicode"学業";

        // 初期状態では0であることを確認
        assertEq(stampManager.getCategoryStampCount(user, category), 0);

        // 1つ目のスタンプを発行
        stampManager.issueStamp(user, unicode"スタンプ1", organization, category, 1);
        assertEq(stampManager.getCategoryStampCount(user, category), 1);

        // 2つ目のスタンプを発行
        stampManager.issueStamp(user, unicode"スタンプ2", organization, category, 1);
        assertEq(stampManager.getCategoryStampCount(user, category), 2);
    }

    function test_CanMintNft() public {
        // NFT発行条件判定のテスト
        string memory organization = unicode"東京大学";
        string memory category = unicode"学業";

        // 2つまではNFT発行不可であることを確認
        stampManager.issueStamp(user, unicode"スタンプ1", organization, category, 1);
        stampManager.issueStamp(user, unicode"スタンプ2", organization, category, 1);
        assertFalse(stampManager.canMintNft(user, organization));

        // 3つ目でNFT発行可能になることを確認
        stampManager.issueStamp(user, unicode"スタンプ3", organization, category, 1);
        assertTrue(stampManager.canMintNft(user, organization));

        // 4つ目でもNFT発行可能であることを確認
        stampManager.issueStamp(user, unicode"スタンプ4", organization, category, 1);
        assertTrue(stampManager.canMintNft(user, organization));
    }

    function test_CanMintNft_DifferentOrganizations() public {
        // 異なる組織からのスタンプではNFT発行不可であることを確認するテスト
        string memory category = unicode"学業";

        // 組織Aから2つ発行
        stampManager.issueStamp(user, unicode"スタンプ1", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ2", unicode"組織A", category, 1);
        
        // 組織Bから1つ発行
        stampManager.issueStamp(user, unicode"スタンプ3", unicode"組織B", category, 1);

        // 組織AからはまだNFT発行不可（2つしかない）
        assertFalse(stampManager.canMintNft(user, unicode"組織A"));
        // 組織BからもNFT発行不可（1つしかない）
        assertFalse(stampManager.canMintNft(user, unicode"組織B"));

        // 組織Aから3つ目を発行
        stampManager.issueStamp(user, unicode"スタンプ4", unicode"組織A", category, 1);
        
        // 組織AからはNFT発行可能になった
        assertTrue(stampManager.canMintNft(user, unicode"組織A"));
        // 組織BからはまだNFT発行不可（1つのまま）
        assertFalse(stampManager.canMintNft(user, unicode"組織B"));
    }

    function test_OnlyOwnerCanIssueStamp() public {
        // 所有者以外がスタンプを発行できないことを確認するテスト
        string memory name = unicode"テストスタンプ";
        string memory organization = unicode"テスト組織";
        string memory category = unicode"テストカテゴリ";

        // 所有者以外のアドレスとして実行するように設定
        vm.prank(address(0x999));
        // "Not owner"というエラーが発生することを期待
        vm.expectRevert("Not owner");
        stampManager.issueStamp(user, name, organization, category, 1);
    }

    function test_GetUserStampCount() public {
        // ユーザーのスタンプ総数の取得テスト
        string memory organization = unicode"東京大学";
        string memory category = unicode"学業";

        // 初期状態では0であることを確認
        assertEq(stampManager.getUserStampCount(user), 0);

        // 1つ目のスタンプを発行
        stampManager.issueStamp(user, unicode"スタンプ1", organization, category, 1);
        assertEq(stampManager.getUserStampCount(user), 1);

        // 2つ目のスタンプを発行
        stampManager.issueStamp(user, unicode"スタンプ2", organization, category, 1);
        assertEq(stampManager.getUserStampCount(user), 2);

        // 異なる組織からスタンプを発行しても総数は増える
        stampManager.issueStamp(user, unicode"スタンプ3", unicode"組織B", category, 1);
        assertEq(stampManager.getUserStampCount(user), 3);
    }

    function test_MultipleUsers() public {
        // 複数のユーザーが独立してスタンプを持つことを確認するテスト
        address user1 = address(0x1);
        address user2 = address(0x2);
        string memory organization = unicode"東京大学";
        string memory category = unicode"学業";

        // user1にスタンプを発行
        stampManager.issueStamp(user1, unicode"スタンプ1", organization, category, 1);
        assertEq(stampManager.getUserStampCount(user1), 1);
        assertEq(stampManager.getUserStampCount(user2), 0);

        // user2にスタンプを発行
        stampManager.issueStamp(user2, unicode"スタンプ2", organization, category, 1);
        assertEq(stampManager.getUserStampCount(user1), 1);
        assertEq(stampManager.getUserStampCount(user2), 1);

        // user1にさらにスタンプを発行
        stampManager.issueStamp(user1, unicode"スタンプ3", organization, category, 1);
        assertEq(stampManager.getUserStampCount(user1), 2);
        assertEq(stampManager.getUserStampCount(user2), 1);
    }

    function test_StampIdIsTimestamp() public {
        // スタンプIDがタイムスタンプであることを確認するテスト
        string memory organization = unicode"東京大学";
        string memory category = unicode"学業";

        // ブロックタイムスタンプを記録
        uint256 beforeTimestamp = block.timestamp;

        // スタンプを発行
        uint256 tokenId = stampManager.issueStamp(user, unicode"スタンプ1", organization, category, 1);

        // ブロックタイムスタンプを記録（発行後）
        uint256 afterTimestamp = block.timestamp;

        // スタンプのメタデータを取得
        CareerStampSFT.StampMetadata memory metadata = stampSft.getStampMetadata(tokenId);
        
        // tokenIdが正しく設定されていることを確認
        assertGt(tokenId, 0);
        // 作成日時がタイムスタンプの範囲内であることを確認
        assertGe(metadata.createdAt, beforeTimestamp);
        assertLe(metadata.createdAt, afterTimestamp);
    }

    // ========== ルールベースシステムのテスト ==========

    function test_AddMintRule() public {
        // 新しいルールを追加
        uint256 ruleId = stampManager.addMintRule("Rare", 2, 3);
        
        // ルールが正しく追加されたか確認
        assertEq(ruleId, 2); // ルールID 1はデフォルトで存在
        MintRule memory rule = stampManager.getRule(ruleId);
        assertEq(rule.rarity, "Rare");
        assertEq(rule.requiredOrganizations, 2);
        assertEq(rule.stampsPerOrg, 3);
        assertTrue(rule.isActive);
    }

    function test_CanMintWithRule_SingleOrganization() public {
        // デフォルトルール（1企業3スタンプ）をテスト
        string memory organization = unicode"東京大学";
        string memory category = unicode"学業";
        
        // 2つまではNFT発行不可
        stampManager.issueStamp(user, unicode"スタンプ1", organization, category, 1);
        stampManager.issueStamp(user, unicode"スタンプ2", organization, category, 1);
        assertFalse(stampManager.canMintWithRule(user, 1));
        
        // 3つ目でNFT発行可能
        stampManager.issueStamp(user, unicode"スタンプ3", organization, category, 1);
        assertTrue(stampManager.canMintWithRule(user, 1));
    }

    function test_CanMintWithRule_MultipleOrganizations() public {
        // 2企業から各3スタンプ = Rare のルールを追加
        uint256 rareRuleId = stampManager.addMintRule("Rare", 2, 3);
        
        string memory category = unicode"学業";
        
        // 組織Aから3つ発行
        stampManager.issueStamp(user, unicode"スタンプ1", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ2", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ3", unicode"組織A", category, 1);
        
        // まだ1企業しかないのでNFT発行不可
        assertFalse(stampManager.canMintWithRule(user, rareRuleId));
        
        // 組織Bから3つ発行
        stampManager.issueStamp(user, unicode"スタンプ4", unicode"組織B", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ5", unicode"組織B", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ6", unicode"組織B", category, 1);
        
        // 2企業から各3スタンプ集まったのでNFT発行可能
        assertTrue(stampManager.canMintWithRule(user, rareRuleId));
    }

    function test_CanMintWithRule_Epic() public {
        // 3企業から各3スタンプ = Epic のルールを追加
        stampManager.addMintRule("Epic", 3, 3);
        uint256 epicRuleId = 2; // ルールID 2（デフォルトルールが1なので）
        
        string memory category = unicode"学業";
        
        // 組織A、B、Cから各3つずつ発行
        stampManager.issueStamp(user, unicode"スタンプA1", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプA2", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプA3", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプB1", unicode"組織B", category, 1);
        stampManager.issueStamp(user, unicode"スタンプB2", unicode"組織B", category, 1);
        stampManager.issueStamp(user, unicode"スタンプB3", unicode"組織B", category, 1);
        stampManager.issueStamp(user, unicode"スタンプC1", unicode"組織C", category, 1);
        stampManager.issueStamp(user, unicode"スタンプC2", unicode"組織C", category, 1);
        stampManager.issueStamp(user, unicode"スタンプC3", unicode"組織C", category, 1);
        
        // 3企業から各3スタンプ集まったのでNFT発行可能
        assertTrue(stampManager.canMintWithRule(user, epicRuleId));
    }

    function test_CanMintWithRule_InsufficientStamps() public {
        // 2企業から各3スタンプ = Rare のルールを追加
        uint256 rareRuleId = stampManager.addMintRule("Rare", 2, 3);
        
        string memory category = unicode"学業";
        
        // 組織Aから3つ、組織Bから2つしか発行していない
        stampManager.issueStamp(user, unicode"スタンプ1", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ2", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ3", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ4", unicode"組織B", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ5", unicode"組織B", category, 1);
        
        // 組織Bが3つに満たないのでNFT発行不可
        assertFalse(stampManager.canMintWithRule(user, rareRuleId));
    }

    function test_GetAvailableRules() public {
        // 複数のルールを追加
        uint256 rareRuleId = stampManager.addMintRule("Rare", 2, 3);
        stampManager.addMintRule("Epic", 3, 3); // epicRuleIdは使用しないが、ルールは追加
        
        string memory category = unicode"学業";
        
        // 初期状態では満たせるルールがない
        uint256[] memory available = stampManager.getAvailableRules(user);
        assertEq(available.length, 0);
        
        // 組織Aから3つ発行（Commonルールを満たす）
        stampManager.issueStamp(user, unicode"スタンプ1", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ2", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ3", unicode"組織A", category, 1);
        
        available = stampManager.getAvailableRules(user);
        assertEq(available.length, 1);
        assertEq(available[0], 1); // Commonルール
        
        // 組織Bから3つ発行（Rareルールも満たす）
        stampManager.issueStamp(user, unicode"スタンプ4", unicode"組織B", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ5", unicode"組織B", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ6", unicode"組織B", category, 1);
        
        available = stampManager.getAvailableRules(user);
        assertEq(available.length, 2);
        // 順序は保証されないので、含まれているかどうかだけ確認
        bool hasCommon = false;
        bool hasRare = false;
        for (uint256 i = 0; i < available.length; i++) {
            if (available[i] == 1) hasCommon = true;
            if (available[i] == rareRuleId) hasRare = true;
        }
        assertTrue(hasCommon);
        assertTrue(hasRare);
    }

    function test_SetRuleActive() public {
        // 新しいルールを追加
        uint256 ruleId = stampManager.addMintRule("Rare", 2, 3);
        assertTrue(stampManager.getRule(ruleId).isActive);
        
        // まずスタンプを発行して条件を満たす
        string memory category = unicode"学業";
        stampManager.issueStamp(user, unicode"スタンプ1", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ2", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ3", unicode"組織A", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ4", unicode"組織B", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ5", unicode"組織B", category, 1);
        stampManager.issueStamp(user, unicode"スタンプ6", unicode"組織B", category, 1);
        
        // ルールが有効な状態では満たせる
        assertTrue(stampManager.canMintWithRule(user, ruleId));
        
        // ルールを無効化
        stampManager.setRuleActive(ruleId, false);
        assertFalse(stampManager.getRule(ruleId).isActive);
        
        // ルールが無効なので満たせない（エラーが発生する）
        vm.expectRevert("Rule is not active");
        stampManager.canMintWithRule(user, ruleId);
        
        // ルールを再有効化
        stampManager.setRuleActive(ruleId, true);
        assertTrue(stampManager.canMintWithRule(user, ruleId));
    }

    function test_GetAllRuleIds() public {
        // 初期状態ではデフォルトルール（ID 1）のみ
        uint256[] memory ruleIds = stampManager.getAllRuleIds();
        assertEq(ruleIds.length, 1);
        assertEq(ruleIds[0], 1);
        
        // ルールを追加
        stampManager.addMintRule("Rare", 2, 3);
        stampManager.addMintRule("Epic", 3, 3);
        
        ruleIds = stampManager.getAllRuleIds();
        assertEq(ruleIds.length, 3);
    }

    function test_OnlyOwnerCanAddRule() public {
        // 所有者以外はルールを追加できない
        vm.prank(address(0x999));
        vm.expectRevert("Not owner");
        stampManager.addMintRule("Rare", 2, 3);
    }

    function test_OnlyOwnerCanSetRuleActive() public {
        // ルールを追加
        uint256 ruleId = stampManager.addMintRule("Rare", 2, 3);
        
        // 所有者以外はルールの有効/無効を変更できない
        vm.prank(address(0x999));
        vm.expectRevert("Not owner");
        stampManager.setRuleActive(ruleId, false);
    }
}


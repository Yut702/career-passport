// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {NonFungibleCareerNFT} from "../src/NonFungibleCareerNFT.sol";

contract NonFungibleCareerNFTTest is Test {
    // Testを継承してテストコントラクトを作成
    NonFungibleCareerNFT public nft;
    address public owner;
    address public user;

    function setUp() public {
        // 各テストの前に実行されるセットアップ関数
        owner = address(this);  // テストコントラクト自体が所有者になる
        user = address(0x1);     // テスト用のユーザーアドレス
        nft = new NonFungibleCareerNFT();  // 新しいNFTコントラクトをデプロイ
    }

    function test_Mint() public {
        // NFT発行のテスト
        string memory uri = "https://example.com/metadata.json";
        string memory name = unicode"優秀な成績証明書";
        string memory rarity = "Rare";
        string[] memory organizations = new string[](1);
        organizations[0] = unicode"東京大学";

        // NFTを発行
        uint256 tokenId = nft.mint(user, uri, name, rarity, organizations);

        // 発行されたNFTの所有者が正しいか確認
        assertEq(nft.ownerOf(tokenId), user);
        // URIが正しく設定されているか確認
        assertEq(nft.tokenURI(tokenId), uri);
        // トークン名が正しく設定されているか確認
        assertEq(nft.getTokenName(tokenId), name);
        // レアリティが正しく設定されているか確認
        assertEq(nft.getTokenRarity(tokenId), rarity);
        // 関連組織が正しく設定されているか確認
        assertEq(nft.getTokenOrganizations(tokenId)[0], organizations[0]);
    }

    function test_TransferNotAllowed() public {
        // 譲渡が禁止されていることを確認するテスト
        string memory uri = "https://example.com/metadata.json";
        string memory name = unicode"テストNFT";
        string memory rarity = "Common";
        string[] memory organizations = new string[](0);

        // NFTを発行
        uint256 tokenId = nft.mint(user, uri, name, rarity, organizations);

        // ユーザーとして実行するように設定
        vm.prank(user);
        // 譲渡を試みる（失敗するはず）
        // "Transfer not allowed"というエラーが発生することを期待
        vm.expectRevert("Transfer not allowed");
        nft.transferFrom(user, address(0x2), tokenId);
    }

    function test_GetTotalSupply() public {
        // 総供給数のテスト
        // 初期状態では0であることを確認
        assertEq(nft.getTotalSupply(), 0);

        string memory uri = "https://example.com/metadata.json";
        string memory name = unicode"テストNFT";
        string memory rarity = "Common";
        string[] memory organizations = new string[](0);

        // 1つ目のNFTを発行
        nft.mint(user, uri, name, rarity, organizations);
        assertEq(nft.getTotalSupply(), 1);

        // 2つ目のNFTを発行
        nft.mint(user, uri, name, rarity, organizations);
        assertEq(nft.getTotalSupply(), 2);
    }

    function test_OnlyOwnerCanMint() public {
        // 所有者以外がNFTを発行できないことを確認するテスト
        string memory uri = "https://example.com/metadata.json";
        string memory name = unicode"テストNFT";
        string memory rarity = "Common";
        string[] memory organizations = new string[](0);

        // 所有者以外のアドレスとして実行するように設定
        vm.prank(address(0x999));
        // "Ownable: caller is not the owner"というエラーが発生することを期待
        vm.expectRevert();
        nft.mint(user, uri, name, rarity, organizations);
    }

    function test_TokenIdIncrement() public {
        // トークンIDが正しくインクリメントされることを確認するテスト
        string memory uri = "https://example.com/metadata.json";
        string memory name = unicode"テストNFT";
        string memory rarity = "Common";
        string[] memory organizations = new string[](0);

        // 1つ目のNFTを発行（IDは0）
        uint256 tokenId1 = nft.mint(user, uri, name, rarity, organizations);
        assertEq(tokenId1, 0);

        // 2つ目のNFTを発行（IDは1）
        uint256 tokenId2 = nft.mint(user, uri, name, rarity, organizations);
        assertEq(tokenId2, 1);

        // 3つ目のNFTを発行（IDは2）
        uint256 tokenId3 = nft.mint(user, uri, name, rarity, organizations);
        assertEq(tokenId3, 2);
    }

    function test_MultipleOrganizations() public {
        // 複数の組織が関連付けられることを確認するテスト
        string memory uri = "https://example.com/metadata.json";
        string memory name = unicode"複数組織NFT";
        string memory rarity = "Epic";
        string[] memory organizations = new string[](3);
        organizations[0] = unicode"東京大学";
        organizations[1] = unicode"株式会社ABC";
        organizations[2] = unicode"株式会社XYZ";

        uint256 tokenId = nft.mint(user, uri, name, rarity, organizations);

        // 関連組織の配列が正しく保存されているか確認
        string[] memory retrievedOrgs = nft.getTokenOrganizations(tokenId);
        assertEq(retrievedOrgs.length, 3);
        assertEq(retrievedOrgs[0], unicode"東京大学");
        assertEq(retrievedOrgs[1], unicode"株式会社ABC");
        assertEq(retrievedOrgs[2], unicode"株式会社XYZ");
    }
}


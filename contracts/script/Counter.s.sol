// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";

contract CounterScript is Script {
    // Scriptを継承してデプロイスクリプトを作成
    Counter public counter;

    function setUp() public {}
    // テスト用のセットアップ関数（このスクリプトでは未使用）

    function run() public {
        // Foundryがスクリプトを実行する際に呼び出すエントリーポイント
        vm.startBroadcast();  // トランザクション送信開始

        counter = new Counter();  // Counterコントラクトをデプロイ

        vm.stopBroadcast();   // トランザクション送信終了
    }
}

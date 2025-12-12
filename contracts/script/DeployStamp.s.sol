// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {StampManager} from "../src/StampManager.sol";
import {CareerStampSFT} from "../src/CareerStampSFT.sol";

contract DeployStamp is Script {
    function run() external returns (StampManager, CareerStampSFT) {
        vm.startBroadcast();
        
        // 1. SFTコントラクトを先にデプロイ
        CareerStampSFT stampSFT = new CareerStampSFT();
        
        // 2. StampManagerコントラクトをデプロイ（SFTコントラクトのアドレスを渡す）
        StampManager stampManager = new StampManager(address(stampSFT));
        
        // 3. StampManagerをSFTコントラクトの所有者に設定（StampManagerがSFTをmintできるようにする）
        stampSFT.transferOwnership(address(stampManager));
        
        vm.stopBroadcast();
        return (stampManager, stampSFT);
    }
}


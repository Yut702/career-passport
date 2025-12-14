// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {StampManager} from "../src/StampManager.sol";
import {CareerStampSFT} from "../src/CareerStampSFT.sol";

contract DeployStamp is Script {
    function run() external returns (StampManager, CareerStampSFT) {
        vm.startBroadcast();
        
        // 1. SFTコントラクトを先にデプロイ
        CareerStampSFT stampSft = new CareerStampSFT();
        
        // 2. StampManagerコントラクトをデプロイ（SFTコントラクトのアドレスを渡す）
        StampManager stampManager = new StampManager(address(stampSft));
        
        // 3. StampManagerをSFTコントラクトの所有者に設定（StampManagerがSFTをmintできるようにする）
        stampSft.transferOwnership(address(stampManager));
        
        vm.stopBroadcast();
        return (stampManager, stampSft);
    }
}


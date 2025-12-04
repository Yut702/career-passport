// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {StampManager} from "../src/StampManager.sol";

contract DeployStamp is Script {
    function run() external returns (StampManager) {
        vm.startBroadcast();
        StampManager stampManager = new StampManager();
        vm.stopBroadcast();
        return stampManager;
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {CareerPassportNFT} from "../src/CareerPassportNFT.sol";

contract DeployNFT is Script {
    function run() external returns (CareerPassportNFT) {
        vm.startBroadcast();
        CareerPassportNFT nft = new CareerPassportNFT();
        vm.stopBroadcast();
        return nft;
    }
}


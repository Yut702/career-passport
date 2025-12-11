// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {NonFungibleCareerNFT} from "../src/NonFungibleCareerNFT.sol";

contract DeployNFT is Script {
    function run() external returns (NonFungibleCareerNFT) {
        vm.startBroadcast();
        NonFungibleCareerNFT nft = new NonFungibleCareerNFT();
        vm.stopBroadcast();
        return nft;
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct Stamp {
    uint256 id;
    string name;
    string organization;
    string category;
    uint256 issuedAt;
}

contract StampManager {
    mapping(address => Stamp[]) private userStamps;
    mapping(address => mapping(string => uint256)) private organizationStampCount;
    mapping(address => mapping(string => uint256)) private categoryStampCount;
    address public owner;

    event StampIssued(address indexed user, string name, string organization, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function issueStamp(
        address user,
        string memory name,
        string memory organization,
        string memory category
    ) public onlyOwner {
        Stamp memory newStamp = Stamp({
            id: block.timestamp,
            name: name,
            organization: organization,
            category: category,
            issuedAt: block.timestamp
        });
        userStamps[user].push(newStamp);
        organizationStampCount[user][organization]++;
        categoryStampCount[user][category]++;

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

    function canMintNFT(address user, string memory organization) public view returns (bool) {
        return organizationStampCount[user][organization] >= 3;
    }

    function getUserStampCount(address user) public view returns (uint256) {
        return userStamps[user].length;
    }
}


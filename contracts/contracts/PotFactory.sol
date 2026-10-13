// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Pot} from "./Pot.sol";
import {DemoPot} from "./DemoPot.sol";

contract PotFactory {
    struct PotParams {
        string title; string goalType; uint256 stakeAmount; uint256 joinDeadline;
        uint256 endDate; uint256 requiredCheckIns; address charityAddress; bool isDemo;
    }

    address public immutable defaultToken;
    address[] public allPots;
    mapping(address => address[]) public userPots;
    mapping(address => bool) public isPot;
    mapping(address => mapping(address => bool)) private _listed;

    event PotCreated(address indexed potAddress, address indexed creator, string title, string goalType, uint256 stakeAmount,
        uint256 joinDeadline, uint256 endDate, uint256 requiredCheckIns, address charityAddress, bool isDemo);

    constructor(address _defaultToken) { defaultToken = _defaultToken; }

    function createPot(PotParams calldata p) external returns (address potAddress) {
        require(bytes(p.title).length > 0 && bytes(p.title).length <= 60, "Bad title");
        require(p.stakeAmount > 0, "Stake required");
        require(p.joinDeadline > block.timestamp, "Join deadline in past");
        require(p.endDate > p.joinDeadline, "End before join deadline");
        require(p.requiredCheckIns > 0 && p.requiredCheckIns <= 60, "Bad check-in count");
        require(p.charityAddress != address(0), "Charity required");

        potAddress = p.isDemo
            ? address(new DemoPot(msg.sender, p.title, p.goalType, p.stakeAmount, p.joinDeadline, p.endDate, p.requiredCheckIns, p.charityAddress, defaultToken))
            : address(new Pot(msg.sender, p.title, p.goalType, p.stakeAmount, p.joinDeadline, p.endDate, p.requiredCheckIns, p.charityAddress, defaultToken));

        allPots.push(potAddress);
        isPot[potAddress] = true;
        _list(msg.sender, potAddress);
        emit PotCreated(potAddress, msg.sender, p.title, p.goalType, p.stakeAmount, p.joinDeadline, p.endDate, p.requiredCheckIns, p.charityAddress, p.isDemo);
    }

    /// @dev Called by a pot when someone joins so "my pots" includes joined pots.
    function registerMember(address user) external {
        require(isPot[msg.sender], "Not a pot");
        _list(user, msg.sender);
    }

    function _list(address user, address pot) private {
        if (!_listed[user][pot]) { _listed[user][pot] = true; userPots[user].push(pot); }
    }

    function getAllPots() external view returns (address[] memory) { return allPots; }
    function getPotsCount() external view returns (uint256) { return allPots.length; }
    function getUserPots(address user) external view returns (address[] memory) { return userPots[user]; }
}

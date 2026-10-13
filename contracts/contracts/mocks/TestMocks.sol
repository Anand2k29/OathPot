// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Test USDC", "tUSDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 v) external { _mint(to, v); }
}

contract MockPot {
    uint256 public endDate;
    bool public isSettled;
    mapping(address => bool) public isMember;
    mapping(address => bool) public isWinner;
    constructor(uint256 _end) { endDate = _end; }
    function setMember(address a, bool v) external { isMember[a] = v; }
    function settle(address[] calldata winners) external { isSettled = true; for (uint i; i < winners.length; i++) isWinner[winners[i]] = true; }
}

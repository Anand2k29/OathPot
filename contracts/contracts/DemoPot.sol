// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Pot} from "./Pot.sol";

/// @notice Pot with a time machine for demos. Anyone can fast-forward — never use with real value.
contract DemoPot is Pot {
    uint256 public timeOffset;
    constructor(
        address _creator, string memory _title, string memory _goalType, uint256 _stakeAmount,
        uint256 _joinDeadline, uint256 _endDate, uint256 _requiredCheckIns, address _charityAddress, address _tokenAddress
    ) Pot(_creator, _title, _goalType, _stakeAmount, _joinDeadline, _endDate, _requiredCheckIns, _charityAddress, _tokenAddress) {}

    function _now() internal view override returns (uint256) { return block.timestamp + timeOffset; }
    function fastForward(uint256 secondsToAdvance) external { timeOffset += secondsToAdvance; }
    function fastForwardToEnd() external { uint256 t = _now(); if (t < endDate) timeOffset += endDate - t; }
}

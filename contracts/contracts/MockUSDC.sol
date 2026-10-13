// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Free test stablecoin (6 decimals). TESTNET ONLY.
contract MockUSDC is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 100 * 1e6;
    constructor() ERC20("Mock USDC", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function faucet() external { _mint(msg.sender, FAUCET_AMOUNT); }
    function faucetTo(address to) external { _mint(to, FAUCET_AMOUNT); }
}

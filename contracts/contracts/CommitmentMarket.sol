// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @dev Minimal view of an Oathpot `Pot` contract.
interface IOathPot {
    function isSettled() external view returns (bool);
    function isWinner(address) external view returns (bool);
    function isMember(address) external view returns (bool);
    function endDate() external view returns (uint256);
}

/// @title CommitmentMarket
/// @notice Parimutuel YES/NO market on a single claim: "will `member` hit their goal in `pot`?".
///         Outcome is read trustlessly from the Pot contract (no oracle, no admin, no fee).
///         Pot members are barred from betting (they already have skin in the game and
///         could otherwise bet NO on themselves and quit on purpose).
/// @dev    Accounting is strictly per-market: claims can never pay out more than that market's pool,
///         so a malicious/buggy `pot` address can only affect bettors who chose to trade on it.
contract CommitmentMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    uint256 public constant MIN_BET = 100_000; // 0.10 of a 6-decimals token

    struct Market { uint256 yesPool; uint256 noPool; }
    mapping(bytes32 => Market) private _markets;
    mapping(bytes32 => mapping(address => uint256)) private _yes;
    mapping(bytes32 => mapping(address => uint256)) private _no;
    mapping(bytes32 => mapping(address => bool)) private _claimed;

    event Bet(address indexed pot, address indexed member, address indexed bettor, bool yes, uint256 amount, uint256 yesPool, uint256 noPool);
    event Claimed(address indexed pot, address indexed member, address indexed bettor, uint256 payout);

    constructor(address _token) { token = IERC20(_token); }

    function marketId(address pot, address member) public pure returns (bytes32) {
        return keccak256(abi.encode(pot, member));
    }

    function bet(address pot, address member, bool yes, uint256 amount) external nonReentrant {
        require(amount >= MIN_BET, "Bet too small");
        IOathPot p = IOathPot(pot);
        require(p.isMember(member), "Not a pot member");
        require(!p.isMember(msg.sender), "Members cannot bet");
        require(!p.isSettled() && block.timestamp < p.endDate(), "Market closed");

        bytes32 id = marketId(pot, member);
        token.safeTransferFrom(msg.sender, address(this), amount);
        Market storage m = _markets[id];
        if (yes) { m.yesPool += amount; _yes[id][msg.sender] += amount; }
        else { m.noPool += amount; _no[id][msg.sender] += amount; }
        emit Bet(pot, member, msg.sender, yes, amount, m.yesPool, m.noPool);
    }

    function claim(address pot, address member) external nonReentrant returns (uint256 payout) {
        IOathPot p = IOathPot(pot);
        require(p.isSettled(), "Not settled");
        bytes32 id = marketId(pot, member);
        require(!_claimed[id][msg.sender], "Already claimed");

        Market storage m = _markets[id];
        uint256 y = _yes[id][msg.sender];
        uint256 n = _no[id][msg.sender];
        require(y + n > 0, "No position");

        bool outcome = p.isWinner(member);
        uint256 winPool = outcome ? m.yesPool : m.noPool;
        _claimed[id][msg.sender] = true;

        if (winPool == 0) {
            payout = y + n; // nobody backed the right side: full refund
        } else {
            uint256 mine = outcome ? y : n;
            require(mine > 0, "Position lost");
            payout = (mine * (m.yesPool + m.noPool)) / winPool;
        }
        token.safeTransfer(msg.sender, payout);
        emit Claimed(pot, member, msg.sender, payout);
    }

    function getMarket(address pot, address member, address user)
        external view returns (uint256 yesPool, uint256 noPool, uint256 userYes, uint256 userNo, bool claimed)
    {
        bytes32 id = marketId(pot, member);
        Market storage m = _markets[id];
        return (m.yesPool, m.noPool, _yes[id][user], _no[id][user], _claimed[id][user]);
    }
}

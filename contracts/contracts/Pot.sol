// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPotRegistry { function registerMember(address user) external; }

/// @title Pot — a group commitment pot.
/// Members stake equally, check in (max once/day), friends verify by strict majority of OTHER members.
/// After the end date, members who reached `requiredCheckIns` verified check-ins split the whole pot.
/// Nobody qualified → everything goes to charity. Rounding dust goes to charity.
contract Pot is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_MEMBERS = 8;

    struct CheckIn {
        uint256 id; address member; bytes32 proofHash; string note;
        uint256 timestamp; uint256 approvals; uint256 rejections; bool isVerified;
    }

    address public immutable factory;
    address public immutable creator;
    string public title;
    string public goalType;
    uint256 public immutable stakeAmount;
    uint256 public immutable joinDeadline;
    uint256 public immutable endDate;
    uint256 public immutable requiredCheckIns;
    address public immutable charityAddress;
    IERC20 public immutable token;
    uint256 public immutable creationTime;

    address[] public members;
    mapping(address => bool) public isMember;
    CheckIn[] public checkIns;
    mapping(address => uint256) public lastCheckInDay; // day index + 1
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public verifiedCheckInCount;
    mapping(address => bool) public isWinner;
    uint256 public winnerCount;
    uint256 public payoutPerWinner;
    uint256 public totalStaked;
    bool public isSettled;

    event MemberJoined(address indexed member, uint256 totalMembers);
    event CheckInSubmitted(uint256 indexed checkInId, address indexed member, bytes32 proofHash, string note, uint256 timestamp);
    event CheckInVoted(uint256 indexed checkInId, address indexed voter, bool approve, uint256 approvals, uint256 rejections, bool nowVerified);
    event PayoutClaimed(address indexed member, uint256 amount);
    event PotSettled(uint256 totalPot, uint256 winnerCount, uint256 payoutPerWinner, uint256 dustToCharity);

    constructor(
        address _creator, string memory _title, string memory _goalType, uint256 _stakeAmount,
        uint256 _joinDeadline, uint256 _endDate, uint256 _requiredCheckIns, address _charityAddress, address _tokenAddress
    ) {
        factory = msg.sender; creator = _creator; title = _title; goalType = _goalType;
        stakeAmount = _stakeAmount; joinDeadline = _joinDeadline; endDate = _endDate;
        requiredCheckIns = _requiredCheckIns; charityAddress = _charityAddress;
        token = IERC20(_tokenAddress); creationTime = block.timestamp;
    }

    /// @dev Overridden by DemoPot to simulate time passing.
    function _now() internal view virtual returns (uint256) { return block.timestamp; }

    function join() external nonReentrant {
        require(!isSettled, "Settled");
        require(_now() < joinDeadline, "Join closed");
        require(!isMember[msg.sender], "Already joined");
        require(members.length < MAX_MEMBERS, "Pot full");
        isMember[msg.sender] = true;
        members.push(msg.sender);
        totalStaked += stakeAmount;
        token.safeTransferFrom(msg.sender, address(this), stakeAmount);
        if (factory.code.length > 0) { try IPotRegistry(factory).registerMember(msg.sender) {} catch {} }
        emit MemberJoined(msg.sender, members.length);
    }

    function submitCheckIn(bytes32 proofHash, string calldata note) external returns (uint256 id) {
        require(isMember[msg.sender], "Not a member");
        require(!isSettled, "Settled");
        uint256 t = _now();
        require(t < endDate, "Pot ended");
        require(bytes(note).length <= 280, "Note too long");
        uint256 day = t / 1 days + 1;
        require(lastCheckInDay[msg.sender] != day, "Already checked in today");
        lastCheckInDay[msg.sender] = day;
        id = checkIns.length;
        checkIns.push(CheckIn(id, msg.sender, proofHash, note, block.timestamp, 0, 0, false));
        emit CheckInSubmitted(id, msg.sender, proofHash, note, block.timestamp);
    }

    /// @notice Strict majority of the OTHER members.
    function getRequiredApprovals() public view returns (uint256) {
        uint256 others = members.length == 0 ? 0 : members.length - 1;
        return others == 0 ? 1 : others / 2 + 1;
    }

    function verifyCheckIn(uint256 checkInId, bool approve) external {
        require(isMember[msg.sender], "Not a member");
        require(!isSettled, "Settled");
        require(checkInId < checkIns.length, "No such check-in");
        CheckIn storage c = checkIns[checkInId];
        require(c.member != msg.sender, "Cannot vote on own check-in");
        require(!hasVoted[checkInId][msg.sender], "Already voted");
        hasVoted[checkInId][msg.sender] = true;
        if (approve) c.approvals++; else c.rejections++;
        if (!c.isVerified && c.approvals >= getRequiredApprovals()) {
            c.isVerified = true;
            verifiedCheckInCount[c.member]++;
        }
        emit CheckInVoted(checkInId, msg.sender, approve, c.approvals, c.rejections, c.isVerified);
    }

    function settle() external nonReentrant {
        require(!isSettled, "Already settled");
        require(_now() >= endDate, "Not ended yet");
        isSettled = true;
        uint256 n = members.length;
        uint256 w;
        for (uint256 i; i < n; i++) {
            if (verifiedCheckInCount[members[i]] >= requiredCheckIns) { isWinner[members[i]] = true; w++; }
        }
        winnerCount = w;
        uint256 total = totalStaked;
        if (w == 0) {
            if (total > 0) token.safeTransfer(charityAddress, total);
            emit PotSettled(total, 0, 0, total);
            return;
        }
        uint256 per = total / w;
        payoutPerWinner = per;
        uint256 dust = total - per * w;
        for (uint256 i; i < n; i++) {
            if (isWinner[members[i]]) { token.safeTransfer(members[i], per); emit PayoutClaimed(members[i], per); }
        }
        if (dust > 0) token.safeTransfer(charityAddress, dust);
        emit PotSettled(total, w, per, dust);
    }

    // ----- views -----
    function getMembers() external view returns (address[] memory) { return members; }
    function getCheckInsCount() external view returns (uint256) { return checkIns.length; }
    function getCheckIn(uint256 id) external view returns (CheckIn memory) { return checkIns[id]; }
    function getAllCheckIns() external view returns (CheckIn[] memory) { return checkIns; }

    function getProjectedPayout(address member) external view returns (uint256 projectedPayout, bool isProjectedWinner) {
        if (isSettled) return (isWinner[member] ? payoutPerWinner : 0, isWinner[member]);
        uint256 w;
        for (uint256 i; i < members.length; i++) if (verifiedCheckInCount[members[i]] >= requiredCheckIns) w++;
        if (w == 0 || verifiedCheckInCount[member] < requiredCheckIns) return (0, false);
        return (totalStaked / w, true);
    }

    function getPotSummary() external view returns (
        string memory _title, string memory _goalType, uint256 _stakeAmount, uint256 _joinDeadline, uint256 _endDate,
        uint256 _requiredCheckIns, address _charityAddress, uint256 _memberCount, uint256 _totalStaked, bool _isSettled, uint256 _checkInCount
    ) {
        return (title, goalType, stakeAmount, joinDeadline, endDate, requiredCheckIns, charityAddress, members.length, totalStaked, isSettled, checkIns.length);
    }
}

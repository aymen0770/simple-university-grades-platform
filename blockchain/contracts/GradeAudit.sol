// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Stores audit commitments only; never store student data or numeric grades here.
contract GradeAudit {
    address public owner;
    mapping(address => bool) public auditors;

    event AuditorUpdated(address indexed auditor, bool enabled);
    event GradeAuditRecorded(bytes32 indexed recordHash, address indexed actor, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    modifier onlyAuditor() {
        require(auditors[msg.sender], "Not an authorised auditor");
        _;
    }

    constructor() {
        owner = msg.sender;
        auditors[msg.sender] = true;
        emit AuditorUpdated(msg.sender, true);
    }

    function setAuditor(address account, bool enabled) external onlyOwner {
        require(account != address(0), "Invalid address");
        auditors[account] = enabled;
        emit AuditorUpdated(account, enabled);
    }

    function recordGradeAudit(bytes32 recordHash) external onlyAuditor {
        require(recordHash != bytes32(0), "Empty hash");
        emit GradeAuditRecorded(recordHash, msg.sender, block.timestamp);
    }
}

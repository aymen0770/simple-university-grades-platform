const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("GradeAudit", function () {
  it("allows authorised auditors to emit a commitment", async function () {
    const [owner, teacher] = await ethers.getSigners();
    const audit = await ethers.deployContract("GradeAudit");
    await audit.setAuditor(teacher.address, true);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("randomised-test-commitment"));
    await expect(audit.connect(teacher).recordGradeAudit(hash))
      .to.emit(audit, "GradeAuditRecorded")
      .withArgs(hash, teacher.address, anyValue);
  });

  it("rejects non-auditors", async function () {
    const [, stranger] = await ethers.getSigners();
    const audit = await ethers.deployContract("GradeAudit");
    const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    await expect(audit.connect(stranger).recordGradeAudit(hash))
      .to.be.revertedWith("Not an authorised auditor");
  });
});

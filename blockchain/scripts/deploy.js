const hre = require("hardhat");
async function main() {
  const contract = await hre.ethers.deployContract("GradeAudit");
  await contract.waitForDeployment();
  console.log("GradeAudit deployed to:", await contract.getAddress());
  console.log("For local development only: add this address to backend/.env");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
import crypto from 'node:crypto';
import fs from 'node:fs';
import { ethers } from 'ethers';

export async function auditGrade({ courseId, studentId, teacherId, assessment, score, maxScore, createdAt }) {
  // Random salt prevents simple guessing of a grade from a public hash.
  const salt = crypto.randomBytes(32).toString('hex');
  const payload = JSON.stringify({ courseId, studentId, teacherId, assessment, score, maxScore, createdAt, salt });
  const recordHash = ethers.keccak256(ethers.toUtf8Bytes(payload));
  const address = process.env.AUDIT_CONTRACT_ADDRESS;
  const key = process.env.AUDIT_PRIVATE_KEY;
  const rpc = process.env.AUDIT_RPC_URL || 'http://127.0.0.1:8545';
  if (!address || !key) return { status: 'skipped', recordHash };
  try {
    const abi = JSON.parse(fs.readFileSync(new URL('../../blockchain/artifacts/contracts/GradeAudit.sol/GradeAudit.json', import.meta.url), 'utf8')).abi;
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(key, provider);
    const contract = new ethers.Contract(address, abi, wallet);
    const tx = await contract.recordGradeAudit(recordHash);
    const receipt = await tx.wait();
    return { status: 'recorded', recordHash, transactionHash: receipt.hash };
  } catch (err) {
    console.error('Blockchain audit unavailable:', err.message);
    return { status: 'failed', recordHash };
  }
}

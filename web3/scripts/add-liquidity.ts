import * as dotenv from "dotenv";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

// Deployed contract addresses
const VOUCHER_TOKEN_ADDRESS = "0xB9BC7bEd1cC50ce4D5faE0b128138f59a0fa6Dc7";
const LIQUIDITY_POOL_ADDRESS = "0x13dFE2fea862f88015698B70f0127c97014aAac3";

async function main() {
    const RPC_URL = process.env.SEPOLIA_RPC_URL;
    const PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;

    if (!RPC_URL || !PRIVATE_KEY) {
        throw new Error("Missing SEPOLIA_RPC_URL or SEPOLIA_PRIVATE_KEY in .env");
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const deployerAddress = await signer.getAddress();

    console.log("Account:", deployerAddress);
    const balance = await provider.getBalance(deployerAddress);
    console.log("Balance:", ethers.formatEther(balance), "ETH");

    // Read artifacts
    const artifactsDir = path.join(process.cwd(), "artifacts", "contracts");

    const voucherTokenArtifact = JSON.parse(
        fs.readFileSync(path.join(artifactsDir, "VoucherToken.sol", "VoucherToken.json"), "utf8")
    );
    const liquidityPoolArtifact = JSON.parse(
        fs.readFileSync(path.join(artifactsDir, "LiquidityPool.sol", "LiquidityPool.json"), "utf8")
    );

    const voucherToken = new ethers.Contract(VOUCHER_TOKEN_ADDRESS, voucherTokenArtifact.abi, signer);
    const liquidityPool = new ethers.Contract(LIQUIDITY_POOL_ADDRESS, liquidityPoolArtifact.abi, signer);

    console.log("\n=== Adding Liquidity ===\n");

    try {
        console.log("1. Approving LiquidityPool...");
        let tx = await voucherToken.setApprovalForAll(LIQUIDITY_POOL_ADDRESS, true);
        console.log(`   Tx hash: ${tx.hash}`);
        console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log("   Waiting for confirmation...");
        await tx.wait();
        console.log("   ✓ Approved!\n");

        console.log("2. Adding liquidity for voucher 1 (50 vouchers + 0.05 ETH)...");
        tx = await liquidityPool.addLiquidity(1, 50, { value: ethers.parseEther("0.05") });
        console.log(`   Tx hash: ${tx.hash}`);
        console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log("   Waiting for confirmation...");
        await tx.wait();
        console.log("   ✓ Liquidity added!\n");

        console.log("3. Adding liquidity for voucher 2 (50 vouchers + 0.03 ETH)...");
        tx = await liquidityPool.addLiquidity(2, 50, { value: ethers.parseEther("0.03") });
        console.log(`   Tx hash: ${tx.hash}`);
        console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log("   Waiting for confirmation...");
        await tx.wait();
        console.log("   ✓ Liquidity added!\n");

        // Check reserves
        const reserves1 = await liquidityPool.getReserves(1);
        const reserves2 = await liquidityPool.getReserves(2);

        console.log("=== Pool Status ===");
        console.log(`Pool 1: ${reserves1[0].toString()} vouchers, ${ethers.formatEther(reserves1[1])} ETH`);
        console.log(`Pool 2: ${reserves2[0].toString()} vouchers, ${ethers.formatEther(reserves2[1])} ETH`);
        console.log("\n✅ All done!");

    } catch (error: any) {
        console.error("\n❌ Error:", error.message);
        if (error.transaction) {
            console.error("Failed tx:", error.transaction.hash);
        }
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

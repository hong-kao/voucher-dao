import * as dotenv from "dotenv";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

// Deployed contract addresses
const VOUCHER_TOKEN_ADDRESS = "0xB9BC7bEd1cC50ce4D5faE0b128138f59a0fa6Dc7";
const LIQUIDITY_POOL_ADDRESS = "0x13dFE2fea862f88015698B70f0127c97014aAac3";

// Your wallet address
const TARGET_WALLET = "0x00969ec37804456100b2c0f393C150a2df7da754";

async function main() {
    const RPC_URL = process.env.SEPOLIA_RPC_URL;
    const PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;

    if (!RPC_URL || !PRIVATE_KEY) {
        throw new Error("Missing SEPOLIA_RPC_URL or SEPOLIA_PRIVATE_KEY in .env");
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const deployerAddress = await signer.getAddress();

    console.log("Signer:", deployerAddress);
    console.log("Target wallet:", TARGET_WALLET);
    const balance = await provider.getBalance(deployerAddress);
    console.log("Balance:", ethers.formatEther(balance), "ETH\n");

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

    console.log("=== Minting Vouchers to Your Wallet ===\n");

    try {
        // Mint vouchers to target wallet
        console.log("1. Minting 10 Amazon vouchers (tokenId 1)...");
        let tx = await voucherToken.mint(TARGET_WALLET, 1, 10);
        console.log(`   Tx: https://sepolia.etherscan.io/tx/${tx.hash}`);
        await tx.wait();
        console.log("   ✓ Done!\n");

        console.log("2. Minting 10 Zara vouchers (tokenId 2)...");
        tx = await voucherToken.mint(TARGET_WALLET, 2, 10);
        console.log(`   Tx: https://sepolia.etherscan.io/tx/${tx.hash}`);
        await tx.wait();
        console.log("   ✓ Done!\n");

        console.log("3. Minting 10 Starbucks vouchers (tokenId 3)...");
        tx = await voucherToken.mint(TARGET_WALLET, 3, 10);
        console.log(`   Tx: https://sepolia.etherscan.io/tx/${tx.hash}`);
        await tx.wait();
        console.log("   ✓ Done!\n");

        // Check balances
        const bal1 = await voucherToken.balanceOf(TARGET_WALLET, 1);
        const bal2 = await voucherToken.balanceOf(TARGET_WALLET, 2);
        const bal3 = await voucherToken.balanceOf(TARGET_WALLET, 3);

        console.log("=== Your Voucher Balances ===");
        console.log(`Amazon (1): ${bal1.toString()} vouchers`);
        console.log(`Zara (2): ${bal2.toString()} vouchers`);
        console.log(`Starbucks (3): ${bal3.toString()} vouchers`);

        // Check pool reserves
        const reserves1 = await liquidityPool.getReserves(1);
        const reserves2 = await liquidityPool.getReserves(2);

        console.log("\n=== Pool Status ===");
        console.log(`Pool 1: ${reserves1[0].toString()} vouchers, ${ethers.formatEther(reserves1[1])} ETH`);
        console.log(`Pool 2: ${reserves2[0].toString()} vouchers, ${ethers.formatEther(reserves2[1])} ETH`);

        console.log("\n✅ All done! You can now demo swaps!");

    } catch (error: any) {
        console.error("\n❌ Error:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

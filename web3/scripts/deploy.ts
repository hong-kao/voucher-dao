import * as dotenv from "dotenv";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function main() {
    const RPC_URL = process.env.SEPOLIA_RPC_URL;
    const PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;

    if (!RPC_URL || !PRIVATE_KEY) {
        throw new Error("Missing SEPOLIA_RPC_URL or SEPOLIA_PRIVATE_KEY in .env");
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const deployerAddress = await signer.getAddress();

    console.log("Deploying contracts with account:", deployerAddress);
    const balance = await provider.getBalance(deployerAddress);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    //read artifacts
    const artifactsDir = path.join(process.cwd(), "artifacts", "contracts");

    const voucherTokenArtifact = JSON.parse(
        fs.readFileSync(path.join(artifactsDir, "VoucherToken.sol", "VoucherToken.json"), "utf8")
    );
    const liquidityPoolArtifact = JSON.parse(
        fs.readFileSync(path.join(artifactsDir, "LiquidityPool.sol", "LiquidityPool.json"), "utf8")
    );
    const escrowArtifact = JSON.parse(
        fs.readFileSync(path.join(artifactsDir, "Escrow.sol", "Escrow.json"), "utf8")
    );

    //deploy VoucherToken
    console.log("\n1. Deploying VoucherToken...");
    const VoucherTokenFactory = new ethers.ContractFactory(
        voucherTokenArtifact.abi,
        voucherTokenArtifact.bytecode,
        signer
    );
    const voucherToken = await VoucherTokenFactory.deploy();
    await voucherToken.waitForDeployment();
    const voucherTokenAddress = await voucherToken.getAddress();
    console.log("VoucherToken deployed to:", voucherTokenAddress);

    //deploy LiquidityPool
    console.log("\n2. Deploying LiquidityPool...");
    const LiquidityPoolFactory = new ethers.ContractFactory(
        liquidityPoolArtifact.abi,
        liquidityPoolArtifact.bytecode,
        signer
    );
    const liquidityPool = await LiquidityPoolFactory.deploy(voucherTokenAddress);
    await liquidityPool.waitForDeployment();
    const liquidityPoolAddress = await liquidityPool.getAddress();
    console.log("LiquidityPool deployed to:", liquidityPoolAddress);

    //deploy Escrow
    console.log("\n3. Deploying Escrow...");
    const EscrowFactory = new ethers.ContractFactory(
        escrowArtifact.abi,
        escrowArtifact.bytecode,
        signer
    );
    const escrow = await EscrowFactory.deploy(voucherTokenAddress);
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    console.log("Escrow deployed to:", escrowAddress);

    //create sample voucher types
    console.log("\n4. Creating sample voucher types...");
    const faceValue = ethers.parseEther("0.1");

    let tx = await (voucherToken as any).create_voucher_type(1, "Amazon", faceValue);
    await tx.wait();
    console.log("Created voucher type 1: Amazon");

    tx = await (voucherToken as any).create_voucher_type(2, "Zara", faceValue);
    await tx.wait();
    console.log("Created voucher type 2: Zara");

    tx = await (voucherToken as any).create_voucher_type(3, "Starbucks", ethers.parseEther("0.05"));
    await tx.wait();
    console.log("Created voucher type 3: Starbucks");

    //mint test vouchers to deployer
    console.log("\n5. Minting test vouchers...");
    tx = await (voucherToken as any).mint(deployerAddress, 1, 100);
    await tx.wait();
    tx = await (voucherToken as any).mint(deployerAddress, 2, 100);
    await tx.wait();
    tx = await (voucherToken as any).mint(deployerAddress, 3, 100);
    await tx.wait();
    console.log("Minted 100 of each voucher type");

    //add initial liquidity
    console.log("\n6. Adding initial liquidity...");
    tx = await (voucherToken as any).setApprovalForAll(liquidityPoolAddress, true);
    await tx.wait();

    tx = await (liquidityPool as any).addLiquidity(1, 50, { value: ethers.parseEther("0.05") });
    await tx.wait();
    console.log("Added liquidity for voucher 1: 50 vouchers + 0.05 ETH");

    tx = await (liquidityPool as any).addLiquidity(2, 50, { value: ethers.parseEther("0.03") });
    await tx.wait();
    console.log("Added liquidity for voucher 2: 50 vouchers + 0.03 ETH");

    console.log("\n========================================");
    console.log("DEPLOYMENT COMPLETE!");
    console.log("========================================");
    console.log("\nContract Addresses:");
    console.log("VoucherToken:", voucherTokenAddress);
    console.log("LiquidityPool:", liquidityPoolAddress);
    console.log("Escrow:", escrowAddress);
    console.log("\nAdd to your frontend .env:");
    console.log(`VITE_VOUCHER_TOKEN_ADDRESS=${voucherTokenAddress}`);
    console.log(`VITE_LIQUIDITY_POOL_ADDRESS=${liquidityPoolAddress}`);
    console.log(`VITE_ESCROW_ADDRESS=${escrowAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

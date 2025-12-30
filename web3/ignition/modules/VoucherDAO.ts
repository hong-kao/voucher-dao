import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VoucherDAOModule = buildModule("VoucherDAOModule", (m) => {
    //deploy VoucherToken first
    const voucherToken = m.contract("VoucherToken", []);

    //deploy LiquidityPool with VoucherToken address
    const liquidityPool = m.contract("LiquidityPool", [voucherToken]);

    //deploy Escrow with VoucherToken address
    const escrow = m.contract("Escrow", [voucherToken]);

    return { voucherToken, liquidityPool, escrow };
});

export default VoucherDAOModule;

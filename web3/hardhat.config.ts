import "@nomicfoundation/hardhat-mocha";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-ethers-chai-matchers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
  },
  test: {
    mocha: {
      timeout: 40000,
    },
  },
});
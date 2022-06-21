require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("solidity-coverage");
require("hardhat-deploy");

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "https://example";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey";
const ETHER_SCAN_API_KEY = process.env.ETHER_SCAN_API_KEY || "0xkey";
const COIN_MARKETCAP_API_KEY = process.env.COIN_MARKETCAP_API_KEY || "0xkey";

module.exports = {
    // solidity: "0.8.8",
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 4,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
    },
    etherscan: {
        apiKey: ETHER_SCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COIN_MARKETCAP_API_KEY,
        token: "MATIC",
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
};
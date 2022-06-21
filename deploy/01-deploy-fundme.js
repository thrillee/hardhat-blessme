const { network } = require("hardhat");
const { verify } = require("../utils/verify-contract");

const { networkConfig, developmentChain } = require("../helper-hardhat-config");

module.exports = async({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let ethUsdPriceFeedAddress;
    if (developmentChain.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
    }

    const constructorArgs = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: constructorArgs,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (!developmentChain.includes(network.name) &&
        process.env.ETHER_SCAN_API_KEY
    ) {
        await verify(fundMe.address, constructorArgs);
    }

    log("---------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
const { assert } = require("console");
const { ethers, getNamedAccounts, network } = require("hardhat");

const { developmentChain } = require("../../helper-hardhat-config");

developemntChain.includes(network.name) ?
    describe.skip :
    describe("FundMe", function() {
        let fundMe;
        let deployer;

        const sendValue = ethers.utils.parseEther("1"); // 1 ETH

        beforeEach(async function() {
            deployer = (await getNamedAccounts()).deployer;
            fundMe = await ethers.getContract("FundMe", deployer);
        });

        it("allows people to fund and withdraw", async function() {
            await fundMe.fund({ value: sendValue });
            await fundMe.withdraw();

            const endBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            assert.equal(endBalance.toString(), "0");
        });
    });
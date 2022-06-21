const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

const { developmentChain } = require("../../helper-hardhat-config");

!developmentChain.includes(network.name) ?
    describe.skip :
    describe("FundMe", function() {
        let fundMe;
        let deployer;
        let mockV3Aggregator;

        const sendValue = ethers.utils.parseEther("1"); // 1 ETH

        beforeEach(async function() {
            // Using hardhat accounts
            // const accounts = await ethers.getSigners()
            // const firstAccount = accounts[0]

            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]); // fixtures get deployments by tags
            fundMe = await ethers.getContract("FundMe", deployer);

            mockV3Aggregator = await ethers.getContract(
                "MockV3Aggregator",
                deployer
            );
        });

        describe("constructor", function() {
            it("sets the aggregator address correctly", async function() {
                const response = await fundMe.getPriceFee();
                assert.equal(response, mockV3Aggregator.address);
            });
        });

        describe("fund", function() {
            it("fails if you don't send enough eth", async function() {
                await expect(fundMe.fund()).to.be.revertedWith(
                    "Spend this money boss!"
                );
            });

            it("updates the amount funded data structure", async function() {
                await fundMe.fund({ value: sendValue });
                const response = await fundMe.getAddressToAmountFunded(
                    deployer
                );
                assert.equal(response.toString(), sendValue.toString());
            });

            it("added funders to array of funders", async function() {
                await fundMe.fund({ value: sendValue });
                const funder = await fundMe.getFunders(0);
                assert.equal(funder, deployer);
            });
        });

        describe("withdraw", function() {
            beforeEach(async function() {
                await fundMe.fund({ value: sendValue });
            });

            it("Withdraw eth from a single founder", async function() {
                const startingFundMebalance =
                    await fundMe.provider.getBalance(fundMe.address);
                const startingDeployerBalance =
                    await fundMe.provider.getBalance(deployer);

                const transactionResponse = await fundMe.withdraw();
                const transactionReceipt = await transactionResponse.wait();
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const totalGasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMebalance = await fundMe.provider.getBalance(
                    fundMe.address
                );
                const endingDeployerBalance =
                    await fundMe.provider.getBalance(deployer);

                assert.equal(endingFundMebalance, 0);
                assert.equal(
                    startingFundMebalance
                    .add(startingDeployerBalance)
                    .toString(),
                    endingDeployerBalance.add(totalGasCost).toString()
                );
            });

            it("Cheap Withdraw eth from a single founder", async function() {
                const startingFundMebalance =
                    await fundMe.provider.getBalance(fundMe.address);
                const startingDeployerBalance =
                    await fundMe.provider.getBalance(deployer);

                const transactionResponse = await fundMe.cheaperWithdraw();
                const transactionReceipt = await transactionResponse.wait();
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const totalGasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMebalance = await fundMe.provider.getBalance(
                    fundMe.address
                );
                const endingDeployerBalance =
                    await fundMe.provider.getBalance(deployer);

                assert.equal(endingFundMebalance, 0);
                assert.equal(
                    startingFundMebalance
                    .add(startingDeployerBalance)
                    .toString(),
                    endingDeployerBalance.add(totalGasCost).toString()
                );
            });

            it("allows us to withdraw with multiple funders", async function() {
                const accounts = await ethers.getSigners();
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    );
                    fundMeConnectedContract.fund({ value: sendValue });
                }

                const startingFundMebalance =
                    await fundMe.provider.getBalance(fundMe.address);
                const startingDeployerBalance =
                    await fundMe.provider.getBalance(deployer);

                const transactionResponse = await fundMe.withdraw();
                const transactionReceipt = await transactionResponse.wait();
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const totalGasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMebalance = await fundMe.provider.getBalance(
                    fundMe.address
                );
                const endingDeployerBalance =
                    await fundMe.provider.getBalance(deployer);

                assert.equal(endingFundMebalance, 0);
                assert.equal(
                    startingFundMebalance
                    .add(startingDeployerBalance)
                    .toString(),
                    endingDeployerBalance.add(totalGasCost).toString()
                );

                await expect(fundMe.getFunders(0)).to.be.reverted;
                for (let i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getAddressToAmountFunded(
                            accounts[i].address
                        ),
                        0
                    );
                }
            });

            it("cheap withdraw testing..", async function() {
                const accounts = await ethers.getSigners();
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(
                        accounts[i]
                    );
                    fundMeConnectedContract.fund({ value: sendValue });
                }

                const startingFundMebalance =
                    await fundMe.provider.getBalance(fundMe.address);
                const startingDeployerBalance =
                    await fundMe.provider.getBalance(deployer);

                const transactionResponse = await fundMe.cheaperWithdraw();
                const transactionReceipt = await transactionResponse.wait();
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const totalGasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMebalance = await fundMe.provider.getBalance(
                    fundMe.address
                );
                const endingDeployerBalance =
                    await fundMe.provider.getBalance(deployer);

                assert.equal(endingFundMebalance, 0);
                assert.equal(
                    startingFundMebalance
                    .add(startingDeployerBalance)
                    .toString(),
                    endingDeployerBalance.add(totalGasCost).toString()
                );

                await expect(fundMe.getFunders(0)).to.be.reverted;
                for (let i = 1; i < 6; i++) {
                    assert.equal(
                        await fundMe.getAddressToAmountFunded(
                            accounts[i].address
                        ),
                        0
                    );
                }
            });

            it("only allows owner to withdraw", async function() {
                const accounts = await ethers.getSigners();
                const attacker = accounts[1];
                const attackerConnectedContract = await fundMe.connect(
                    attacker
                );

                await expect(
                    attackerConnectedContract.withdraw()
                ).to.be.revertedWith("FundMe__NotOwner");
            });
        });
    });
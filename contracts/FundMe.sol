//SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

error FundMe__NotOwner();

/** @title A contract for collection
 * @author Oluwatobi Bello
 * @notice This contract is to demo hardhat and hardhat deploy magic powers
 * @dev This implements price feeds  as our library
 */
contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUN_USD = 5 * 1e18;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _; // Run the rest of the code
    }

    constructor(address priceFeeAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeeAddress);
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUN_USD,
            "Spend this money boss!"
        ); // Send atleast 1eth
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function cheaperWithdraw() public onlyOwner {
        address[] memory funders = s_funders;
        for (uint256 funderIndex; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        // Reset array
        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }(""); //Call
        require(callSuccess, "Call failed");
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        // Reset array
        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }(""); //Call
        require(callSuccess, "Call failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFee() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}

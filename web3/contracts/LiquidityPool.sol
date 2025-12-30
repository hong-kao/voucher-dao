// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LiquidityPool is ERC1155Holder, Ownable, ReentrancyGuard {
    IERC1155 public voucherToken;
    
    mapping(uint256 => uint256) public voucherReserves;
    mapping(uint256 => uint256) public ethReserves;
    mapping(uint256 => mapping(address => uint256)) public liquidityShares;
    mapping(uint256 => uint256) public totalLiquidityShares;
    
    uint256 public redeemCounter;
    mapping(uint256 => RedemptionRecord) public redemptions;
    
    struct RedemptionRecord {
        address user;
        uint256 voucherId;
        uint256 timestamp;
        bool exists;
    }

    event VoucherDeposited(address indexed user, uint256 indexed voucherId, uint256 amount);
    event VoucherSwappedForETH(address indexed user, uint256 indexed voucherId, uint256 voucherAmount, uint256 ethAmount);
    event ETHSwappedForVoucher(address indexed user, uint256 indexed voucherId, uint256 ethAmount, uint256 voucherAmount);
    event LiquidityAdded(address indexed provider, uint256 indexed voucherId, uint256 voucherAmount, uint256 ethAmount, uint256 shares);
    event LiquidityRemoved(address indexed provider, uint256 indexed voucherId, uint256 voucherAmount, uint256 ethAmount, uint256 shares);
    event VoucherRedeemed(address indexed user, uint256 indexed voucherId, uint256 redeemId);

    constructor(address _voucherToken) Ownable(msg.sender) {
        voucherToken = IERC1155(_voucherToken);
    }

    function depositVoucher(uint256 voucherId, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        voucherToken.safeTransferFrom(msg.sender, address(this), voucherId, amount, "");
        voucherReserves[voucherId] += amount;
        
        emit VoucherDeposited(msg.sender, voucherId, amount);
    }

    function swapVoucherForETH(uint256 voucherId, uint256 voucherAmount, uint256 minETHOut) external nonReentrant {
        require(voucherAmount > 0, "Amount must be greater than 0");
        require(voucherReserves[voucherId] > 0 && ethReserves[voucherId] > 0, "Pool not initialized");
        
        uint256 ethOut = getETHOut(voucherId, voucherAmount);
        require(ethOut >= minETHOut, "Slippage too high");
        require(ethOut <= ethReserves[voucherId], "Insufficient ETH in pool");
        
        voucherToken.safeTransferFrom(msg.sender, address(this), voucherId, voucherAmount, "");
        voucherReserves[voucherId] += voucherAmount;
        ethReserves[voucherId] -= ethOut;
        
        (bool success, ) = msg.sender.call{value: ethOut}("");
        require(success, "ETH transfer failed");
        
        emit VoucherSwappedForETH(msg.sender, voucherId, voucherAmount, ethOut);
    }

    function swapETHForVoucher(uint256 voucherId, uint256 minVouchersOut) external payable nonReentrant {
        require(msg.value > 0, "ETH amount must be greater than 0");
        require(voucherReserves[voucherId] > 0 && ethReserves[voucherId] > 0, "Pool not initialized");
        
        uint256 vouchersOut = getVouchersOut(voucherId, msg.value);
        require(vouchersOut >= minVouchersOut, "Slippage too high");
        require(vouchersOut <= voucherReserves[voucherId], "Insufficient vouchers in pool");
        
        ethReserves[voucherId] += msg.value;
        voucherReserves[voucherId] -= vouchersOut;
        
        voucherToken.safeTransferFrom(address(this), msg.sender, voucherId, vouchersOut, "");
        
        emit ETHSwappedForVoucher(msg.sender, voucherId, msg.value, vouchersOut);
    }

    function addLiquidity(uint256 voucherId, uint256 voucherAmount) external payable nonReentrant {
        require(voucherAmount > 0 && msg.value > 0, "Amounts must be greater than 0");
        
        uint256 shares;
        
        if(totalLiquidityShares[voucherId] == 0) {
            shares = voucherAmount;
        } else {
            uint256 voucherShare = (voucherAmount * totalLiquidityShares[voucherId]) / voucherReserves[voucherId];
            uint256 ethShare = (msg.value * totalLiquidityShares[voucherId]) / ethReserves[voucherId];
            shares = voucherShare < ethShare ? voucherShare : ethShare;
        }
        
        require(shares > 0, "Insufficient liquidity minted");
        
        voucherToken.safeTransferFrom(msg.sender, address(this), voucherId, voucherAmount, "");
        voucherReserves[voucherId] += voucherAmount;
        ethReserves[voucherId] += msg.value;
        
        liquidityShares[voucherId][msg.sender] += shares;
        totalLiquidityShares[voucherId] += shares;
        
        emit LiquidityAdded(msg.sender, voucherId, voucherAmount, msg.value, shares);
    }

    function removeLiquidity(uint256 voucherId, uint256 shares) external nonReentrant {
        require(shares > 0, "Shares must be greater than 0");
        require(liquidityShares[voucherId][msg.sender] >= shares, "Insufficient shares");
        
        uint256 voucherAmount = (shares * voucherReserves[voucherId]) / totalLiquidityShares[voucherId];
        uint256 ethAmount = (shares * ethReserves[voucherId]) / totalLiquidityShares[voucherId];
        
        require(voucherAmount > 0 && ethAmount > 0, "Insufficient liquidity");
        
        liquidityShares[voucherId][msg.sender] -= shares;
        totalLiquidityShares[voucherId] -= shares;
        
        voucherReserves[voucherId] -= voucherAmount;
        ethReserves[voucherId] -= ethAmount;
        
        voucherToken.safeTransferFrom(address(this), msg.sender, voucherId, voucherAmount, "");
        
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        emit LiquidityRemoved(msg.sender, voucherId, voucherAmount, ethAmount, shares);
    }

    function redeemVoucher(uint256 voucherId) external nonReentrant {
        require(voucherToken.balanceOf(msg.sender, voucherId) > 0, "No vouchers to redeem");
        
        voucherToken.safeTransferFrom(msg.sender, address(this), voucherId, 1, "");
        
        redeemCounter++;
        redemptions[redeemCounter] = RedemptionRecord({
            user: msg.sender,
            voucherId: voucherId,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit VoucherRedeemed(msg.sender, voucherId, redeemCounter);
    }

    function getETHOut(uint256 voucherId, uint256 voucherAmountIn) public view returns (uint256) {
        uint256 voucherReserveIn = voucherReserves[voucherId];
        uint256 ethReserveOut = ethReserves[voucherId];
        
        require(voucherReserveIn > 0 && ethReserveOut > 0, "Pool not initialized");
        
        uint256 amountInWithFee = voucherAmountIn * 997;
        uint256 numerator = amountInWithFee * ethReserveOut;
        uint256 denominator = (voucherReserveIn * 1000) + amountInWithFee;
        
        return numerator / denominator;
    }

    function getVouchersOut(uint256 voucherId, uint256 ethAmountIn) public view returns (uint256) {
        uint256 ethReserveIn = ethReserves[voucherId];
        uint256 voucherReserveOut = voucherReserves[voucherId];
        
        require(ethReserveIn > 0 && voucherReserveOut > 0, "Pool not initialized");
        
        uint256 amountInWithFee = ethAmountIn * 997;
        uint256 numerator = amountInWithFee * voucherReserveOut;
        uint256 denominator = (ethReserveIn * 1000) + amountInWithFee;
        
        return numerator / denominator;
    }

    function getReserves(uint256 voucherId) external view returns (uint256 voucherReserve, uint256 ethReserve) {
        return (voucherReserves[voucherId], ethReserves[voucherId]);
    }

    function getRedemption(uint256 redeemId) external view returns (
        address user,
        uint256 voucherId,
        uint256 timestamp,
        bool exists
    ) {
        RedemptionRecord memory record = redemptions[redeemId];
        return (record.user, record.voucherId, record.timestamp, record.exists);
    }

    receive() external payable {}
}

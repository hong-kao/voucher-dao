// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {VoucherToken} from "../contracts/VoucherToken.sol";
import {LiquidityPool} from "../contracts/LiquidityPool.sol";

contract LiquidityPoolTest is Test {
    VoucherToken public voucherToken;
    LiquidityPool public pool;
    
    address public owner;
    address public user1;
    address public user2;
    address public liquidityProvider;
    
    uint256 constant VOUCHER_ID_1 = 1;
    uint256 constant VOUCHER_ID_2 = 2;
    uint256 constant FACE_VALUE = 0.1 ether;
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        liquidityProvider = address(0x3);
        
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(liquidityProvider, 100 ether);
        
        voucherToken = new VoucherToken();
        pool = new LiquidityPool(address(voucherToken));
        
        voucherToken.create_voucher_type(VOUCHER_ID_1, "Amazon", FACE_VALUE);
        voucherToken.create_voucher_type(VOUCHER_ID_2, "Zara", FACE_VALUE);
    }
    
    function test_deployment_should_set_voucher_token() public {
        assertEq(address(pool.voucherToken()), address(voucherToken), "VoucherToken address should match");
    }
    
    function test_deposit_voucher_should_increase_reserves() public {
        voucherToken.mint(user1, VOUCHER_ID_1, 100);
        
        vm.startPrank(user1);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.depositVoucher(VOUCHER_ID_1, 50);
        vm.stopPrank();
        
        (uint256 voucherReserve, ) = pool.getReserves(VOUCHER_ID_1);
        assertEq(voucherReserve, 50, "Voucher reserves should be 50");
    }
    
    function test_add_liquidity_first_time_should_mint_shares() public {
        voucherToken.mint(liquidityProvider, VOUCHER_ID_1, 1000);
        
        vm.startPrank(liquidityProvider);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.addLiquidity{value: 1 ether}(VOUCHER_ID_1, 100);
        vm.stopPrank();
        
        (uint256 voucherReserve, uint256 ethReserve) = pool.getReserves(VOUCHER_ID_1);
        assertEq(voucherReserve, 100, "Voucher reserve should be 100");
        assertEq(ethReserve, 1 ether, "ETH reserve should be 1 ether");
        assertEq(pool.totalLiquidityShares(VOUCHER_ID_1), 100, "Total shares should be 100");
    }
    
    function test_add_liquidity_second_time_should_mint_proportional_shares() public {
        voucherToken.mint(liquidityProvider, VOUCHER_ID_1, 1000);
        voucherToken.mint(user1, VOUCHER_ID_1, 1000);
        
        vm.startPrank(liquidityProvider);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.addLiquidity{value: 1 ether}(VOUCHER_ID_1, 100);
        vm.stopPrank();
        
        vm.startPrank(user1);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.addLiquidity{value: 0.5 ether}(VOUCHER_ID_1, 50);
        vm.stopPrank();
        
        uint256 totalShares = pool.totalLiquidityShares(VOUCHER_ID_1);
        assertEq(totalShares, 150, "Total shares should be 150");
    }
    
    function test_swap_voucher_for_eth_should_work() public {
        voucherToken.mint(liquidityProvider, VOUCHER_ID_1, 1000);
        voucherToken.mint(user1, VOUCHER_ID_1, 100);
        
        vm.startPrank(liquidityProvider);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.addLiquidity{value: 10 ether}(VOUCHER_ID_1, 1000);
        vm.stopPrank();
        
        uint256 ethOut = pool.getETHOut(VOUCHER_ID_1, 10);
        uint256 user1BalanceBefore = user1.balance;
        
        vm.startPrank(user1);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.swapVoucherForETH(VOUCHER_ID_1, 10, ethOut);
        vm.stopPrank();
        
        uint256 user1BalanceAfter = user1.balance;
        assertGt(user1BalanceAfter, user1BalanceBefore, "User should receive ETH");
    }
    
    function test_swap_eth_for_voucher_should_work() public {
        voucherToken.mint(liquidityProvider, VOUCHER_ID_1, 1000);
        
        vm.startPrank(liquidityProvider);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.addLiquidity{value: 10 ether}(VOUCHER_ID_1, 1000);
        vm.stopPrank();
        
        uint256 vouchersOut = pool.getVouchersOut(VOUCHER_ID_1, 0.1 ether);
        
        vm.prank(user1);
        pool.swapETHForVoucher{value: 0.1 ether}(VOUCHER_ID_1, vouchersOut);
        
        uint256 user1Balance = voucherToken.balanceOf(user1, VOUCHER_ID_1);
        assertGt(user1Balance, 0, "User should receive vouchers");
    }
    
    function test_swap_should_revert_with_high_slippage() public {
        voucherToken.mint(liquidityProvider, VOUCHER_ID_1, 1000);
        voucherToken.mint(user1, VOUCHER_ID_1, 100);
        
        vm.startPrank(liquidityProvider);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.addLiquidity{value: 10 ether}(VOUCHER_ID_1, 1000);
        vm.stopPrank();
        
        vm.startPrank(user1);
        voucherToken.setApprovalForAll(address(pool), true);
        vm.expectRevert("Slippage too high");
        pool.swapVoucherForETH(VOUCHER_ID_1, 10, 100 ether);
        vm.stopPrank();
    }
    
    function test_remove_liquidity_should_return_assets() public {
        voucherToken.mint(liquidityProvider, VOUCHER_ID_1, 1000);
        
        vm.startPrank(liquidityProvider);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.addLiquidity{value: 1 ether}(VOUCHER_ID_1, 100);
        
        uint256 shares = pool.liquidityShares(VOUCHER_ID_1, liquidityProvider);
        uint256 ethBefore = liquidityProvider.balance;
        uint256 vouchersBefore = voucherToken.balanceOf(liquidityProvider, VOUCHER_ID_1);
        
        pool.removeLiquidity(VOUCHER_ID_1, shares / 2);
        vm.stopPrank();
        
        uint256 ethAfter = liquidityProvider.balance;
        uint256 vouchersAfter = voucherToken.balanceOf(liquidityProvider, VOUCHER_ID_1);
        
        assertGt(ethAfter, ethBefore, "Should receive ETH back");
        assertGt(vouchersAfter, vouchersBefore, "Should receive vouchers back");
    }
    
    function test_redeem_voucher_should_create_record() public {
        voucherToken.mint(user1, VOUCHER_ID_1, 10);
        
        vm.startPrank(user1);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.redeemVoucher(VOUCHER_ID_1);
        vm.stopPrank();
        
        (address user, uint256 voucherId, uint256 timestamp, bool exists) = pool.getRedemption(1);
        assertEq(user, user1, "User should match");
        assertEq(voucherId, VOUCHER_ID_1, "VoucherId should match");
        assertTrue(exists, "Redemption should exist");
        assertGt(timestamp, 0, "Timestamp should be set");
    }
    
    function test_redeem_voucher_should_emit_event() public {
        voucherToken.mint(user1, VOUCHER_ID_1, 10);
        
        vm.startPrank(user1);
        voucherToken.setApprovalForAll(address(pool), true);
        
        vm.expectEmit(true, true, false, true);
        emit LiquidityPool.VoucherRedeemed(user1, VOUCHER_ID_1, 1);
        pool.redeemVoucher(VOUCHER_ID_1);
        vm.stopPrank();
    }
    
    function test_redeem_voucher_should_revert_if_no_balance() public {
        vm.startPrank(user1);
        vm.expectRevert("No vouchers to redeem");
        pool.redeemVoucher(VOUCHER_ID_1);
        vm.stopPrank();
    }
    
    function test_get_reserves_should_return_correct_values() public {
        voucherToken.mint(liquidityProvider, VOUCHER_ID_1, 1000);
        
        vm.startPrank(liquidityProvider);
        voucherToken.setApprovalForAll(address(pool), true);
        pool.addLiquidity{value: 5 ether}(VOUCHER_ID_1, 500);
        vm.stopPrank();
        
        (uint256 voucherReserve, uint256 ethReserve) = pool.getReserves(VOUCHER_ID_1);
        assertEq(voucherReserve, 500, "Voucher reserve should be 500");
        assertEq(ethReserve, 5 ether, "ETH reserve should be 5 ether");
    }
    
    receive() external payable {}
}

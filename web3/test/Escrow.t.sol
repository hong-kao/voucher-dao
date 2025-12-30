// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {VoucherToken} from "../contracts/VoucherToken.sol";
import {Escrow} from "../contracts/Escrow.sol";

contract EscrowTest is Test {
    VoucherToken public voucherToken;
    Escrow public escrow;
    
    address public owner;
    address public seller;
    address public buyer;
    
    uint256 constant VOUCHER_ID = 1;
    uint256 constant FACE_VALUE = 0.1 ether;
    
    function setUp() public {
        owner = address(this);
        seller = address(0x1);
        buyer = address(0x2);
        
        vm.deal(seller, 10 ether);
        vm.deal(buyer, 10 ether);
        
        voucherToken = new VoucherToken();
        escrow = new Escrow(address(voucherToken));
        
        voucherToken.create_voucher_type(VOUCHER_ID, "Amazon", FACE_VALUE);
        voucherToken.mint(seller, VOUCHER_ID, 100);
    }
    
    function test_deployment_should_set_voucher_token() public {
        assertEq(address(escrow.voucherToken()), address(voucherToken));
    }
    
    function test_create_escrow_should_work() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        uint256 escrowId = escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
        
        assertEq(escrowId, 1);
        assertEq(voucherToken.balanceOf(address(escrow), VOUCHER_ID), 10);
    }
    
    function test_create_escrow_should_emit_event() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        
        vm.expectEmit(true, true, true, true);
        emit Escrow.EscrowCreated(1, seller, buyer, VOUCHER_ID, 10, 0.5 ether);
        escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
    }
    
    function test_create_escrow_should_revert_with_self() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        vm.expectRevert("Cannot create escrow with yourself");
        escrow.createEscrow(seller, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
    }
    
    function test_buy_and_release_should_transfer_voucher_and_eth() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
        
        uint256 sellerBalanceBefore = seller.balance;
        
        vm.prank(buyer);
        escrow.buyAndRelease{value: 0.5 ether}(1);
        
        assertEq(voucherToken.balanceOf(buyer, VOUCHER_ID), 10);
        assertEq(seller.balance, sellerBalanceBefore + 0.5 ether);
    }
    
    function test_buy_and_release_should_refund_excess_eth() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
        
        uint256 buyerBalanceBefore = buyer.balance;
        
        vm.prank(buyer);
        escrow.buyAndRelease{value: 1 ether}(1);
        
        assertEq(buyer.balance, buyerBalanceBefore - 0.5 ether);
    }
    
    function test_buy_and_release_should_revert_if_not_buyer() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
        
        vm.prank(seller);
        vm.expectRevert("Only buyer can purchase");
        escrow.buyAndRelease{value: 0.5 ether}(1);
    }
    
    function test_refund_escrow_should_return_vouchers() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        
        uint256 sellerBalanceBefore = voucherToken.balanceOf(seller, VOUCHER_ID);
        escrow.refundEscrow(1);
        vm.stopPrank();
        
        assertEq(voucherToken.balanceOf(seller, VOUCHER_ID), sellerBalanceBefore + 10);
    }
    
    function test_refund_escrow_should_revert_if_not_seller() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
        
        vm.prank(buyer);
        vm.expectRevert("Only seller can refund");
        escrow.refundEscrow(1);
    }
    
    function test_dispute_escrow_should_work() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
        
        vm.prank(buyer);
        escrow.disputeEscrow(1);
        
        (,,,,,Escrow.EscrowStatus status,,) = escrow.getEscrow(1);
        assertEq(uint256(status), uint256(Escrow.EscrowStatus.Disputed));
    }
    
    function test_resolve_dispute_to_buyer_should_release_vouchers() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
        
        vm.prank(buyer);
        escrow.disputeEscrow(1);
        
        escrow.resolveDispute(1, true);
        
        assertEq(voucherToken.balanceOf(buyer, VOUCHER_ID), 10);
    }
    
    function test_resolve_dispute_to_seller_should_refund_vouchers() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
        
        vm.prank(seller);
        escrow.disputeEscrow(1);
        
        uint256 sellerBalanceBefore = voucherToken.balanceOf(seller, VOUCHER_ID);
        escrow.resolveDispute(1, false);
        
        assertEq(voucherToken.balanceOf(seller, VOUCHER_ID), sellerBalanceBefore + 10);
    }
    
    function test_get_escrow_should_return_correct_data() public {
        vm.startPrank(seller);
        voucherToken.setApprovalForAll(address(escrow), true);
        escrow.createEscrow(buyer, VOUCHER_ID, 10, 0.5 ether);
        vm.stopPrank();
        
        (
            address _seller,
            address _buyer,
            uint256 _voucherId,
            uint256 _amount,
            uint256 _ethAmount,
            ,
            ,
            bool _exists
        ) = escrow.getEscrow(1);
        
        assertEq(_seller, seller);
        assertEq(_buyer, buyer);
        assertEq(_voucherId, VOUCHER_ID);
        assertEq(_amount, 10);
        assertEq(_ethAmount, 0.5 ether);
        assertTrue(_exists);
    }
    
    receive() external payable {}
}

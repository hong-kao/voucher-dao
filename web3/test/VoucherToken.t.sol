// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {VoucherToken} from "../contracts/VoucherToken.sol";

contract VoucherTokenTest is Test {
    VoucherToken public voucherToken;
    address public owner;
    address public user1;
    address public user2;

    uint256 constant TOKEN_ID_1 = 1;
    uint256 constant TOKEN_ID_2 = 2;
    string constant VOUCHER_NAME = "Amazon 5000 INR";
    uint256 FACE_VALUE = 0.1 ether;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        voucherToken = new VoucherToken();
    }

    function test_deployment_should_set_right_owner() public {
        assertEq(voucherToken.owner(), owner, "Owner should be set correctly");
    }

    function test_create_voucher_type_should_create_new_type() public {
        voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);

        (string memory name, uint256 face_value, bool exists) = voucherToken.get_voucher_info(TOKEN_ID_1);
        assertEq(name, VOUCHER_NAME, "Voucher name should match");
        assertEq(face_value, FACE_VALUE, "Face value should match");
        assertTrue(exists, "Voucher should exist");
    }

    function test_create_voucher_type_should_revert_if_exists() public {
        voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);
        
        vm.expectRevert("Token ID already exists");
        voucherToken.create_voucher_type(TOKEN_ID_1, "Duplicate", FACE_VALUE);
    }

    function test_create_voucher_type_should_revert_if_non_owner() public {
        vm.prank(user1);
        vm.expectRevert();
        voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);
    }

    function test_mint_should_mint_vouchers() public {
        voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);
        voucherToken.mint(user1, TOKEN_ID_1, 100);
        
        assertEq(voucherToken.balanceOf(user1, TOKEN_ID_1), 100, "Balance should be 100");
    }

    function test_mint_should_revert_if_token_not_exists() public {
        vm.expectRevert("Token ID does not exist");
        voucherToken.mint(user1, 999, 100);
    }

    function test_burn_should_allow_holder_to_burn() public {
        voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);
        voucherToken.mint(user1, TOKEN_ID_1, 100);
        
        vm.prank(user1);
        voucherToken.burn(user1, TOKEN_ID_1, 30);
        
        assertEq(voucherToken.balanceOf(user1, TOKEN_ID_1), 70, "Balance should be 70");
    }

    function test_burn_should_allow_approved_operator() public {
        voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);
        voucherToken.mint(user1, TOKEN_ID_1, 100);
        
        vm.prank(user1);
        voucherToken.setApprovalForAll(user2, true);
        
        vm.prank(user2);
        voucherToken.burn(user1, TOKEN_ID_1, 10);
        
        assertEq(voucherToken.balanceOf(user1, TOKEN_ID_1), 90, "Balance should be 90");
    }

    function test_burn_should_revert_if_not_authorized() public {
        voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);
        voucherToken.mint(user1, TOKEN_ID_1, 100);
        
        vm.prank(user2);
        vm.expectRevert("Not authorized to burn");
        voucherToken.burn(user1, TOKEN_ID_1, 10);
    }

    function test_mint_batch_should_mint_multiple_types() public {
        voucherToken.create_voucher_type(TOKEN_ID_1, "Amazon", FACE_VALUE);
        voucherToken.create_voucher_type(TOKEN_ID_2, "Zara", FACE_VALUE);
        
        uint256[] memory ids = new uint256[](2);
        ids[0] = TOKEN_ID_1;
        ids[1] = TOKEN_ID_2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 50;
        amounts[1] = 30;
        
        voucherToken.mint_batch(user1, ids, amounts);
        
        assertEq(voucherToken.balanceOf(user1, TOKEN_ID_1), 50, "TOKEN_ID_1 balance should be 50");
        assertEq(voucherToken.balanceOf(user1, TOKEN_ID_2), 30, "TOKEN_ID_2 balance should be 30");
    }
}

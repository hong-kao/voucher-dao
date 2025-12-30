import { expect } from "chai";
import { ethers } from "hardhat";
import { VoucherToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("VoucherToken", function () {
  let voucherToken: VoucherToken;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  const TOKEN_ID_1 = 1;
  const TOKEN_ID_2 = 2;
  const VOUCHER_NAME = "Amazon 5000 INR";
  const FACE_VALUE = ethers.parseEther("0.1");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const VoucherTokenFactory = await ethers.getContractFactory("VoucherToken");
    voucherToken = await VoucherTokenFactory.deploy();
    await voucherToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await voucherToken.owner()).to.equal(owner.address);
    });
  });

  describe("create_voucher_type", function () {
    it("Should create a new voucher type", async function () {
      await voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);

      const info = await voucherToken.get_voucher_info(TOKEN_ID_1);
      expect(info.name).to.equal(VOUCHER_NAME);
      expect(info.face_value).to.equal(FACE_VALUE);
      expect(info.exists).to.be.true;
    });

    it("Should emit VoucherTypeCreated event", async function () {
      await expect(voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE))
        .to.emit(voucherToken, "VoucherTypeCreated")
        .withArgs(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);
    });

    it("Should revert if token ID already exists", async function () {
      await voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);

      await expect(
        voucherToken.create_voucher_type(TOKEN_ID_1, "Duplicate", FACE_VALUE)
      ).to.be.revertedWith("Token ID already exists");
    });

    it("Should revert if non-owner tries to create", async function () {
      await expect(
        voucherToken.connect(user1).create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE)
      ).to.be.revertedWithCustomError(voucherToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("mint", function () {
    beforeEach(async function () {
      await voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);
    });

    it("Should mint vouchers to an address", async function () {
      await voucherToken.mint(user1.address, TOKEN_ID_1, 100);
      expect(await voucherToken.balanceOf(user1.address, TOKEN_ID_1)).to.equal(100);
    });

    it("Should emit VouchersMinted event", async function () {
      await expect(voucherToken.mint(user1.address, TOKEN_ID_1, 50))
        .to.emit(voucherToken, "VouchersMinted")
        .withArgs(user1.address, TOKEN_ID_1, 50);
    });

    it("Should revert if token ID does not exist", async function () {
      await expect(
        voucherToken.mint(user1.address, 999, 100)
      ).to.be.revertedWith("Token ID does not exist");
    });
  });

  describe("burn", function () {
    beforeEach(async function () {
      await voucherToken.create_voucher_type(TOKEN_ID_1, VOUCHER_NAME, FACE_VALUE);
      await voucherToken.mint(user1.address, TOKEN_ID_1, 100);
    });

    it("Should allow holder to burn their own vouchers", async function () {
      await voucherToken.connect(user1).burn(user1.address, TOKEN_ID_1, 30);
      expect(await voucherToken.balanceOf(user1.address, TOKEN_ID_1)).to.equal(70);
    });

    it("Should allow approved operator to burn", async function () {
      await voucherToken.connect(user1).setApprovalForAll(user2.address, true);
      await voucherToken.connect(user2).burn(user1.address, TOKEN_ID_1, 10);
      expect(await voucherToken.balanceOf(user1.address, TOKEN_ID_1)).to.equal(90);
    });

    it("Should revert if not authorized to burn", async function () {
      await expect(
        voucherToken.connect(user2).burn(user1.address, TOKEN_ID_1, 10)
      ).to.be.revertedWith("Not authorized to burn");
    });
  });

  describe("mint_batch", function () {
    beforeEach(async function () {
      await voucherToken.create_voucher_type(TOKEN_ID_1, "Amazon", FACE_VALUE);
      await voucherToken.create_voucher_type(TOKEN_ID_2, "Zara", FACE_VALUE);
    });

    it("Should mint multiple voucher types at once", async function () {
      await voucherToken.mint_batch(user1.address, [TOKEN_ID_1, TOKEN_ID_2], [50, 30]);
      expect(await voucherToken.balanceOf(user1.address, TOKEN_ID_1)).to.equal(50);
      expect(await voucherToken.balanceOf(user1.address, TOKEN_ID_2)).to.equal(30);
    });
  });
});
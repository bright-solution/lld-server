import contract from "../web3/contract";

const creditLevelIncomeOnChain = async (wallet, amount) => {
  try {
    const tx = await contract.creditIncome(
      wallet,
      ethers.parseUnits(amount.toString(), 18),
      2,
    );

    await tx.wait();
    return true;
  } catch (err) {
    console.error("❌ Onchain failed:", err.message);
    return false;
  }
};

export default creditLevelIncomeOnChain;

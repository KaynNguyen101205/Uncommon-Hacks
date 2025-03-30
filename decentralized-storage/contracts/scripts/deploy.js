async function main() {
  const MidnightAccessControl = await ethers.getContractFactory("MidnightAccessControl");
  const contract = await MidnightAccessControl.deploy();
  await contract.waitForDeployment(); // Wait until the contract is deployed
  console.log("FileAccessControl deployed to:", contract.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const BN = require("bignumber.js");
const { Connection, PublicKey } = require("@solana/web3.js");
const { getMint, getAccount } = require("@solana/spl-token");
const { programs } = require("@metaplex/js");
const axios = require("axios");
const colors = require("ansi-colors");
require('dotenv').config()

const {
  metadata: { Metadata },
} = programs;
const connection = new Connection(
  process.env.rpc_url?process.env.rpc_url:"",
  { maxSupportedTransactionVersion: 0 }
);
const contractAddress = new PublicKey(
  process.env.contract_address?process.env.contract_address:""
);

async function getTokenMetadata(mintAddress) {
  console.log("Fetching Metadata...");
  
  const metadataPDA = await Metadata.getPDA(mintAddress);
  const metadata = await Metadata.load(connection, metadataPDA);
  const mintInfo = await getMint(connection, mintAddress);

  const name = metadata.data.data.name;
  const symbol = metadata.data.data.symbol;
  const tokenSupply = (await connection.getTokenSupply(mintAddress)).value
    .amount;
  const decimals = mintInfo.decimals;

  const mintAuthority = mintInfo.mintAuthority?.toString();
  const freezeAuthority = mintInfo.freezeAuthority?.toString();
  const updateAuthority = metadata.data.updateAuthority;

  console.log("Fetching Holders...");
  const largestAccounts = await connection.getTokenLargestAccounts(mintAddress);
  const largestHolders = await Promise.all(
    largestAccounts.value.map(async (accountInfo) => {
      const accountData = await getAccount(connection, accountInfo.address);
      return {
        address: accountInfo.address.toBase58(),
        amount: new BN(accountData.amount).div(Math.pow(10, decimals)),
      };
    })
  );

  return {
    name,
    symbol,
    tokenSupply,
    decimals,
    mintAuthority,
    freezeAuthority,
    updateAuthority,
    largestHolders
  };
}

async function getRaydiumPools() {
  console.log("Fetching Pools...");
  try {
    const response = await axios.get("https://api.raydium.io/v2/main/pairs");
    return response.data;
  } catch (error) {
    console.error("Error fetching Raydium pools:", error);
    return [];
  }
}

async function getLiquidityPairs(tokenMintAddress) {
  const pools = await getRaydiumPools();
  const pairs = pools
    .filter(
      (pool) =>
        pool.baseMint === tokenMintAddress ||
        pool.quoteMint === tokenMintAddress
    )
    .map((pool) => ({
      poolAddress: pool.lpMint,
      baseMintAddress: pool.baseMint,
      quoteMintAddress: pool.quoteMint,
      baseTokenName: pool.baseSymbol,
      quoteTokenName: pool.quoteSymbol,
      baseTokenDecimals: pool.baseDecimals,
      quoteTokenDecimals: pool.quoteDecimals,
      baseTokenLiquidity: pool.tokenAmountCoin,
      quoteTokenLiquidity: pool.tokenAmountPc,
    }));
  return pairs;
}

function analyzeRisks(metadata, totalPairs, totalBaseLiquidity, totalQuoteLiquidity) {
  const warnings = [];
  
  if (metadata.mintAuthority === metadata.freezeAuthority && metadata.mintAuthority === metadata.updateAuthority) {
    warnings.push(colors.red('High risk: Centralized control over minting, freezing, and updating.'));
  } else {
    warnings.push(colors.green('Low risk: Distributed control over authorities.'));
  }
  
  const topHolder = metadata.largestHolders[0].amount;
  const totalSupply = new BN(metadata.tokenSupply).div(new BN(10).pow(metadata.decimals));
  const concentration = topHolder.div(totalSupply).toNumber();
  if (concentration > 0.5) {
    warnings.push(colors.red('High risk: Over 50% of supply held by a single address.'));
  } else if (concentration > 0.2) {
    warnings.push(colors.yellow('Medium risk: Significant portion of supply held by a single address.'));
  } else {
    warnings.push(colors.green('Low risk: Well-distributed token supply.'));
  }
  
  const totalLiquidity = totalBaseLiquidity + totalQuoteLiquidity;
  if (totalLiquidity < 100000) {
    warnings.push(colors.red('High risk: Low total liquidity.'));
  } else if (totalLiquidity < 1000000) {
    warnings.push(colors.yellow('Medium risk: Moderate total liquidity.'));
  } else {
    warnings.push(colors.green('Low risk: High total liquidity.'));
  }

  return warnings;
}

async function main() {
  const metadata = await getTokenMetadata(contractAddress);

  const pairs = await getLiquidityPairs(contractAddress.toString());
  const totalPairs = pairs.length;
  let totalBaseLiquidity = 0;
  let totalQuoteLiquidity = 0;

  pairs.forEach((pair) => {
    if (pair.baseMintAddress == contractAddress)
      totalBaseLiquidity += pair.baseTokenLiquidity;
    else if (pair.quoteMintAddress == contractAddress)
      totalQuoteLiquidity += pair.quoteTokenLiquidity;
  });

  console.log("\n\n############## Token Metadata ##############");
  console.log("Name: ", metadata.name);
  console.log("Symbol: ", metadata.symbol);
  console.log(
    "Token Supply: ",
    new BN(metadata.tokenSupply)
      .div(new BN(10).pow(metadata.decimals))
      .toFixed()
  );
  console.log("Decimals: ", metadata.decimals);

  console.log("\n\n############## Token Authorities ##############");
  console.log("Mint Authority: ", metadata.mintAuthority);
  console.log("Freeze Authority: ", metadata.freezeAuthority);
  console.log("Update Authority: ", metadata.updateAuthority);

  console.log("\n\n############## Top 20 Holders ##############");
  for (const accountIdx in metadata.largestHolders) {
    if (Object.prototype.hasOwnProperty.call(metadata.largestHolders, accountIdx)) {
      const holder = metadata.largestHolders[accountIdx];
      console.log(`${holder.address} : ${holder.amount}`)
    }
  } 
  console.log("\n\n############## Liquidity ##############");
  console.log("Total Number of Pairs:", totalPairs);
  console.log("Total Base Liquidity:", totalBaseLiquidity);
  console.log('Total Quote Liquidity:', totalQuoteLiquidity);

  const warnings = analyzeRisks(metadata, totalPairs, totalBaseLiquidity, totalQuoteLiquidity);
  console.log("\n\n############## Risk Analysis ##############");
  warnings.forEach((warning) => console.log(warning));
}

main().catch((err) => {
  console.error(err);
});

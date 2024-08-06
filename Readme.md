# Rug Pull Contract Analysis in Solana

This script analyzes the metadata, top holders, and liquidity of a Solana token to assess potential risks, such as centralization of authority, holder concentration, and liquidity. 

## Requirements

- Node.js v18.18.2
- NPM or Yarn

## Installation

1. Open folder in Terminal

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add your Solana RPC URL and contract address to the `.env` file:
     ```env
     RPC_URL=https://your-rpc-url
     CONTRACT_ADDRESS=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
     ```

## Usage

1. Ensure your `.env` file is properly configured with your Solana RPC URL and the contract address of the token you want to analyze.

2. Run the script:
   ```bash
   node rug-pull.js
   ```

## Output

The script will output the following information:

1. Token Metadata:
   - Name
   - Symbol
   - Token Supply
   - Decimals

2. Token Authorities:
   - Mint Authority
   - Freeze Authority
   - Update Authority

3. Top 20 Holders:
   - List of the top 20 holders' addresses and their respective token amounts

4. Liquidity:
   - Total Number of Pairs
   - Total Base Liquidity
   - Total Quote Liquidity

5. Risk Analysis:
   - Highlights potential risks with color-coded warnings (green for low risk, yellow for medium risk, red for high risk)

## Example Output

```
############## Token Metadata ##############
Name:  USDT
Symbol:  USDT
Token Supply:  1889938214.23102
Decimals:  6

############## Token Authorities ##############
Mint Authority:  Q6XprfkF8RQQKoQVG33xT88H7wi8Uk1B1CC7YAs69Gi
Freeze Authority:  Q6XprfkF8RQQKoQVG33xT88H7wi8Uk1B1CC7YAs69Gi
Update Authority:  Q6XprfkF8RQQKoQVG33xT88H7wi8Uk1B1CC7YAs69Gi

############## Top 20 Holders ##############
99pfYkuFEUPvUzVSGsMc2VN47FaFSTrKBMXGnxg13tDt : 1167780977.972721
...

############## Liquidity ##############
Total Number of Pairs: 902
Total Base Liquidity: 99198.56627100002
Total Quote Liquidity: 1949519.055103

############## Risk Analysis ##############
High risk: Centralized control over minting, freezing, and updating.
High risk: Over 50% of supply held by a single address.
High risk: Low total liquidity.
```
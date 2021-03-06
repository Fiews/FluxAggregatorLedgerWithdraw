# FluxAggregator Ledger Withdraw script

This script will help you automatically withdraw from FluxAggregator contracts using a Ledger hardware wallet.

The script will query the withdrawable amount for the node address on the list of FluxAggregator contracts provided. If there's a LINK balance, it will prompt to withdraw. A transaction proposal is made to withdraw the full amount from node address to the Ledger's PATH address (admin address).

***Note:** This script is only meant as a helper. Maintain proper security on your system and always review the transactions before approving.*

## Configuration

Before starting, a set of environment variables has to be set:

| Env var         | Description |
|-----------------|-------------|
| `RPC_URL`       | An HTTP(s) RPC URL for yourEthereum node. Infura works fine for this. |
| `LEDGER_PATH`   | Your Ledger path for your account with the address index appended (e.g. `m/44'/60'/0'/0/0`) |
| `NODE_ADDRESS`  | The node address in the FluxAggregator contracts. This is the address that writes results to the FA contract. |
| `GAS_PRICE`     | Gas price in Gwei. Max value is 250. Defaults to 50. |

You also need to create a `contracts.txt` file with a list of FluxAggregator contracts to use. Place one address per line.

## Running

Install dependencies with yarn:

```bash
yarn
```

Make sure your Ledger HW wallet is connected, unlocked and the Ethereum application is started.

**Always verify the transaction params before approving the transaction!**

Simply run the script with Node:

```bash
node ./index.js
```

_Note: If you are getting errors about not being able to connect to the device, try running with sudo: `sudo -E node ./index.js`_

The script will now check the withdrawable amounts in the FluxAggregator contracts, and prompt you to withdraw!

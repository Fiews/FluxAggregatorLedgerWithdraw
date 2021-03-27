const DEFAULT_RPC_URL = 'https://mainnet.infura.io/v3/'
const DEFAULT_CHAIN_ID = 1

const ABI = [
    'function withdrawablePayment(address) external view returns (uint256)',
    'function withdrawPayment(address,address,uint256) external'
]

const ethers = require('ethers')
const fs = require('fs').promises
const readline = require('readline')

const CHAIN_ID = process.env.CHAIN_ID || DEFAULT_CHAIN_ID
const RPC_URL = process.env.RPC_URL || DEFAULT_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const NODE_ADDRESS = process.env.NODE_ADDRESS

const main = async () => {
    console.log(`RPC_URL=${RPC_URL}`)
    console.log(`CHAIN_ID=${CHAIN_ID}`)

    const flux_array = (await fs.readFile('contracts.txt', 'utf8')).split('\n')

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL, CHAIN_ID)
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider)
    console.log(`Using address ${wallet.address}`)

    let nonce = await provider.getTransactionCount(wallet.address)

    for (const v of flux_array) {
        if (v.length === 0) continue

        const contract = new ethers.Contract(v, ABI, wallet)
        const result = await contract.withdrawablePayment(NODE_ADDRESS)
        console.log(`${v} withdrawable: ${ethers.utils.formatEther(result)} LINK`)
        if (result / 1e18 < 1) {
            console.log('Balance under 1 LINK, skipping...')
            continue
        }
        console.log('Withdrawing...')
        const confirmation = await confirm()
        if (!confirmation) {
            console.log('Skipping this contract...')
            continue
        }

        const tx = await contract.withdrawPayment(NODE_ADDRESS, wallet.address, result, {
            nonce
        })
        console.log(`Sent withdraw request with tx hash ${tx.transactionHash}`)

        nonce++
    }
}

const confirm = async () => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface(process.stdin, process.stdout)
        rl.question('Are you sure? Y/n: ', (input) => {
            if (input === "" || input.toLowerCase() === "y") {
                resolve(true)
            } else {
                resolve(false)
            }
            rl.close()
        })
    })
}

main().then()

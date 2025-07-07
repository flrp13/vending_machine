import * as readline from 'node:readline/promises'
import { create_init_state } from './init_state.js'
import { calculate_inserted_sum, is_valid_coin } from './utils.js'

const rl = readline.createInterface(process.stdin, process.stdout)

export const STATES = {
    IDLE: 'idle',
    RECEIVING_COINS: 'receiving_coins'
}

const EVENTS = {
    COIN_INSERTED: 'coin_inserted',
    RESET_MACHINE: 'reset_machine',
    CANCEL_PRESSED: 'cancel_pressed',
    PRODUCT_SELECTED: 'product_selected'
}

let machine_state = create_init_state()

async function main() {
    console.log('Welcome!')
    show_menu()

    while (1) {
        const input = await rl.question('Available commands: coin, product, cancel, reset, menu, quit\nAvailable products: Coke, Pepsi, Water\nAccepted coins: 0.05, 0.10, 0.20, 0.50, 1.00, 2.00\n> ')

        if (input == 'quit') {
            break
        } else if (input == 'menu') {
            show_menu()
        } else if (input == 'cancel') {
            process_event(EVENTS.CANCEL_PRESSED, {})
        } else if (input == 'reset') {
            process_event(EVENTS.RESET_MACHINE, {})
        } else if (input.startsWith('coin ')) {
            const amount = parseFloat(input.split(' ')[1])
            process_event(EVENTS.COIN_INSERTED, { amount })
        } else if (input.startsWith('product ')) {
            const product_id = input.split(' ')[1].toLowerCase()
            process_event(EVENTS.PRODUCT_SELECTED, { product_id })
        } else {
            console.log('Invalid command. Use: coin <amount>, product <id>, cancel, reset, menu, quit')
            console.log('Valid coins: 0.05, 0.10, 0.20, 0.50, 1.00, 2.00')
            console.log('Valid products: coke, pepsi, water')
        }
    }

    rl.close()
}

function handle_idle_state(event, data) {
    switch (event) {
        case EVENTS.COIN_INSERTED:
            if (is_valid_coin(data.amount)) {
                machine_state.current_transaction.coins_inserted[data.amount]++
                machine_state.inventory.coins[data.amount]++
                transition_to(STATES.RECEIVING_COINS)
            } else {
                console.log('Invalid coin rejected')
            }
            break
        case EVENTS.RESET_MACHINE:
            reset_machine()
            transition_to(STATES.IDLE)
            break
        default:
            console.log('Action not allowed')
    }
}

function handle_receiving_coins_state(event, data) {
    switch (event) {
        case EVENTS.COIN_INSERTED:
            if (is_valid_coin(data.amount)) {
                machine_state.current_transaction.coins_inserted[data.amount]++
                machine_state.inventory.coins[data.amount]++
            } else {
                console.log('Invalid coin rejected')
            }
            break
        case EVENTS.PRODUCT_SELECTED:
            if (can_dispense_product(data.product_id)) {
                dispense_product(data.product_id)
                transition_to(STATES.IDLE)
            } else {
                console.log('Cannot dispense product')
            }
            break
        case EVENTS.CANCEL_PRESSED:
            refund()
            transition_to(STATES.IDLE)
            break
        default:
            console.log('Action not allowed')
    }
}

function show_menu() {
    console.log(`Money inserted: ${calculate_inserted_sum(machine_state.current_transaction.coins_inserted)}`)
    console.log()

    console.log('Products')
    Object.entries(machine_state.inventory.products).forEach(([_, prod]) => console.log(`   ${prod.name} - ${prod.price} (${prod.quantity} left)`))
    console.log()
}

function refund() {
    console.log('You were refunded: ')

    Object.entries(machine_state.current_transaction.coins_inserted).forEach(([k, v]) => {
        if (v > 0) {
            console.log(`${v} coin(s): ${k}`)
            machine_state.current_transaction.coins_inserted[k] = 0
        }
    })
}

function can_dispense_product(product_id) {
    const product = machine_state.inventory.products[product_id]
    if (!product || product.quantity <= 0) {
        return false
    }

    const total_inserted = calculate_inserted_sum(machine_state.current_transaction.coins_inserted)
    return total_inserted >= product.price
}

function dispense_product(product_id) {
    console.log('Received:', machine_state.inventory.products[product_id].name)
    machine_state.inventory.products[product_id].quantity--
    const change = calculate_change(product_id)
    Object.keys(machine_state.current_transaction.coins_inserted).forEach(coin => machine_state.current_transaction.coins_inserted[coin] = 0)

    if (change === null) {
        console.log('No coins for change')
        return
    }

    if (change == -1) {
        console.log('Exact amount paid, no change to return')
        return
    }

    console.log(`Received change: ${change}`)
}

function calculate_change(product_id) {
    const total_inserted = calculate_inserted_sum(machine_state.current_transaction.coins_inserted)
    const product_price = machine_state.inventory.products[product_id].price

    if (total_inserted == product_price)
        return -1

    const diff = total_inserted - product_price
    let working_diff = diff
    const available_coins = Object.entries(machine_state.inventory.coins).filter(([_, v]) => (v > 0)).sort((a, b) => b[0] - a[0])

    let i = 0
    while (i < available_coins.length) {

        if (available_coins[i][1] == 0 || parseFloat(available_coins[i][0]) > working_diff) {
            i++
            continue
        }

        available_coins[i][1]--
        machine_state.inventory.coins[available_coins[i][0]]-- //explain this
        working_diff -= parseFloat(available_coins[i][0])
    }

    return diff == working_diff ? null : working_diff == 0 ? diff : diff - working_diff
}

function reset_machine() {
    machine_state = create_init_state()
}

function transition_to(new_state) {
    machine_state.current_state = new_state
}

function process_event(event, data) {
    switch (machine_state.current_state) {
        case STATES.IDLE:
            handle_idle_state(event, data)
            break
        case STATES.RECEIVING_COINS:
            handle_receiving_coins_state(event, data)
            break
        default:
            console.log('Something went wrong!')
    }
}

await main()
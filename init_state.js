import { STATES } from './index.js'

export function create_init_state() {
    return {
        current_state: STATES.IDLE,
        current_transaction: {
            coins_inserted: {
                0.05: 0,
                0.10: 0,
                0.20: 0,
                0.50: 0,
                1.00: 0,
                2.00: 0
            },
            selected_product: null,
            change: 0.00
        },
        inventory: {
            products: {
                coke: { name: 'Coke', price: 1.50, quantity: 10 },
                pepsi: { name: 'Pepsi', price: 1.45, quantity: 10 },
                water: { name: 'Water', price: 0.90, quantity: 10 }
            },
            coins: {
                0.05: 0,
                0.10: 0,
                0.20: 0,
                0.50: 0,
                1.00: 0,
                2.00: 0
            }
        }
    }
}
export function calculate_inserted_sum(coins) {
    let total = 0
    for (const [k, v] of Object.entries(coins)) {
        total += k * v
    }
    return total
}

export function is_valid_coin(coin) {
    return [0.05, 0.10, 0.20, 0.50, 1.00, 2.00].includes(coin)
}
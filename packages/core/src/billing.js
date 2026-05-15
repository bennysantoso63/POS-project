// Pure JS — zero Electron/React Native dependency
// Digunakan oleh KEDUA platform

/**
 * Hitung total retail dengan pembulatan opsional
 */
function calculateRetailBill(cartItems, roundingMode = 'none') {
    const subtotal = cartItems.reduce((sum, item) => {
        return sum + (item.price * item.qty);
    }, 0);

    return {
        subtotal,
        grandTotal: applyRounding(subtotal, roundingMode),
        roundingAmount: applyRounding(subtotal, roundingMode) - subtotal,
    };
}

/**
 * Hitung total F&B dengan PB1 dan service charge
 */
function calculateFnBBill(orderItems, settings = {}) {
    const {
        pb1Rate = 10,
        serviceChargeRate = 5,
        serviceIsTaxable = true,
        roundingMode = 'none',
    } = settings;

    const activeItems = orderItems.filter(i => i.status !== 'void');
    const subtotal = activeItems.reduce((sum, i) => sum + (i.qty * i.unit_price), 0);

    const serviceAmount = Math.round(subtotal * serviceChargeRate / 100);
    const pb1Base = serviceIsTaxable ? subtotal + serviceAmount : subtotal;
    const pb1Amount = Math.round(pb1Base * pb1Rate / 100);
    const preRounding = subtotal + serviceAmount + pb1Amount;
    const grandTotal = applyRounding(preRounding, roundingMode);

    return {
        subtotal,
        serviceAmount,
        pb1Amount,
        roundingAmount: grandTotal - preRounding,
        grandTotal,
    };
}

/**
 * Pembulatan nominal
 */
function applyRounding(amount, mode) {
    switch (mode) {
        case 'hundreds'     : return Math.ceil(amount / 100) * 100;
        case 'five_hundreds': return Math.ceil(amount / 500) * 500;
        case 'thousands'    : return Math.ceil(amount / 1000) * 1000;
        default             : return amount;
    }
}

/**
 * Saran nominal uang (Quick Cash)
 */
function suggestCashAmounts(total) {
    const suggestions = new Set([total]);
    const denominations = [2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
    denominations.forEach(d => {
        const s = Math.ceil(total / d) * d;
        if (s <= total * 2) suggestions.add(s);
    });
    return [...suggestions].sort((a, b) => a - b).slice(0, 5);
}

module.exports = {
    calculateRetailBill,
    calculateFnBBill,
    applyRounding,
    suggestCashAmounts,
};

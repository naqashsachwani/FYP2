// utils/escrowMath.js

export function calculateRefundSplit(totalAmount) {
    if (totalAmount <= 0) {
        return { userRefund: 0, adminFee: 0, storeCompensation: 0 };
    }

    return {
        userRefund: totalAmount * 0.80,       // User gets 80% back
        adminFee: totalAmount * 0.10,         // Admin keeps 10%
        storeCompensation: totalAmount * 0.10 // Store gets 10% for the hassle
    };
}
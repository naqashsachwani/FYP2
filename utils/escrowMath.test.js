// utils/escrowMath.test.js
import { calculateRefundSplit } from './escrowMath';

describe('Escrow Refund Math', () => {
    
    it('should correctly split a 1000 Rs refund (80/10/10)', () => {
        const result = calculateRefundSplit(1000);
        
        // We EXPECT the math to equal these exact numbers
        expect(result.userRefund).toBe(800);
        expect(result.adminFee).toBe(100);
        expect(result.storeCompensation).toBe(100);
    });

    it('should return zeros if the amount is 0 or negative', () => {
        const result = calculateRefundSplit(-500);
        
        expect(result.userRefund).toBe(0);
        expect(result.adminFee).toBe(0);
    });

});
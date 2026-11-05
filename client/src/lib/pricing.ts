/**
 * Pricing calculation utility for StudioSpace studio bookings and invoices.
 */

export interface BookingPriceBreakdown {
  hours: number;
  hourlyRate: number;
  hourlySubtotal: number;
  securityDeposit: number;
  grandTotal: number;
}

export function calculateBookingTotals(
  hourlyRate: number,
  securityDeposit: number,
  startTime: number,
  endTime: number
): BookingPriceBreakdown {
  const hours = Math.max(0, endTime - startTime);
  const rate = Number(hourlyRate || 0);
  const deposit = Number(securityDeposit || 0);
  const hourlySubtotal = hours * rate;
  const grandTotal = hours > 0 ? hourlySubtotal + deposit : 0;

  return {
    hours,
    hourlyRate: rate,
    hourlySubtotal,
    securityDeposit: deposit,
    grandTotal,
  };
}


// ============================================
// ChainX Escrow Business Logic
// ============================================
// Pure functions for computing platform fees, TDS, GST, and payouts.
// Kept stateless so they're easy to unit-test.

// All amounts in PAISE to avoid floating-point errors.
// ₹100 = 10000 paise.

export const PLATFORM_FEE_PERCENT = Number(process.env.CHAINX_PLATFORM_FEE_PERCENT ?? 4)
export const TDS_PERCENT = Number(process.env.CHAINX_TDS_PERCENT ?? 1)
export const GST_PERCENT = Number(process.env.CHAINX_GST_PERCENT ?? 18)

export interface EscrowBreakdown {
  // Inputs
  totalWageBudgetPaise: number   // What contractor wants workers to receive (gross)

  // Computed
  platformFeePaise: number       // ChainX fee on the wage budget
  gstOnFeePaise: number          // 18% GST on platform fee
  totalContractorPaysPaise: number  // = wage budget + fee + gst
  tdsTotalPaise: number          // 1% TDS on total wage budget
  netWorkerPayoutPaise: number   // wage budget − TDS (what workers actually receive total)
}

/**
 * Compute the full escrow breakdown given a wage budget.
 *
 * Example: ₹10,000 wage budget
 *   Platform fee (4%):     ₹400
 *   GST on fee (18%):       ₹72
 *   Contractor pays:    ₹10,472
 *   TDS (1% of wages):     ₹100
 *   Workers get:         ₹9,900
 *   ChainX retains:        ₹472
 *   Govt receives:         ₹100
 */
export function computeEscrowBreakdown(totalWageBudgetPaise: number): EscrowBreakdown {
  if (totalWageBudgetPaise <= 0 || !Number.isFinite(totalWageBudgetPaise)) {
    throw new Error("Wage budget must be a positive number")
  }

  const platformFeePaise = Math.round((totalWageBudgetPaise * PLATFORM_FEE_PERCENT) / 100)
  const gstOnFeePaise = Math.round((platformFeePaise * GST_PERCENT) / 100)
  const totalContractorPaysPaise = totalWageBudgetPaise + platformFeePaise + gstOnFeePaise
  const tdsTotalPaise = Math.round((totalWageBudgetPaise * TDS_PERCENT) / 100)
  const netWorkerPayoutPaise = totalWageBudgetPaise - tdsTotalPaise

  return {
    totalWageBudgetPaise,
    platformFeePaise,
    gstOnFeePaise,
    totalContractorPaysPaise,
    tdsTotalPaise,
    netWorkerPayoutPaise,
  }
}

/**
 * Split a worker's individual share into gross / TDS / net.
 * Used when releasing payment to a specific worker after job completion.
 */
export interface WorkerSplit {
  grossPaise: number
  tdsPaise: number
  netPaise: number
}

export function computeWorkerSplit(grossWagePaise: number): WorkerSplit {
  if (grossWagePaise <= 0) throw new Error("Worker gross must be positive")
  const tdsPaise = Math.round((grossWagePaise * TDS_PERCENT) / 100)
  return {
    grossPaise: grossWagePaise,
    tdsPaise,
    netPaise: grossWagePaise - tdsPaise,
  }
}

/**
 * Compute GST split: CGST + SGST (same state) or IGST (inter-state).
 * Contractor's state vs ChainX's state (set in env).
 */
export interface GstSplit {
  cgstPaise: number
  sgstPaise: number
  igstPaise: number
  isInterState: boolean
}

const CHAINX_STATE = process.env.CHAINX_REGISTERED_STATE ?? "Madhya Pradesh"

export function computeGstSplit(feePaise: number, contractorState?: string | null): GstSplit {
  const totalGst = Math.round((feePaise * GST_PERCENT) / 100)
  const isInterState =
    contractorState != null && contractorState.trim() !== "" && contractorState !== CHAINX_STATE

  if (isInterState) {
    return { cgstPaise: 0, sgstPaise: 0, igstPaise: totalGst, isInterState: true }
  }

  // Same state: split 9% CGST + 9% SGST
  const half = Math.round(totalGst / 2)
  return {
    cgstPaise: half,
    sgstPaise: totalGst - half,  // handles odd-paise rounding
    igstPaise: 0,
    isInterState: false,
  }
}

/**
 * Format paise as ₹X,XX,XXX.XX (Indian numbering).
 */
export function formatRupees(paise: number): string {
  const rupees = paise / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees)
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

export function paiseToRupees(paise: number): number {
  return paise / 100
}

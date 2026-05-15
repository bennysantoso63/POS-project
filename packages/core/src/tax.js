// Pure tax calculations — zero platform dependency

/**
 * Hitung PPh Final UMKM
 * @param {number} omzetYTD - Total omzet tahun ini
 * @param {number} taxFreeThreshold - Rp500jt untuk OP, 0 untuk badan
 * @returns {object} tax calculation result
 */
function calculatePPhFinal(omzetYTD, taxFreeThreshold = 500000000) {
    const omzetKenaPajak = Math.max(0, omzetYTD - taxFreeThreshold);
    const pphEstimate = Math.floor(omzetKenaPajak * 0.005);

    let status;
    if (omzetYTD < taxFreeThreshold)       status = 'tax_free';
    else if (omzetYTD < 4800000000 * 0.75) status = 'normal';
    else if (omzetYTD < 4800000000 * 0.90) status = 'warning';
    else if (omzetYTD < 4800000000)        status = 'danger';
    else                                    status = 'pkp_alert';

    return {
        omzetYTD,
        omzetKenaPajak,
        pphEstimate,
        sisaThreshold: 4800000000 - omzetYTD,
        progressPct: Math.round(omzetYTD * 100 / 4800000000 * 10) / 10,
        status,
    };
}

/**
 * Cek tax maturity (batas waktu tarif 0.5%)
 */
function checkTaxMaturity(startYear, durationYears, currentYear) {
    const yearsUsed = currentYear - startYear;
    const yearsRemaining = durationYears - yearsUsed;

    if (yearsRemaining <= 0) return { status: 'time_expired', yearsRemaining: 0 };
    if (yearsRemaining === 1) return { status: 'time_warning', yearsRemaining: 1 };
    return { status: 'time_ok', yearsRemaining };
}

module.exports = { calculatePPhFinal, checkTaxMaturity };

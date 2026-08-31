/**
 * Credit Parsing & Formatting Utility
 *
 * Handles parsing and validation of academic course credit strings such as:
 * - "3(2,1)" -> Total: 3, Theory: 2, Lab: 1
 * - "4(3,1)" -> Total: 4, Theory: 3, Lab: 1
 * - "3(3,0)" -> Total: 3, Theory: 3, Lab: 0
 * - "1(0,1)" -> Total: 1, Theory: 0, Lab: 1
 * - "3+1"    -> Total: 4, Theory: 3, Lab: 1
 * - 3        -> Total: 3, Theory: 3, Lab: 0 (default pure theory)
 */

class CreditParseError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'CreditParseError';
    this.details = details;
    this.statusCode = 400;
  }
}

/**
 * Parses credit representation into structured numerical values.
 *
 * @param {string|number|Object} input
 * @param {Object} [options]
 * @param {number} [options.labContactHourRatio=3.0] - Standard contact hours per lab credit (HEC standard: 1 lab credit = 3 contact hours)
 * @param {number} [options.theoryContactHourRatio=1.0] - Contact hours per theory credit (1 theory credit = 1 contact hour)
 * @returns {{
 *   isValid: boolean,
 *   totalCredits: number,
 *   theoryCredits: number,
 *   labCredits: number,
 *   theoryContactHours: number,
 *   labContactHours: number,
 *   totalContactHours: number,
 *   courseType: 'theory'|'lab'|'hybrid',
 *   formattedString: string
 * }}
 */
const parseCreditString = (input, options = {}) => {
  const { labContactHourRatio = 3.0, theoryContactHourRatio = 1.0 } = options;

  if (input === undefined || input === null || input === '') {
    throw new CreditParseError('Credit specification is required and cannot be empty.');
  }

  // 1. If input is already an object containing explicit fields
  if (typeof input === 'object' && (input.theoryCredits !== undefined || input.theory_credit_hours !== undefined)) {
    const theory = Number(input.theoryCredits ?? input.theory_credit_hours ?? 0);
    const lab = Number(input.labCredits ?? input.lab_credit_hours ?? 0);
    const total = Number(input.totalCredits ?? input.total_credit_hours ?? (theory + lab));

    return assembleCreditResult(total, theory, lab, theoryContactHourRatio, labContactHourRatio);
  }

  // 2. If input is a raw number (e.g., 3)
  if (typeof input === 'number') {
    if (isNaN(input) || input < 0) {
      throw new CreditParseError(`Invalid credit number: ${input}. Must be non-negative.`);
    }
    return assembleCreditResult(input, input, 0, theoryContactHourRatio, labContactHourRatio);
  }

  const str = String(input).trim();

  // 3. Regex for standard notation: Total(Theory, Lab) e.g., "3(2,1)", "4 ( 3 , 1 )", "3(2-1)", "3(2/1)"
  const standardPattern = /^(\d+(?:\.\d+)?)\s*\(\s*(\d+(?:\.\d+)?)\s*[,/\\-]\s*(\d+(?:\.\d+)?)\s*\)$/;
  const match = str.match(standardPattern);

  if (match) {
    const total = parseFloat(match[1]);
    const theory = parseFloat(match[2]);
    const lab = parseFloat(match[3]);

    // Validation: Total must equal Theory + Lab
    const computedTotal = Number((theory + lab).toFixed(2));
    if (Math.abs(total - computedTotal) > 0.001) {
      throw new CreditParseError(
        `Credit mismatch in '${str}': Total credits (${total}) must equal sum of Theory (${theory}) and Lab (${lab}). Expected ${computedTotal}(${theory},${lab}).`,
        { parsedTotal: total, computedTotal, theory, lab }
      );
    }

    return assembleCreditResult(total, theory, lab, theoryContactHourRatio, labContactHourRatio);
  }

  // 4. Regex for addition notation: "3+1" -> Theory: 3, Lab: 1, Total: 4
  const additionPattern = /^(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)$/;
  const addMatch = str.match(additionPattern);
  if (addMatch) {
    const theory = parseFloat(addMatch[1]);
    const lab = parseFloat(addMatch[2]);
    const total = Number((theory + lab).toFixed(2));
    return assembleCreditResult(total, theory, lab, theoryContactHourRatio, labContactHourRatio);
  }

  // 5. Regex for single pure number string e.g., "3" or "3.0"
  const singleNumberPattern = /^(\d+(?:\.\d+)?)$/;
  const numMatch = str.match(singleNumberPattern);
  if (numMatch) {
    const total = parseFloat(numMatch[1]);
    return assembleCreditResult(total, total, 0, theoryContactHourRatio, labContactHourRatio);
  }

  throw new CreditParseError(
    `Unrecognized credit string format: '${str}'. Valid formats include '3(2,1)', '4(3,1)', '3(3,0)', '1(0,1)', '3+1', or '3'.`
  );
};

/**
 * Helper to build standard structured return object
 */
const assembleCreditResult = (total, theory, lab, theoryRatio, labRatio) => {
  const theoryCredits = Number(theory.toFixed(1));
  const labCredits = Number(lab.toFixed(1));
  const totalCredits = Number(total.toFixed(1));

  const theoryContactHours = Number((theoryCredits * theoryRatio).toFixed(1));
  const labContactHours = Number((labCredits * labRatio).toFixed(1));
  const totalContactHours = Number((theoryContactHours + labContactHours).toFixed(1));

  let courseType = 'theory';
  if (theoryCredits > 0 && labCredits > 0) {
    courseType = 'hybrid';
  } else if (theoryCredits === 0 && labCredits > 0) {
    courseType = 'lab';
  }

  const formattedString = `${totalCredits}(${theoryCredits},${labCredits})`;

  return {
    isValid: true,
    totalCredits,
    theoryCredits,
    labCredits,
    theoryContactHours,
    labContactHours,
    totalContactHours,
    courseType,
    formattedString,
  };
};

module.exports = {
  parseCreditString,
  CreditParseError,
};

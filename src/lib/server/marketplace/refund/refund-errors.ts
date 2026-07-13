export class RefundError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "RefundError";
    this.code = code;
  }
}

export class RefundNotFoundError extends RefundError {
  constructor(message = "درخواست بازپرداخت یافت نشد.") {
    super(message, "refund_not_found");
    this.name = "RefundNotFoundError";
  }
}

export class RefundIneligibleError extends RefundError {
  constructor(message = "سفارش واجد شرایط بازپرداخت نیست.") {
    super(message, "refund_ineligible");
    this.name = "RefundIneligibleError";
  }
}

export class RefundAmountError extends RefundError {
  constructor(message = "مبلغ بازپرداخت نامعتبر است.") {
    super(message, "refund_invalid_amount");
    this.name = "RefundAmountError";
  }
}

export class RefundConflictError extends RefundError {
  constructor(message = "وضعیت درخواست بازپرداخت تغییر کرده است.") {
    super(message, "refund_conflict");
    this.name = "RefundConflictError";
  }
}

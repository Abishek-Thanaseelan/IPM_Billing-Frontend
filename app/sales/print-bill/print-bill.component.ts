import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-print-bill',
  templateUrl: './print-bill.component.html',
  styleUrls: ['./print-bill.component.css']
})
export class PrintBillComponent implements OnChanges  {

  amountInWords: string = '';
  localSalesList: any[] = [];

  @Input() companyName: string = '';
  @Input() companyAddress: string = '';
  @Input() companyGST: string = '';
  @Input() companyState: string = '';
  @Input() companyPhone: string = '';
  @Input() companyEmail: string = '';

  @Input() billNo: string = '';
  @Input() billDate: any = '';
  @Input() salesPerson: string = '';

  @Input() customerName: string = '';
  @Input() customerPhone: string = '';
  @Input() customerGST: string = '';
  @Input() customerState: string = '';
  @Input() receivedAmount: number = 0;
  @Input() balanceAmount: number = 0;

  @Input() salesList: any[] = [];

isZeroGst(size: any): boolean {

  if (size === null || size === undefined) {
    return false;
  }

  const value = String(size)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

  return value === '26' || value === '26kg';
}

  getTotalAmount(): number {
    let total = 0;
    this.localSalesList.forEach((item: any) => {
      total += Number(item.netAmount || 0);
    });
    return total;
  }

  getTotalTaxableAmount(): number {
    let total = 0;
    this.localSalesList.forEach((item: any) => {
      total += Number(item.taxableRate || 0) * Number(item.qty || 0);
    });
    return total;
  }

  getTotalGstAmount(): number {
    let total = 0;
    this.localSalesList.forEach((item: any) => {
      total += Number(item.gstAmount || 0);
    });
    return total;
  }

  ngOnChanges() {
    this.localSalesList = [...this.salesList];
    this.recalculateInvoiceItems();
  }

  recalculateInvoiceItems() {
    this.localSalesList = this.localSalesList.map((p: any) => {
      const price = Number(p.rate || 0);
      const qty = Number(p.qty || 1);
      const totalPrice = price * qty;

      if (this.isZeroGst(p.productSize)) {
        return {
          ...p,
          gstPercent: 0,
          taxableRate: price,
          gstAmount: 0,
          netAmount: totalPrice
        };
      }

      const gstRate = 0.05;
      const taxableRate = price / (1 + gstRate);
      const gstAmount = (price - taxableRate) * qty;

      return {
        ...p,
        gstPercent: 5,
        taxableRate: taxableRate,
        gstAmount: gstAmount,
        netAmount: totalPrice
      };
    });
  }

  convertNumberToWords(num: number): string {
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five',
      'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
      'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];

    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty',
      'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    const convertBelowThousand = (n: number): string => {
      let str = '';
      if (n >= 100) {
        str += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += ones[n] + ' ';
      }
      return str.trim();
    };

    if (num === 0) return 'Zero';

    let result = '';
    if (num >= 100000) {
      result += convertBelowThousand(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      result += convertBelowThousand(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    if (num > 0) {
      result += convertBelowThousand(num);
    }
    return result.trim();
  }
}

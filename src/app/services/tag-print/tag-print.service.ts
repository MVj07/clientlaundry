import { Injectable } from '@angular/core';

export interface ThermalTagSettings {
  paperSize: '58mm' | '80mm' | '50x30mm' | 'A4';
  autoShowModalOnOrderCreate: boolean;
  showBarcode: boolean;
  showShopName: boolean;
  showKuriNo: boolean;
  showCustomerMobile: boolean;
  showDueDate: boolean;
  showInstructions: boolean;
  copiesPerPiece: number;
}

@Injectable({
  providedIn: 'root'
})
export class TagPrintService {
  private storageKey = 'thermal_tag_settings';

  constructor() {}

  getSettings(): ThermalTagSettings {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing thermal tag settings', e);
      }
    }
    return {
      paperSize: '58mm',
      autoShowModalOnOrderCreate: true,
      showBarcode: true,
      showShopName: true,
      showKuriNo: true,
      showCustomerMobile: true,
      showDueDate: true,
      showInstructions: true,
      copiesPerPiece: 1
    };
  }

  saveSettings(settings: ThermalTagSettings): void {
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
  }

  generateBarcodeSvg(text: string, height: number = 30): string {
    if (!text) return '';
    const code128CharData = [
      "11011001100", "11001101100", "11001100110", "10010011000", "10010001100", "10001001100", "10011001000",
      "10011000100", "10001100100", "11001001000", "11001000100", "11000100100", "10110011100", "10011011100",
      "10011001110", "10111001100", "10011101100", "10011100110", "11001110010", "11001011100", "11001001110",
      "11011100100", "11001110100", "11101101110", "11101001100", "11100101100", "11100100110", "11101100100",
      "11100110100", "11100110010", "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
      "10001000110", "10110001000", "10001101000", "10001100010", "11010001000", "11000101000", "11000100010",
      "10110111000", "10110001110", "10001101110", "10111011000", "10111000110", "10001110110", "11101110110",
      "11010001110", "11000101110", "11011101000", "11011100010", "11011101110", "11101011000", "11101000110",
      "11100010110", "11101101000", "11101100010", "11100011010", "11101111010", "11001000010", "11110001010",
      "10100110000", "10100001100", "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
      "10110000100", "10011010000", "10011000010", "10000110100", "10000110010", "11000010010", "11001010000",
      "11110111010", "11000010100", "10001111010", "10100111100", "10010111100", "10010011110", "10111100100",
      "10011110100", "10011110010", "11110100100", "11110010100", "11110010010", "11011011110", "11011110110",
      "11110110110", "10101111000", "10100011110", "10001011110", "10111101000", "10111100010", "11110101000",
      "11110100010", "10111011110", "10111101110", "11101011110", "11110101110", "11010000100", "11010010000",
      "11010011100", "1100011101011"
    ];

    let pattern = "11010010000";
    let checkSum = 104;

    for (let i = 0; i < text.length; i++) {
      let code = text.charCodeAt(i) - 32;
      if (code < 0 || code > 95) code = 0;
      pattern += code128CharData[code];
      checkSum += code * (i + 1);
    }

    const checkDigit = checkSum % 103;
    pattern += code128CharData[checkDigit];
    pattern += code128CharData[106];

    let svgBars = "";
    let x = 0;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === "1") {
        let width = 1;
        while (i + 1 < pattern.length && pattern[i + 1] === "1") {
          width++;
          i++;
        }
        svgBars += `<rect x="${x}" y="0" width="${width}" height="${height}" fill="#000" />`;
        x += width;
      } else {
        x++;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${height}" preserveAspectRatio="none" style="width: 100%; height: ${height}px; display: block;">${svgBars}</svg>`;
  }

  getPiecesList(order: any, copies: number = 1): any[] {
    const pieces: any[] = [];
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const qty = parseInt(item.qty) || 1;
        for (let q = 1; q <= qty; q++) {
          for (let c = 0; c < copies; c++) {
            pieces.push({
              name: item.name,
              indexInItem: q,
              itemTotalQty: qty
            });
          }
        }
      });
    } else {
      for (let c = 0; c < copies; c++) {
        pieces.push({
          name: order.type === 'kg' ? 'Clothes (Kg)' : 'Garments',
          indexInItem: 1,
          itemTotalQty: 1
        });
      }
    }
    return pieces;
  }

  printGarmentTags(order: any, business: any, customSettings?: Partial<ThermalTagSettings>): void {
    const settings = { ...this.getSettings(), ...customSettings };
    const paperSize = settings.paperSize;
    const showBarcode = settings.showBarcode;
    const showShopName = settings.showShopName;
    const showKuri = settings.showKuriNo;
    const showMobile = settings.showCustomerMobile;
    const showDueDate = settings.showDueDate;
    const showInstructions = settings.showInstructions;

    const pieces = this.getPiecesList(order, settings.copiesPerPiece || 1);
    const totalPieces = pieces.length / (settings.copiesPerPiece || 1);

    const kuriNo = order?.customerId?.kuri || order?.kuri || 'N/A';
    const customerName = order?.customerId?.name || order?.customerName || 'Customer';
    const customerMobile = order?.customerId?.mobile || order?.phoneNumber || '';
    const dueDateStr = order?.dueDate ? new Date(order.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const shopName = business?.business_name || 'LAUNDRY SERVICE';

    let widthCss = '58mm';
    let paddingCss = '8px';
    let fontSizeCss = '12px';

    if (paperSize === '80mm') {
      widthCss = '80mm';
      paddingCss = '12px';
      fontSizeCss = '14px';
    } else if (paperSize === '50x30mm') {
      widthCss = '50mm';
      paddingCss = '4px';
      fontSizeCss = '10px';
    } else if (paperSize === 'A4') {
      widthCss = '210mm';
      paddingCss = '15px';
      fontSizeCss = '12px';
    }

    const tagsHtml = pieces.map((piece, idx) => {
      const pieceNum = Math.floor(idx / (settings.copiesPerPiece || 1)) + 1;
      const barcodeSvg = showBarcode ? this.generateBarcodeSvg(order.bill || 'LDY-00000', paperSize === '50x30mm' ? 22 : 32) : '';

      return `
      <div class="tag-card">
        ${showShopName ? `<div class="tag-shop">${shopName}</div>` : ''}
        
        <div class="tag-header">
          ${showKuri ? `<div class="kuri-box">KURI #${kuriNo}</div>` : ''}
          <div class="piece-box">[ ${pieceNum} / ${totalPieces} ]</div>
        </div>

        <div class="item-name">${piece.name}</div>

        <div class="customer-info">
          <span class="cust-name">${customerName}</span>
          ${showMobile && customerMobile ? `<span class="cust-mobile">(${customerMobile})</span>` : ''}
        </div>

        <div class="meta-row">
          <span><b>Bill:</b> ${order.bill || 'N/A'}</span>
          ${showDueDate ? `<span><b>Due:</b> ${dueDateStr}</span>` : ''}
        </div>

        ${showInstructions && order.specialInstructions ? `
        <div class="tag-inst">⚡ ${order.specialInstructions}</div>
        ` : ''}

        ${showBarcode ? `
          <div class="barcode-wrap">
            ${barcodeSvg}
            <div class="barcode-text">${order.bill || ''}</div>
          </div>
        ` : ''}
      </div>
      `;
    }).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Print Garment Tags - ${order.bill || ''}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        @page {
          size: ${paperSize === 'A4' ? 'A4' : widthCss + ' auto'};
          margin: 0;
        }
        
        * { box-sizing: border-box; }
        
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: ${paperSize === 'A4' ? '20px' : '0'};
          color: #000;
          background: #fff;
          font-size: ${fontSizeCss};
          -webkit-print-color-adjust: exact;
          ${paperSize === 'A4' ? 'display: flex; flex-wrap: wrap; gap: 15px;' : ''}
        }
        
        .tag-card {
          width: ${paperSize === 'A4' ? '60mm' : widthCss};
          padding: ${paddingCss};
          border: ${paperSize === 'A4' ? '1px dashed #333' : 'none'};
          border-bottom: ${paperSize === 'A4' ? '1px dashed #333' : '2px dashed #000'};
          page-break-after: ${paperSize === 'A4' ? 'auto' : 'always'};
          break-after: ${paperSize === 'A4' ? 'auto' : 'page'};
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #fff;
        }
        
        .tag-shop {
          font-size: 11px;
          font-weight: 800;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #000;
          padding-bottom: 3px;
          margin-bottom: 2px;
        }
        
        .tag-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 4px;
        }
        
        .kuri-box {
          font-size: 16px;
          font-weight: 800;
          background: #000;
          color: #fff;
          padding: 2px 6px;
          border-radius: 4px;
          line-height: 1.1;
        }
        
        .piece-box {
          font-size: 14px;
          font-weight: 800;
          font-family: monospace;
        }
        
        .item-name {
          font-size: 15px;
          font-weight: 800;
          text-transform: uppercase;
          margin: 2px 0;
          line-height: 1.2;
        }
        
        .customer-info {
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .cust-name { font-weight: 800; }
        
        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          border-top: 1px dotted #666;
          padding-top: 3px;
          margin-top: 2px;
        }
        
        .tag-inst {
          font-size: 10px;
          font-weight: 700;
          color: #111;
          background: #f0f0f0;
          padding: 3px 5px;
          border-radius: 3px;
          margin-top: 2px;
        }
        
        .barcode-wrap {
          margin-top: 4px;
          text-align: center;
        }
        
        .barcode-text {
          font-size: 10px;
          font-weight: 700;
          font-family: monospace;
          letter-spacing: 1px;
          margin-top: 1px;
        }
      </style>
    </head>
    <body>
      ${tagsHtml}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
    `;

    const printWin = window.open('', '_blank', 'width=450,height=600');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
    } else {
      alert('Please allow popups to print garment tags.');
    }
  }

  printThermalReceipt(order: any, business: any, customSettings?: Partial<ThermalTagSettings>): void {
    const settings = { ...this.getSettings(), ...customSettings };
    const paperSize = settings.paperSize === '80mm' ? '80mm' : '58mm';
    let widthCss = paperSize;
    let paddingCss = '10px';
    let fontSizeCss = '11px';

    if (paperSize === '80mm') {
      paddingCss = '14px';
      fontSizeCss = '13px';
    }

    const itemsHTML = (order.items || []).map((i: any) => `
      <tr>
        <td style="padding: 3px 0; text-align: left;">${i.name}</td>
        <td style="padding: 3px 0; text-align: center;">${i.qty}</td>
        <td style="padding: 3px 0; text-align: right;">₹${Number(i.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 3px 0; text-align: right; font-weight: bold;">₹${Number(i.qty * i.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

    const itemsTotal = (order.items || []).reduce((a: number, b: any) => a + ((Number(b.qty) || 0) * (Number(b.amount) || 0)), 0);
    const deliveryCharge = Number(order.deliveryCharge || 0);
    const discount = Number(order.discount || 0);
    const total = itemsTotal + deliveryCharge - discount;
    const formattedDate = new Date(order.date || order.createdAt || new Date()).toLocaleDateString('en-IN', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const formattedDueDate = order.dueDate ? new Date(order.dueDate).toLocaleDateString('en-IN', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    }) : 'N/A';
    const customer = order.customerId || {};
    const barcodeSvg = this.generateBarcodeSvg(order.bill || 'LDY-00000', 30);

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Print Receipt - ${order.bill || ''}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @page { size: ${widthCss} auto; margin: 0; }
        * { box-sizing: border-box; }
        body { 
          font-family: 'Inter', sans-serif; 
          color: #000; margin: 0; padding: ${paddingCss}; 
          background: #fff; font-size: ${fontSizeCss}; width: ${widthCss};
          -webkit-print-color-adjust: exact;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .shop-title { font-size: 16px; font-weight: 800; text-align: center; text-transform: uppercase; margin-bottom: 2px; }
        .shop-sub { font-size: 10px; text-align: center; color: #333; margin-bottom: 6px; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .meta-table { width: 100%; font-size: 11px; }
        .meta-table td { padding: 1px 0; }
        .items-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px; }
        .items-table th { border-bottom: 1px solid #000; padding-bottom: 3px; text-align: left; font-weight: 700; }
        .total-table { width: 100%; font-size: 11px; margin-top: 4px; }
        .total-table td { padding: 2px 0; }
        .grand-total { font-size: 14px; font-weight: 800; border-top: 1px solid #000; border-bottom: 1px double #000; padding: 4px 0 !important; }
        .footer-msg { text-align: center; font-size: 10px; margin-top: 10px; color: #444; }
        .barcode-wrap { margin-top: 10px; text-align: center; }
        .barcode-text { font-size: 10px; font-weight: 700; font-family: monospace; letter-spacing: 1px; margin-top: 2px; }
      </style>
    </head>
    <body>
      <div class="shop-title">${business?.business_name || 'LAUNDRY SERVICE'}</div>
      <div class="shop-sub">
        ${business?.address ? `${business.address}<br>` : ''}
        ${business?.mobile ? `Ph: ${business.mobile}` : ''}
      </div>
      <div class="divider"></div>
      <table class="meta-table">
        <tr><td><b>Bill No:</b> ${order.bill || 'N/A'}</td><td class="text-right"><b>Date:</b> ${formattedDate.split(',')[0]}</td></tr>
        <tr><td><b>Customer:</b> ${customer?.name || order.customerName || 'N/A'}</td><td class="text-right"><b>Kuri: #${customer?.kuri || order?.kuri || 'N/A'}</b></td></tr>
        ${customer?.mobile ? `<tr><td colspan="2"><b>Mobile:</b> ${customer.mobile}</td></tr>` : ''}
        <tr><td colspan="2"><b>Due Date:</b> ${formattedDueDate}</td></tr>
      </table>
      <div class="divider"></div>
      <table class="items-table">
        <thead><tr><th>Item</th><th class="text-center">Qty</th><th class="text-right">Rate</th><th class="text-right">Amount</th></tr></thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <div class="divider"></div>
      <table class="total-table">
        <tr><td>Subtotal</td><td class="text-right">₹${Number(itemsTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
        ${deliveryCharge > 0 ? `<tr><td>Delivery Charge</td><td class="text-right">+₹${Number(deliveryCharge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
        ${discount > 0 ? `<tr><td>Discount</td><td class="text-right">-₹${Number(discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
        <tr class="grand-total"><td>GRAND TOTAL</td><td class="text-right">₹${Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
      </table>
      <div class="barcode-wrap">
        ${barcodeSvg}
        <div class="barcode-text">${order.bill || ''}</div>
      </div>
      <div class="footer-msg">Thank you for your visit!<br>Please bring this bill or kuri number at delivery.</div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 300);
        };
      </script>
    </body>
    </html>
    `;

    const printWin = window.open('', '_blank', 'width=400,height=600');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
    } else {
      alert('Please allow popups to print thermal receipt.');
    }
  }
}

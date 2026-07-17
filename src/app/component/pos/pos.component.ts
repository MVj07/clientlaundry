import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { HttpParams } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../../services/storage.service';
import { environment } from '../../../environments/environment';
import { BusinessService } from '../../services/business/business.service';
import { TagPrintService } from '../../services/tag-print/tag-print.service';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css'
})
export class PosComponent implements OnInit, OnDestroy {

  // Search panel
  searchTerm: string = '';
  searchResults: any[] = [];
  searching: boolean = false;
  isDefaultView: boolean = true;  // true when showing default unpaid orders list

  // Selected order & Payment Link state
  selectedOrder: any = null;
  paymentLinkUrl: string | null = null;
  paymentLinkId: string | null = null;
  generatingLink: boolean = false;
  linkCopied: boolean = false;
  paymentPollingInterval: any = null;


  // Payment form
  paymentForm!: FormGroup;
  processing: boolean = false;
  paymentDone: boolean = false;

  private apiUrl = environment.apiUrl;

  businessData: any = null;

  constructor(
    private fb: FormBuilder,
    private orderService: newOrderService,
    private toaster: ToastrService,
    private http: HttpClient,
    private storage: StorageService,
    private eRef: ElementRef,
    private businessService: BusinessService,
    public tagPrintService: TagPrintService
  ) { }

  ngOnInit(): void {
    this.businessService.getOne().subscribe({
      next: (res) => {
        this.businessData = res.data || res;
      },
      error: () => {}
    });

    this.paymentForm = this.fb.group({
      discount: [0, [Validators.min(0)]],
      paidAmount: [0, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['cash', Validators.required]
    });

    // When discount changes, auto-update paidAmount to full remaining
    this.paymentForm.get('discount')?.valueChanges.subscribe(() => {
      if (!this.selectedOrder) return;
      const discount = parseFloat(this.paymentForm.get('discount')?.value) || 0;
      const finalBill = (this.selectedOrder.billAmount || 0) - discount;
      this.paymentForm.get('paidAmount')?.setValue(finalBill > 0 ? finalBill : 0, { emitEvent: false });
    });

    // Load unpaid orders by default
    this.loadUnpaidOrders();
  }

  // Load all unpaid orders as default list on page open
  loadUnpaidOrders() {
    this.searching = true;
    this.isDefaultView = true;
    const token = this.storage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    this.http.get<any>(`${this.apiUrl}/order`, {
      headers,
      params: new HttpParams()
        .set('page', '1')
        .set('limit', '100')
        .set('paymentStatus', 'unpaid')
    }).subscribe({
      next: (res) => {
        this.searchResults = res.data || [];
        this.searching = false;
      },
      error: () => {
        this.searching = false;
      }
    });
  }


  // Search orders by Bill No, Customer Name, or Phone
  searchOrders() {
    const term = this.searchTerm.trim();
    if (!term) {
      // Reset to default unpaid orders view
      this.loadUnpaidOrders();
      return;
    }
    this.isDefaultView = false;
    this.searching = true;
    const token = this.storage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };

    // Try to find by bill no first, then by customer name/mobile
    this.http.get<any>(`${this.apiUrl}/order`, {
      headers,
      params: new HttpParams()
        .set('page', '1')
        .set('limit', '20')
        .set('customerName', term)
    }).subscribe({
      next: (res) => {
        let results = res.data || [];
        // Also search by mobile if term looks numeric
        if (/^\d+$/.test(term)) {
          this.http.get<any>(`${this.apiUrl}/order`, {
            headers,
            params: new HttpParams().set('page', '1').set('limit', '20').set('mobile', term)
          }).subscribe({
            next: (r2) => {
              const combined = [...results, ...(r2.data || [])];
              const unique = Array.from(new Map(combined.map(o => [o._id, o])).values());
              this.searchResults = unique;
              this.searching = false;
            },
            error: () => {
              this.searchResults = results;
              this.searching = false;
            }
          });
        } else {
          // Also search bill number
          this.http.get<any>(`${this.apiUrl}/order`, {
            headers,
            params: new HttpParams().set('page', '1').set('limit', '20').set('bill', term)
          }).subscribe({
            next: (r3) => {
              const combined = [...results, ...(r3.data || [])];
              const unique = Array.from(new Map(combined.map(o => [o._id, o])).values());
              this.searchResults = unique;
              this.searching = false;
            },
            error: () => {
              this.searchResults = results;
              this.searching = false;
            }
          });
        }
      },
      error: () => {
        this.searching = false;
        this.toaster.error('Search failed');
      }
    });
  }

  selectOrder(order: any) {
    if (this.paymentPollingInterval) {
      clearInterval(this.paymentPollingInterval);
      this.paymentPollingInterval = null;
    }
    this.selectedOrder = order;
    this.paymentDone = false;
    this.paymentLinkUrl = order.razorpayPaymentLinkUrl || null;
    this.paymentLinkId = order.razorpayPaymentLinkId || null;
    this.linkCopied = false;

    // Pre-fill paidAmount with current billAmount - existing discount
    const existingDiscount = order.discount || 0;
    const existingPaid = order.paidAmount || 0;
    const remaining = (order.billAmount - existingDiscount) - existingPaid;

    this.paymentForm.patchValue({
      discount: existingDiscount,
      paidAmount: remaining > 0 ? remaining : (order.billAmount - existingDiscount),
      paymentMethod: order.paymentMethod || 'cash'
    });
    if (order.razorpayPaymentLinkId && order.paymentStatus !== 'paid') {
      this.startPaymentLinkPolling();
    }
  }

  clearSelection() {
    if (this.paymentPollingInterval) {
      clearInterval(this.paymentPollingInterval);
      this.paymentPollingInterval = null;
    }
    this.selectedOrder = null;
    this.paymentDone = false;
    this.paymentLinkUrl = null;
    this.paymentLinkId = null;
    this.searchTerm = '';
    this.paymentForm.reset({ discount: 0, paidAmount: 0, paymentMethod: 'cash' });
    this.loadUnpaidOrders();
  }

  get finalAmount(): number {
    if (!this.selectedOrder) return 0;
    const discount = parseFloat(this.paymentForm.get('discount')?.value) || 0;
    return Math.max(0, (this.selectedOrder.billAmount || 0) - discount);
  }

  get balanceDue(): number {
    const paid = parseFloat(this.paymentForm.get('paidAmount')?.value) || 0;
    return Math.max(0, this.finalAmount - paid);
  }

  get expectedPaymentStatus(): string {
    const paid = parseFloat(this.paymentForm.get('paidAmount')?.value) || 0;
    if (paid <= 0) return 'unpaid';
    if (paid >= this.finalAmount) return 'paid';
    return 'partial';
  }

  getOrderTotal(order: any): number {
    if (!order?.items?.length) return order?.billAmount || 0;
    return order.items.reduce((sum: number, item: any) => sum + ((item.qty || 0) * (item.amount || 0)), 0);
  }

  getItemsTotal(): number {
    if (!this.selectedOrder?.items) return 0;
    return this.selectedOrder.items.reduce((sum: number, item: any) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.amount) || 0)), 0);
  }

  getStatusBadgeClass(status: string): string {
    const map: any = {
      paid: 'badge-paid',
      partial: 'badge-partial',
      unpaid: 'badge-unpaid'
    };
    return map[status] || 'badge-unpaid';
  }

  getWorkflowBadgeClass(status: string): string {
    const map: any = {
      confirm: 'bg-warning text-dark',
      washing: 'bg-primary',
      ironing: 'bg-info text-dark',
      folding: 'bg-secondary',
      packing: 'bg-dark',
      delivered: 'bg-success'
    };
    return map[status] || 'bg-secondary';
  }

  recordPayment() {
    if (this.paymentForm.invalid || !this.selectedOrder) return;

    this.processing = true;
    const { discount, paidAmount, paymentMethod } = this.paymentForm.value;

    this.orderService.recordPayment({
      orderId: this.selectedOrder._id,
      paymentMethod,
      paidAmount: parseFloat(paidAmount),
      discount: parseFloat(discount) || 0
    }).subscribe({
      next: (res) => {
        this.toaster.success('Payment recorded successfully!', '✅ Done');
        this.selectedOrder = res.data;
        this.paymentDone = true;
        this.processing = false;
        // Refresh the unpaid orders list so this order disappears if fully paid
        this.loadUnpaidOrders();
      },
      error: (err) => {
        this.toaster.error(err?.error?.message || 'Payment failed');
        this.processing = false;
      }
    });
  }

  downloadInvoice() {
    if (!this.selectedOrder) return;
    const token = this.storage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.post(`${this.apiUrl}/order/generate-invoice/${this.selectedOrder._id}`, { headers }, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${this.selectedOrder.bill}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.toaster.error('Invoice download failed')
    });
  }

  printGarmentTags() {
    if (!this.selectedOrder) return;
    this.tagPrintService.printGarmentTags(this.selectedOrder, this.businessData);
  }

  printThermalReceipt() {
    if (!this.selectedOrder) return;
    this.tagPrintService.printThermalReceipt(this.selectedOrder, this.businessData);
  }

  sendPaymentRequest() {
    if (!this.selectedOrder) return;
    this.generatingLink = true;
    this.orderService.createPaymentLink(this.selectedOrder._id).subscribe({
      next: (res) => {
        this.generatingLink = false;
        if (res.status && res.data) {
          this.paymentLinkUrl = res.data.short_url;
          this.paymentLinkId = res.data.paymentLinkId;
          if (res.data.order) {
            this.selectedOrder = res.data.order;
          }
          this.toaster.success('Payment link generated successfully!', '🔗 Link Ready');
          this.startPaymentLinkPolling();
        }
      },
      error: (err) => {
        this.generatingLink = false;
        this.toaster.error(err?.error?.message || 'Failed to create payment link');
      }
    });
  }

  startPaymentLinkPolling() {
    if (this.paymentPollingInterval) clearInterval(this.paymentPollingInterval);
    this.paymentPollingInterval = setInterval(() => {
      if (!this.selectedOrder || this.selectedOrder.paymentStatus === 'paid' || !this.paymentLinkUrl) {
        if (this.paymentPollingInterval) clearInterval(this.paymentPollingInterval);
        return;
      }
      this.orderService.checkPaymentLinkStatus(this.selectedOrder._id).subscribe({
        next: (statusRes) => {
          if (statusRes.paid && statusRes.data) {
            if (this.paymentPollingInterval) clearInterval(this.paymentPollingInterval);
            this.selectedOrder = statusRes.data;
            this.paymentDone = true;
            this.toaster.success('Customer paid online! Order marked as PAID automatically.', '🎉 Payment Received');
            this.loadUnpaidOrders();
          }
        },
        error: () => {}
      });
    }, 4000);
  }

  copyPaymentLink() {
    if (!this.paymentLinkUrl) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.paymentLinkUrl);
    } else {
      const el = document.createElement('textarea');
      el.value = this.paymentLinkUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    this.linkCopied = true;
    this.toaster.info('Link copied to clipboard!', '📋 Copied');
    setTimeout(() => this.linkCopied = false, 2500);
  }

  sendLinkViaWhatsApp() {
    if (!this.selectedOrder || !this.paymentLinkUrl) return;
    const phone = this.selectedOrder.customerId?.mobile || this.selectedOrder.customerId?.phone || '';
    const name = this.selectedOrder.customerId?.name || 'Valued Customer';
    const text = encodeURIComponent(`Hello ${name},\nYour Express Laundry bill #${this.selectedOrder.bill || ''} of ₹${this.finalAmount} is due.\nPlease click this secure Razorpay link to pay online:\n${this.paymentLinkUrl}\n\nThank you!`);
    const url = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  }

  simulateCustomerPayment() {
    if (!this.selectedOrder) return;
    this.processing = true;
    this.orderService.simulateLinkPayment(this.selectedOrder._id).subscribe({
      next: (res) => {
        this.processing = false;
        if (this.paymentPollingInterval) clearInterval(this.paymentPollingInterval);
        this.selectedOrder = res.data;
        this.paymentDone = true;
        this.toaster.success('Order automatically marked as PAID!', '🎉 Payment Successful');
        this.loadUnpaidOrders();
      },
      error: (err) => {
        this.processing = false;
        this.toaster.error(err?.error?.message || 'Simulation failed');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.paymentPollingInterval) {
      clearInterval(this.paymentPollingInterval);
      this.paymentPollingInterval = null;
    }
  }
}


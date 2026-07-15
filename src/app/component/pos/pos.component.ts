import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { HttpParams } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { StorageService } from '../../services/storage.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css'
})
export class PosComponent implements OnInit {

  // Search panel
  searchTerm: string = '';
  searchResults: any[] = [];
  searching: boolean = false;
  isDefaultView: boolean = true;  // true when showing default unpaid orders list

  // Selected order
  selectedOrder: any = null;

  // Payment form
  paymentForm!: FormGroup;
  processing: boolean = false;
  paymentDone: boolean = false;

  private apiUrl = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private orderService: newOrderService,
    private toaster: ToastrService,
    private http: HttpClient,
    private storage: StorageService,
    private eRef: ElementRef
  ) { }

  ngOnInit(): void {
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
    this.selectedOrder = order;
    this.paymentDone = false;

    // Pre-fill paidAmount with current billAmount - existing discount
    const existingDiscount = order.discount || 0;
    const existingPaid = order.paidAmount || 0;
    const remaining = (order.billAmount - existingDiscount) - existingPaid;

    this.paymentForm.patchValue({
      discount: existingDiscount,
      paidAmount: remaining > 0 ? remaining : (order.billAmount - existingDiscount),
      paymentMethod: order.paymentMethod || 'cash'
    });
  }

  clearSelection() {
    this.selectedOrder = null;
    this.paymentDone = false;
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
}

import { Component, OnInit } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  showPopup: boolean = false;
  orderDetails: any = {};
  barcodeInput: string = '';
  filterQuery: string = '';
  loading: boolean = false;

  get filteredOrders(): any[] {
    if (!this.filterQuery || !this.filterQuery.trim()) {
      return this.orders;
    }
    const query = this.filterQuery.toLowerCase().trim();
    return this.orders.filter(order => {
      const billMatches = order.bill && order.bill.toString().toLowerCase().includes(query);
      const nameMatches = order.customerId && order.customerId.name && order.customerId.name.toLowerCase().includes(query);
      const phoneMatches = order.customerId && order.customerId.mobile && order.customerId.mobile.toLowerCase().includes(query);
      return billMatches || nameMatches || phoneMatches;
    });
  }

  constructor(
    private orderService: newOrderService,
    private toast: ToastrService
  ) { }

  ngOnInit() {
    this.getOrders();
  }

  getOrders() {
    this.loading = true;
    this.orderService.getAllOrders("track", 1, 500).subscribe({
      next: (res) => {
        console.log(res);
        this.orders = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }

  openPopUp(id: any) {
    this.showPopup = true;
    this.orderService.getById(id).subscribe({
      next: (res) => {
        console.log(res.data);
        this.orderDetails = res.data;
      }
    });
  }

  close() {
    this.showPopup = false;
  }

  deleteOrder(id: any): void {
    if (confirm('Are you sure you want to delete this order?')) {
      this.orderService.deleteOrder(id).subscribe({
        next: (res) => {
          this.getOrders();
          this.toast.success('Order deleted successfully');
        },
        error: (err) => {
          this.toast.error('Failed to delete order');
        }
      });
    }
  }

  generateInvoice(orderId: any, customerId: any) {
    this.orderService.getBill({ orderId, customerId })
      .subscribe({
        next: (file) => {
          const blob = new Blob([file], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${orderId}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.toast.error('Failed to download invoice');
        }
      });
  }

  toggleServiceStatus(order: any, service: any) {
    if (service.status === 'completed') {
      return;
    }
    const newStatus = 'completed';

    this.orderService.updateOrderServiceStatus(order._id, service.serviceId, newStatus).subscribe({
      next: (res) => {
        service.status = newStatus;
        this.toast.success(`Marked service "${service.name}" as ${newStatus}`);
        // Refresh local order details if needed
        this.getOrders();
      },
      error: (err) => {
        this.toast.error('Failed to update service status');
      }
    });
  }

  isAllServicesCompleted(order: any): boolean {
    if (!order.services || order.services.length === 0) return false;
    return order.services.every((s: any) => s.status === 'completed');
  }

  getCompletedServicesSorted(order: any): any[] {
    if (!order || !order.services) return [];
    return order.services
      .filter((s: any) => s.status === 'completed')
      .sort((a: any, b: any) => {
        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : new Date(order.processingStartTime || order.createdAt).getTime();
        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : new Date(order.processingStartTime || order.createdAt).getTime();
        return timeA - timeB;
      });
  }

  deliverOrder(order: any) {
    const data = {
      customerId: order.customerId._id,
      orderId: order._id,
      type: 'status',
      kuri: order.customerId.kuri || '',
      status: 'delivered'
    };

    this.orderService.updateOrder(data).subscribe({
      next: (res) => {
        this.getOrders();
        this.toast.success('Order delivered successfully');
      },
      error: (err) => {
        this.toast.error('Failed to deliver order');
      }
    });
  }

  onBarcodeSubmit() {
    if (!this.barcodeInput || !this.barcodeInput.trim()) {
      return;
    }
    const bill = this.barcodeInput.trim();
    this.orderService.barcodeUpdate({ bill }).subscribe({
      next: (res: any) => {
        this.toast.success(`Order ${bill} status updated: ${res.data.status}`);
        this.barcodeInput = '';
        this.getOrders();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to update order by barcode');
      }
    });
  }

  isDueToday(dueDateString: any): boolean {
    if (!dueDateString) return false;
    const today = new Date();
    const dueDate = new Date(dueDateString);
    return today.getFullYear() === dueDate.getFullYear() &&
      today.getMonth() === dueDate.getMonth() &&
      today.getDate() === dueDate.getDate();
  }
}

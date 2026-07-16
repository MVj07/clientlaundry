import { Component } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { LoginService } from '../../services/login/login.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-pickup',
  templateUrl: './pickup.component.html',
  styleUrl: './pickup.component.css'
})
export class PickupComponent {
  orders: any
  status: any = 'pickup'
  isLoading = true;
  p: number = 1
  page: number = 1;
  limit: number = 5;
  totalItems: number = 0;
  selectAllChecked = false;
  selectedOrders: any = [];
  showPopup: boolean = false;
  orderDetails: any = {};
  
  isEmployee: boolean = false;

  constructor(
    private orderService: newOrderService,
    private authservice: LoginService,
    private toast: ToastrService
  ) { }

  async getOrders() {
    this.orderService.getAllOrders(this.status, this.page, this.limit).subscribe({
      next: (res) => {
        console.log(res.data)
        this.orders = res.data
        this.totalItems = res.meta?.total || 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Customer Error:', err);
        return;
      },
    })
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && localStorage) {
      this.isEmployee = localStorage.getItem('role') === 'employee';
    }
    this.getOrders()
  }

  getOrderTotal(order: any): number {
    const itemsTotal = order.items.reduce((sum: number, item: any) => sum + (item.qty * item.amount), 0);
    return itemsTotal + (order.deliveryCharge || 0);
  }

  deleteOrder(id: any): void {
    this.orderService.deleteOrder(id).subscribe({
      next: (res) => {
        this.getOrders()
        this.toast.success('Order deleted successfully')
      },
      error: (err) => {
        this.toast.error('Order delete failed')
        return;
      },
    })
  }

  moveWashing(orderId: string, kuri: any, customerId: any) {
    const data = {
      customerId: customerId._id,
      orderId,
      type: 'status',
      kuri,
      status: 'invoice'
    }
    this.orderService.updateOrder(data).subscribe({
      next: (res) => {
        this.getOrders()
        this.toast.success('Order updated successfully')
      },
      error: (err) => {
        this.toast.error('Order update failed')
        return;
      }
    })
  }

  markDelivered(order: any) {
    const data = {
      customerId: order.customerId?._id || order.customerId,
      orderId: order._id,
      type: 'status',
      kuri: order.kuri || '',
      status: 'delivered',
      deliveredAt: new Date()
    };
    this.orderService.updateOrder(data).subscribe({
      next: (res) => {
        this.getOrders();
        this.toast.success('Order marked as delivered');
      },
      error: (err) => {
        this.toast.error('Failed to deliver order');
      }
    });
  }

  pageChanged(newPage: number): void {
    this.page = newPage;
    this.getOrders();
  }

  bulkUpdate() {
    this.orderService.bulkUpdate(this.selectedOrders, "delivered").subscribe({
      next: (res) => {
        this.getOrders()
        this.selectedOrders = []
        this.toast.success('Orders marked as delivered')
      },
      error: (err) => {
        this.toast.error('Order update failed')
        return;
      }
    })
  }

  isSelected(orderId: string): boolean {
    return this.selectedOrders.includes(orderId);
  }

  toggleSelection(event: any) {
    if (event.target.checked) {
      this.selectedOrders.push(event.target.value)
      if (this.selectedOrders.length === this.orders.length) {
        this.selectAllChecked = true
      }
    } else {
      this.selectAllChecked = false
      this.selectedOrders.splice(this.selectedOrders.indexOf(event.target.value), 1)
    }
  }

  toggleSelectAll() {
    if (this.orders?.length) {
      this.selectAllChecked = !this.selectAllChecked
      if (this.selectAllChecked) {
        this.selectedOrders = this.orders.map((item: any) => item._id)
      } else {
        this.selectedOrders = []
      }
    }
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
}

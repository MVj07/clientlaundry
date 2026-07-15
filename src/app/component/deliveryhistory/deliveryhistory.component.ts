import { Component } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { LoginService } from '../../services/login/login.service';

@Component({
  selector: 'app-deliveryhistory',
  templateUrl: './deliveryhistory.component.html',
  styleUrl: './deliveryhistory.component.css'
})
export class DeliveryhistoryComponent {
  orders: any
  status: any = ''
  overallTotalAmount: number = 0;
  isLoading = true;
  p: number = 1
  page: number = 1;
  limit: number = 10;
  totalItems: number = 0;
  selected: string[] = [];
  showPopup: boolean = false;
  orderDetails: any;

  filterCustomer: string = '';
  filterMobile: string = '';
  selectedPeriod: string = 'all'; // 'all' | 'today' | 'month'
  selectedDate: string = '';
  selectedMonth: any = '';
  selectedYear: any = '';

  months = [
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 }
  ];
  years: number[] = [];

  constructor(
    private orderService: newOrderService,
    private authservice: LoginService
  ) {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  }

  selectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.orders.map((item: any) => {
        this.selected.push(item._id)
      })
    } else {
      this.selected = []
    }
  }

  handleSelect(id: any) {
    this.selected.push(id)
  }

  selectPeriod(period: string) {
    this.selectedPeriod = period;
    this.page = 1;
    if (period === 'today') {
      this.selectedDate = new Date().toISOString().split('T')[0];
    } else if (period === 'month') {
      const today = new Date();
      this.selectedMonth = today.getMonth() + 1;
      this.selectedYear = today.getFullYear();
    }
    this.getOrders();
  }

  onFilterChange() {
    this.page = 1;
    this.getOrders();
  }

  onDateChange() {
    this.page = 1;
    this.getOrders();
  }

  onFilterSubmit() {
    this.page = 1;
    this.getOrders();
  }

  resetFilters() {
    this.filterCustomer = '';
    this.filterMobile = '';
    this.selectedPeriod = 'all';
    this.selectedDate = '';
    this.selectedMonth = '';
    this.selectedYear = '';
    this.page = 1;
    this.getOrders();
  }

  getOrders() {
    this.isLoading = true;
    const filters: any = {};
    if (this.filterCustomer.trim()) {
      filters.customerName = this.filterCustomer.trim();
    }
    if (this.filterMobile.trim()) {
      filters.mobile = this.filterMobile.trim();
    }

    if (this.selectedPeriod === 'today' && this.selectedDate) {
      filters.date = this.selectedDate;
    } else if (this.selectedPeriod === 'month' && this.selectedMonth && this.selectedYear) {
      filters.month = this.selectedMonth;
      filters.year = this.selectedYear;
    }

    this.orderService.getAllOrders(this.status, this.page, this.limit, filters).subscribe({
      next: (res) => {
        console.log(res.data)
        this.orders = res.data
        this.totalItems = res.meta?.total || 0;
        this.overallTotalAmount = res.meta?.overallTotalAmount || 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        return;
      },
    })
  }

  ngOnInit(): void {
    this.getOrders()
  }
  getOrderTotal(order: any): number {
    return order.items.reduce((sum: number, item: any) => sum + (item.qty * item.amount), 0);
  }
  deleteOrder(id: any): void {
    this.orderService.deleteOrder(id).subscribe({
      next: (res) => {
        this.getOrders()
        alert('Order deleted successfully')
      },
      error: (err) => {
        alert('Order deleted failed')
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
      status: 'washing'
    }
    this.orderService.updateOrder(data).subscribe({
      next: (res) => {
        this.getOrders()
        alert('Order updated successfully')
      },
      error: (err) => {
        alert('Order update failed')
        return;
      }
    })
  }

  pageChanged(newPage: number): void {
    this.page = newPage;
    this.getOrders();
  }

  getWorkflowBadgeClass(status: string): string {
    const map: any = {
      confirm: 'bg-warning text-dark',
      washing: 'bg-primary text-white',
      ironing: 'bg-info text-dark',
      folding: 'bg-secondary text-white',
      packing: 'bg-dark text-white',
      delivered: 'bg-success text-white'
    };
    return map[status] || 'bg-secondary text-white';
  }

  getPageTotal(): number {
    if (!this.orders) return 0;
    return this.orders.reduce((sum: number, order: any) => sum + (order.billAmount || 0), 0);
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
        this.orderDetails = res.data;
      }
    });
  }

  close() {
    this.showPopup = false;
  }
}

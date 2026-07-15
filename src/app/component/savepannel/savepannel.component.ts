import { Component, OnInit } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { authService } from '../../services/authenticate/auth.service';
import { LoginService } from '../../services/login/login.service';
import { ToastrService } from 'ngx-toastr';
import { BusinessService } from '../../services/business/business.service';
import { TagPrintService } from '../../services/tag-print/tag-print.service';

@Component({
  selector: 'app-savepannel',
  templateUrl: './savepannel.component.html',
  styleUrl: './savepannel.component.css'
})
export class SavepannelComponent implements OnInit {
  orders: any[] = [];
  status: any = 'confirm';
  isLoading = true;
  p: number = 1;
  page: number = 1;
  limit: number = 10;
  totalItems: number = 0;
  selectAllChecked = false;
  selectedOrders: any = [];
  showPopup: boolean = false;
  orderDetails: any;

  filterCustomer: string = '';
  filterMobile: string = '';
  filterBill: string = '';

  get filteredOrders(): any[] {
    if (!this.orders) return [];
    return this.orders.filter(order => {
      const nameMatch = !this.filterCustomer || (order.customerId?.name || '').toLowerCase().includes(this.filterCustomer.toLowerCase());
      const mobileMatch = !this.filterMobile || (order.customerId?.mobile || '').includes(this.filterMobile);
      const billMatch = !this.filterBill || (order.bill || '').toString().toLowerCase().includes(this.filterBill.toLowerCase());
      return nameMatch && mobileMatch && billMatch;
    });
  }

  businessData: any = null;

  constructor(
    private orderService: newOrderService,
    private authservice: LoginService,
    private toast: ToastrService,
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
    this.getOrders();
  }

  getOrders() {
    this.orderService.getAllOrders(this.status, this.page, this.limit).subscribe({
      next: (res) => {
        console.log(res.data)
        this.orders = res.data
        this.totalItems = res.meta?.total || 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        // if (err.status === 401 || err.status === 403) {
        //   this.authservice.logOut(); // You must have a method that clears tokens and navigates to login
        //   return;
        // }
        return;
      },
    });
  }

  getOrderTotal(order: any): number {
    return order.items.reduce((sum: number, item: any) => sum + (item.qty * item.amount), 0) + (order.deliveryCharge || 0);
  }
  deleteOrder(id: any): void {
    this.orderService.deleteOrder(id).subscribe({
      next: (res) => {
        this.getOrders()
        this.toast.success('Order deleted successfully')
        // window.alert('Order deleted successfully')
      },
      error: (err) => {
        this.toast.error('Order deleted failed')
        // window.alert('Order deleted failed')
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
      status: 'processing'
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
  
  bulkUpdate(){
    this.orderService.bulkUpdate(this.selectedOrders, "confirm").subscribe({
      next: (res)=>{
        this.getOrders()
        this.selectedOrders=[]
        this.toast.success('Confirmed orders')
        // window.alert('Confirmed orders')
      },
      error: (err) => {
        this.toast.error('Order update failed')
        // window.alert('Order update failed')
        return;
      }
    })
  }

  pageChanged(newPage: number): void {
    this.page = newPage;
    this.getOrders();
  }

  toJson(data: any) {
    return JSON.stringify(data);
  }

  applyFilter() {
    // filtering is handled by the filteredOrders getter
  }

  resetFilters() {
    this.filterCustomer = '';
    this.filterMobile = '';
    this.filterBill = '';
  }

  toggleSelectAll() {
    if (this.orders?.length){
    this.selectAllChecked = !this.selectAllChecked
    if (this.selectAllChecked) {
      this.selectedOrders = this.orders.map((item: any) => item._id)
    } else {
      this.selectedOrders = []
    }
    }
  }

  isSelected(orderId: string): boolean {
    return this.selectedOrders.includes(orderId);
  }
  toggleSelection(event: any) {
    if (event.target.checked){
      this.selectedOrders.push(event.target.value)
      if (this.selectedOrders.length===this.orders.length){
        this.selectAllChecked=true
      }
    }else{
      this.selectAllChecked=false
      this.selectedOrders.splice(this.selectedOrders.indexOf(event.target.value), 1)
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
        this.orderDetails = res.data;
      }
    });
  }

  close() {
    this.showPopup = false;
  }

  printGarmentTags(order: any) {
    if (!order) return;
    this.tagPrintService.printGarmentTags(order, this.businessData);
  }

  printThermalReceipt(order: any) {
    if (!order) return;
    this.tagPrintService.printThermalReceipt(order, this.businessData);
  }
}

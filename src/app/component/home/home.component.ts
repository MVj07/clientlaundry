import { Component } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { LoginService } from '../../services/login/login.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  orders: any = []
  constructor(
    private order: newOrderService
  ){}

  getOrders(){
    this.order.getAllOrders("all", 1, 10).subscribe({
      next:(res)=>{
        console.log(res)
        this.orders = res.data.splice(0,4)
      },
      error: (err) => {
        return;
      }
    })

  }

  ngOnInit(){
    this.getOrders()
  }
  // orders: any
  // status: any = 'confirm'
  // isLoading = true;
  // p: number = 1
  // page: number = 1;
  // limit: number = 5;
  // totalItems: number = 0;
  // selectAllChecked = false;
  // selectedOrders: any = []
  // constructor(
  //   private orderService: newOrderService,
  //   private authservice: LoginService,
  //   private toast: ToastrService
  // ) { }
  // async getOrders() {
  //   this.orderService.getAllOrders(this.status, this.page, this.limit).subscribe({
  //     next: (res) => {
  //       console.log(res.data)
  //       this.orders = res.data
  //       this.totalItems = res.meta?.total || 0;
  //       this.isLoading = false;
  //     },
  //     error: (err) => {
  //       // alert('Order failed')
  //       this.isLoading = false;
  //       // if (err.status === 401 || err.status === 403) {
  //       //   this.authservice.logOut(); // You must have a method that clears tokens and navigates to login
  //       //   return;
  //       // }
  //       return;
  //     },
  //   })
  // }
  // ngOnInit(): void {
  //   this.getOrders()
  // }
  // getOrderTotal(order: any): number {
  //   return order.items.reduce((sum: number, item: any) => sum + (item.qty * item.amount), 0);
  // }
  // deleteOrder(id: any): void {
  //   this.orderService.deleteOrder(id).subscribe({
  //     next: (res) => {
  //       this.getOrders()
  //       this.toast.success('Order deleted successfully')
  //       // window.alert('Order deleted successfully')
  //     },
  //     error: (err) => {
  //       this.toast.error('Order deleted failed')
  //       // window.alert('Order deleted failed')
  //       return;
  //     },
  //   })
  // }

  // moveWashing(orderId: string, kuri: any, customerId: any) {
  //   const data = {
  //     customerId: customerId._id,
  //     orderId,
  //     type: 'status',
  //     kuri,
  //     status: 'washing'
  //   }
  //   this.orderService.updateOrder(data).subscribe({
  //     next: (res) => {
  //       this.getOrders()
  //       this.toast.success('Order updated successfully')
  //       // alert('Order updated successfully')
  //     },
  //     error: (err) => {
  //       this.toast.error('Order update failed')
  //       // alert('Order update failed')
  //       return;
  //     }
  //   })
  // }

  // pageChanged(newPage: number): void {
  //   this.page = newPage;
  //   this.getOrders();
  // }

  // bulkUpdate() {
  //   this.orderService.bulkUpdate(this.selectedOrders, "washing").subscribe({
  //     next: (res) => {
  //       this.getOrders()
  //       this.selectedOrders = []
  //       this.toast.success('Confirmed orders')
  //       // alert('Confirmed orders')
  //     },
  //     error: (err) => {
  //       this.toast.error('Order update failed')
  //       // alert('Order update failed')
  //       return;
  //     }
  //   })
  // }
  // isSelected(orderId: string): boolean {
  //   return this.selectedOrders.includes(orderId);
  // }
  // toggleSelection(event: any) {
  //   if (event.target.checked) {
  //     this.selectedOrders.push(event.target.value)
  //     if (this.selectedOrders.length === this.orders.length) {
  //       this.selectAllChecked = true
  //     }
  //   } else {
  //     this.selectAllChecked = false
  //     this.selectedOrders.splice(this.selectedOrders.indexOf(event.target.value), 1)
  //   }
  // }
  // toggleSelectAll() {
  //   if (this.orders?.length){
  //   this.selectAllChecked = !this.selectAllChecked
  //   if (this.selectAllChecked) {
  //     this.selectedOrders = this.orders.map((item: any) => item._id)
  //   } else {
  //     this.selectedOrders = []
  //   }
  //   }
  // }
  businessName = 'Smart Laundry';
  today = new Date();

  kpiCards = [
    { title: 'Today Orders', value: 24, color: 'bg-primary' },
    { title: 'Washing', value: 10, color: 'bg-warning' },
    { title: 'Packing', value: 6, color: 'bg-info' },
    { title: 'Today Revenue', value: '₹4,250', color: 'bg-success' }
  ];

  statusSummary = [
    { label: 'Washing', count: 10 },
    { label: 'Ironing', count: 8 },
    { label: 'Packing', count: 6 },
    { label: 'Delivery', count: 4 }
  ];

  recentOrders = [
    { bill: 'INV-101', customer: 'Arun', status: 'washing', amount: 350 },
    { bill: 'INV-102', customer: 'Kumar', status: 'packing', amount: 480 },
    { bill: 'INV-103', customer: 'Ravi', status: 'delivery', amount: 220 },
    { bill: 'INV-104', customer: 'Suresh', status: 'ironing', amount: 300 }
  ];

}

import { Component } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { authService } from '../../services/authenticate/auth.service';
import { LoginService } from '../../services/login/login.service';

@Component({
  selector: 'app-savepannel',
  templateUrl: './savepannel.component.html',
  styleUrl: './savepannel.component.css'
})
export class SavepannelComponent {
  orders: any
  status: any = ''
  isLoading = true;
  p: number = 1;
  page: number = 1;
  limit: number = 5;
  totalItems: number = 0;
  selectAllChecked = false;
  selectedOrders: any = []

  constructor(
    private orderService: newOrderService,
    private authservice: LoginService
  ) { }
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
      status: 'confirm'
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
  
  bulkUpdate(){
    this.orderService.bulkUpdate(this.selectedOrders, "confirm").subscribe({
      next: (res)=>{
        this.getOrders()
        this.selectedOrders=[]
        alert('Confirmed orders')
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

  toJson(data: any) {
    return JSON.stringify(data);
  }

  toggleSelectAll() {
    this.selectAllChecked = !this.selectAllChecked
    if (this.selectAllChecked) {
      this.selectedOrders = this.orders.map((item: any) => item._id)
    } else {
      this.selectedOrders = []
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
}

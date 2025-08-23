import { Component } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';

@Component({
  selector: 'app-delivery',
  templateUrl: './delivery.component.html',
  styleUrl: './delivery.component.css'
})
export class DeliveryComponent {
  orders: any
  status: any = 'deliver'
  isLoading = true;
  p:number=1
  page: number = 1;
  limit: number = 5;
  totalItems: number = 0;
  constructor(
    private orderService: newOrderService
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
        // alert('Order failed')
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
      status: 'delivered'
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

}

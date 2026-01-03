import { Component } from '@angular/core';
// import { Component } from '@angular/core';
import { CdkDragDrop, transferArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { ToastrService } from 'ngx-toastr';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent {
  column: any=[]
  orders: any=[]
  showCreateWorkflow:any=true
  workflows:any=[]
  constructor(
    private order: newOrderService,
    private toast: ToastrService,
    private storageService: StorageService
  ){}

  getOrdersByStatus(status: string) {
    console.log(status)
    console.log(this.orders)
  return this.orders.filter((o:any) => o.status === status);
}


  getOrders(){
    this.order.getAllOrders("track", 1, 10).subscribe({
      next:(res)=>{
        console.log(res)
        this.orders = res.data
      },
      error: (err) => {
        return;
      }
    })

  }

  ngOnInit(){
    this.getOrders()
    // this.workflows = this.storageService.getItem('workflo')
    const workflow=this.storageService.getItem('workflow')
    if (workflow){
      if(JSON.parse(workflow).length>0){
        this.workflows = JSON.parse(workflow)
        console.log(JSON.parse(workflow))
        this.showCreateWorkflow = false
      }
    }
  }

  deleteOrder(id: any): void {
    this.order.deleteOrder(id).subscribe({
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

  generateInvoice(orderId:any, customerId:any) {
  // this.http.post(`${api}/orders/update`, {
  //   orderId,
  //   customerId,
  //   type: "generate_invoice"
  // }, { responseType: 'blob' })
  this.order.getBill({orderId: orderId, customerId: customerId})
  .subscribe((file) => {
      const blob = new Blob([file], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice.pdf';
      a.click();
  });
}

  moveWashing(orderId: string, kuri: any, customerId: any, status:any) {
    const data = {
      customerId: customerId,
      orderId,
      type: 'status',
      kuri,
      status: status
    }
    this.order.updateOrder(data).subscribe({
      next: (res) => {
        this.getOrders()
        this.toast.success('Order updated successfully')
        // alert('Order updated successfully')
      },
      error: (err) => {
        this.toast.error('Order update failed')
        // alert('Order update failed')
        return;
      }
    })
  }

  columns = [
    {
      title: "Washing",
      status: "washing",
      orders: [
        {
          customer: "Ravi Kumar",
          mobile: "8133441294",
          items: ["T-shirt (3)", "Jeans (2)"],
          total: 25
        },
      ]
    },
    {
      title: "Ironing",
      status: "ironing",
      orders: []
    },
    {
      title: "Packing",
      status: "packing",
      orders: []
    },
    {
      title: "Delivery",
      status: "delivery",
      orders: []
    },
    {
      title: "Delivered",
      status: "delivered",
      orders: []
    }
  ];

  moveOrder(order: any, nextStatus: string) {
    console.log(order, nextStatus)
  // this.order.updateOrder(order._id, nextStatus).subscribe(() => {
  //   order.status = nextStatus; // instant UI update
  // });
}


  // onDrop(event: CdkDragDrop<any[]>, column: any) {
  //   if (event.previousContainer === event.container) {
  //     moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  //   } else {
  //     transferArrayItem(
  //       event.previousContainer.data,
  //       event.container.data,
  //       event.previousIndex,
  //       event.currentIndex
  //     );
  //   }

  //   console.log("Order moved to:", column.title);
  // }
  onDrop(event: CdkDragDrop<any[]>, column: any) {
    const draggedOrder = event.item.data;
    const newStatus = column.status;  // The column user dropped into
    const oldStatus = draggedOrder.status;

    // ------- Movement Rules -------
    const allowedTransitions: any = {
      washing: ["ironing"],      // Only ironing allowed
      ironing: ["packing"],      // From ironing → packing
      packing: ["delivery"],     // From packing → delivery
      delivery: []               // Delivery cannot move forward
    };
    // ------------------------------

    // If move is NOT allowed
    if (!allowedTransitions[oldStatus].includes(newStatus)) {
      alert(`❌ You can't move order from ${oldStatus} to ${newStatus}`);
      return;
    }

    // If allowed, perform the move
    if (event.previousContainer === event.container) {
      moveItemInArray(column.orders, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    // Update status on the order
    draggedOrder.status = newStatus;
  }

}

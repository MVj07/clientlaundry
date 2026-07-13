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
  column: any = []
  orders: any = []
  showCreateWorkflow: any = true
  workflows: any = []
  showPopup: boolean = false;
  orderDetails: any = {}
  barcodeInput: string = '';
  constructor(
    private order: newOrderService,
    private toast: ToastrService,
    private storageService: StorageService
  ) { }

  openPopUp(id: any) {
    this.showPopup = true
    this.order.getById(id).subscribe({
      next: (res) => {
        console.log(res.data)
        this.orderDetails = res.data
      }
    })
  }

  close() {
    this.showPopup = false
  }

  getOrdersByStatus(status: string) {
    console.log(status)
    console.log(this.orders)
    return this.orders.filter((o: any) => o.status === status);
  }


  getOrders() {
    this.order.getAllOrders("track", 1, 500).subscribe({
      next: (res) => {
        console.log(res)
        this.orders = res.data
      },
      error: (err) => {
        return;
      }
    })

  }

  isDueToday(dueDateString: any): boolean {
    if (!dueDateString) return false;
    const today = new Date();
    const dueDate = new Date(dueDateString);
    return today.getFullYear() === dueDate.getFullYear() &&
      today.getMonth() === dueDate.getMonth() &&
      today.getDate() === dueDate.getDate();
  }

  ngOnInit() {
    this.getOrders()
    // this.workflows = this.storageService.getItem('workflo')
    const workflow = this.storageService.getItem('workflow')
    if (workflow && workflow !== 'undefined') {
      try {
        const parsed = JSON.parse(workflow);
        if (parsed && parsed.length > 0) {
          this.workflows = parsed
          console.log(parsed)
          this.showCreateWorkflow = false
        }
      } catch (e) {
        console.error('Error parsing workflow JSON', e);
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

  generateInvoice(orderId: any, customerId: any) {
    // this.http.post(`${api}/orders/update`, {
    //   orderId,
    //   customerId,
    //   type: "generate_invoice"
    // }, { responseType: 'blob' })
    this.order.getBill({ orderId: orderId, customerId: customerId })
      .subscribe((file) => {
        const blob = new Blob([file], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invoice.pdf';
        a.click();
      });
  }

  moveWashing(orderId: string, kuri: any, customerId: any, status: any) {
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
  onDrop(event: CdkDragDrop<any[]>, targetWorkflow: any) {
    const draggedOrder = event.item.data;
    const newStatus = targetWorkflow.indentifier;
    const oldStatus = draggedOrder.status;

    if (newStatus === oldStatus) {
      return;
    }

    // Dynamic transition validation based on order in the custom workflows list
    const oldIndex = this.workflows.findIndex((w: any) => w.indentifier === oldStatus);
    const newIndex = this.workflows.findIndex((w: any) => w.indentifier === newStatus);

    // Permit moving forward by 1 step or backward by 1 step
    if (oldIndex !== -1 && newIndex !== -1 && Math.abs(newIndex - oldIndex) > 1) {
      this.toast.warning(`Cannot skip workflow steps! Please move step-by-step.`);
      return;
    }

    // Call service to update backend status
    const updateData = {
      customerId: draggedOrder.customerId._id,
      orderId: draggedOrder._id,
      type: 'status',
      kuri: draggedOrder.customerId.kuri || '',
      status: newStatus
    };

    this.order.updateOrder(updateData).subscribe({
      next: (res) => {
        // Update local order status
        draggedOrder.status = newStatus;
        this.getOrders(); // refresh order list to ensure correct columns
        this.toast.success(`Order moved to ${targetWorkflow.name}`);
      },
      error: (err) => {
        this.toast.error('Failed to move order');
      }
    });
  }

  onBarcodeSubmit() {
    if (!this.barcodeInput || !this.barcodeInput.trim()) {
      return;
    }
    const bill = this.barcodeInput.trim();
    this.order.barcodeUpdate({ bill }).subscribe({
      next: (res: any) => {
        this.toast.success(`Order ${bill} updated to status: ${res.data.status}`);
        this.barcodeInput = '';
        this.getOrders();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to update order by barcode');
      }
    });
  }

}

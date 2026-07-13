import { Component, HostListener, ElementRef } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../../services/customer/customer.service';
import { LoginService } from '../../services/login/login.service';
import { ToastrService } from 'ngx-toastr';
import { ServiceService } from '../../services/service/service.service';

@Component({
  selector: 'app-neworder',
  templateUrl: './neworder.component.html',
  styleUrl: './neworder.component.css'
})
export class NeworderComponent {
  orderType: 'item' | 'kg' = 'item';
  orditems: any[] = [
    { name: 'Shirt', price: 10 },
    { name: 'T-Shirt', price: 8 },
    { name: 'Pant', price: 12 },
    { name: 'Jeans', price: 15 },
    { name: 'Suit (2-Piece)', price: 40 },
    { name: 'Suit (3-Piece)', price: 50 },
    { name: 'Saree (Cotton)', price: 25 },
    { name: 'Saree (Silk)', price: 35 },
    { name: 'Bed Sheet (Single)', price: 20 },
    { name: 'Bed Sheet (Double)', price: 30 },
    { name: 'Blanket / Comforter', price: 60 },
    { name: 'Curtain', price: 20 },
    { name: 'Jacket / Coat', price: 30 },
    { name: 'Towel', price: 8 }
  ];
  submit: boolean = false;
  itemSubmit: boolean = false;
  loading: boolean = false;
  newOrderForm!: FormGroup;
  itemForm!: FormGroup;
  orders: any[] = [];
  customerId: string | null = null;
  p: number = 1
  update: any = null
  
  suggestions: any[] = [];
  showSuggestions: boolean = false;
  activeField: 'name' | 'mobile' | null = null;

  // services configuration
  availableServices: any[] = [];
  selectedServiceIds: string[] = [];

  // items autocomplete
  productSuggestions: any[] = [];
  showProductSuggestions: boolean = false;

  constructor(
    private fb: FormBuilder,
    private newOrderService: newOrderService,
    private customerService: CustomerService,
    private serviceService: ServiceService,
    private route: ActivatedRoute,
    private router: Router,
    private authservice: LoginService,
    private toaster: ToastrService,
    private eRef: ElementRef
  ) { }

  ngOnInit(): void {
    this.newOrderForm = this.fb.group({
      date: ['', Validators.required],
      dueDate: ['', Validators.required],
      specialInstructions: [''],
      name: ['', Validators.required],
      mobile: ['', Validators.required],
      address: ['', Validators.required],
      whatsapp: [''],
      sameAsPhone: [false]
    })

    this.itemForm = this.fb.group({
      itemName: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      amount: [0, [Validators.required, Validators.min(0.01)]]
    });

    this.newOrderForm.get('mobile')?.valueChanges.subscribe(val => {
      if (this.newOrderForm.get('sameAsPhone')?.value) {
        this.newOrderForm.get('whatsapp')?.setValue(val, { emitEvent: false });
      }
    });

    this.newOrderForm.get('sameAsPhone')?.valueChanges.subscribe(checked => {
      if (checked) {
        const phone = this.newOrderForm.get('mobile')?.value;
        this.newOrderForm.get('whatsapp')?.setValue(phone, { emitEvent: false });
        this.newOrderForm.get('whatsapp')?.disable();
      } else {
        this.newOrderForm.get('whatsapp')?.enable();
      }
    });

    this.newOrderForm.get('name')?.valueChanges.subscribe(val => {
      if (this.newOrderForm.get('name')?.dirty && val && val.length >= 2) {
        this.fetchSuggestions(val, 'name');
      } else {
        if (this.activeField === 'name') {
          this.showSuggestions = false;
        }
      }
    });

    this.newOrderForm.get('mobile')?.valueChanges.subscribe(val => {
      if (this.newOrderForm.get('mobile')?.dirty && val && val.length >= 2) {
        this.fetchSuggestions(val, 'mobile');
      } else {
        if (this.activeField === 'mobile') {
          this.showSuggestions = false;
        }
      }
    });

    // Auto-complete items name input watcher
    this.itemForm.get('itemName')?.valueChanges.subscribe(val => {
      this.onItemNameInput(val);
    });



    // Load available services
    this.serviceService.getAll().subscribe({
      next: (res) => {
        this.availableServices = res.data || [];
      }
    });

    this.route.params.subscribe(params => {
      this.customerId = params['id'];
      if (this.customerId) {
        this.fetchOrderDetails(this.customerId);
      }
    })

    this.route.queryParams.subscribe(params => {
      if (params['items']) {
        try {
          this.orders = JSON.parse(params['items'])
          console.log(this.orders, params['date'])
        } catch (e) {
          console.error('Error parsing items JSON from query params', e);
          this.orders = []
        }
      } else {
        this.orders = []
      }

      if (params['services']) {
        try {
          const parsedServices = JSON.parse(params['services']);
          this.selectedServiceIds = parsedServices.map((s: any) => s.serviceId || s._id || s);
        } catch (e) {
          console.error('Error parsing services JSON from query params', e);
          this.selectedServiceIds = [];
        }
      } else {
        this.selectedServiceIds = [];
      }

      this.update = params['orderId']
      const dateVal = params['date'] ? params['date'].split('T')[0] : '';
      const dueDateVal = params['dueDate'] ? params['dueDate'].split('T')[0] : '';
      this.newOrderForm.patchValue({
        kuri: params['kuri'],
        date: dateVal,
        dueDate: dueDateVal,
        specialInstructions: params['specialInstructions'] || '',
        bill: params['bill']
      })
      this.orderType = params['type'] || 'item';
      if (this.orderType === 'kg') {
        this.itemForm.patchValue({
          itemName: 'Clothes (Kg)',
          quantity: 1,
          amount: 0
        });
      }
      if (this.update) {
        this.newOrderForm.get('kuri')?.disable();
        this.newOrderForm.get('name')?.disable();
        this.newOrderForm.get('mobile')?.disable();
        this.newOrderForm.get('address')?.disable();
        this.newOrderForm.get('date')?.disable();
        this.newOrderForm.get('bill')?.disable();
      }
    })
  }

  fetchOrderDetails(customerId: string): void {
    // Fetch the customer details using the service
    this.customerService.getById(customerId).subscribe(data => {
      console.log(data)
      const cust = data.data;
      this.newOrderForm.patchValue({
        name: cust.name,
        mobile: cust.mobile,
        address: cust.address,
        whatsapp: cust.whatsapp || '',
        sameAsPhone: cust.mobile && cust.whatsapp && cust.mobile === cust.whatsapp
      });
      if (cust.mobile && cust.whatsapp && cust.mobile === cust.whatsapp) {
        this.newOrderForm.get('whatsapp')?.disable();
      }
    });
  }

  get form() {
    return this.newOrderForm?.controls;
  }

  get itemControls() {
    return this.itemForm?.controls;
  }

  toggleService(serviceId: string) {
    const index = this.selectedServiceIds.indexOf(serviceId);
    if (index > -1) {
      this.selectedServiceIds.splice(index, 1);
    } else {
      this.selectedServiceIds.push(serviceId);
    }
  }

  isServiceSelected(serviceId: string): boolean {
    return this.selectedServiceIds.includes(serviceId);
  }

  onItemNameInput(val: string) {
    if (val && val.trim().length >= 1) {
      const term = val.trim().toLowerCase();
      this.productSuggestions = this.orditems.filter((item: any) =>
        item.name.toLowerCase().includes(term)
      );
      this.showProductSuggestions = this.productSuggestions.length > 0;
    } else {
      this.productSuggestions = [];
      this.showProductSuggestions = false;
    }
  }

  selectProductSuggestion(item: any) {
    this.itemForm.patchValue({
      itemName: item.name,
      amount: item.price
    }, { emitEvent: false });
    this.showProductSuggestions = false;
    this.productSuggestions = [];
  }

  formSubmit() {
    this.submit = true;
    if (this.newOrderForm.invalid || this.orders.length === 0) {
      return;
    }
    this.loading = true;
    const formValue = this.newOrderForm.getRawValue();
    const orderPayload = {
      customerId: this.customerId,
      orderId: this.update,
      kuri: formValue.kuri,
      bill: formValue.bill,
      date: formValue.date,
      dueDate: formValue.dueDate,
      specialInstructions: formValue.specialInstructions || '',
      customerName: formValue.name,
      phoneNumber: formValue.mobile,
      whatsappNumber: formValue.whatsapp,
      address: formValue.address,
      status: 'confirm',
      type: this.orderType,
      items: this.orders.map(order => ({
        _id: order.id || order._id,
        name: order.name,
        qty: order.qty,
        amount: order.amount
      })),
      total: this.getTotalAmount(),
      services: this.selectedServiceIds
    };
    if (!this.update) {
      this.newOrderService.newOrder(orderPayload).subscribe({
        next: (res) => {
          this.newOrderForm.reset();
          this.itemForm.reset();
          this.submit = false;
          this.orders = []
          this.selectedServiceIds = [];
          this.loading = false;
          this.toaster.success('Order success', 'success')
        },
        error: (err) => {
          this.toaster.error('Order failed')
          this.loading = false;
          return;
        },
      })
    } else {
      this.newOrderService.updateOrder(orderPayload).subscribe({
        next: (res) => {
          this.newOrderForm.reset();
          this.itemForm.reset();
          this.submit = false;
          this.orders = []
          this.selectedServiceIds = [];
          this.loading = false;
          this.toaster.success(res.message)
          this.router.navigate(['/savepannel']);
        },
        error: (err) => {
          this.toaster.error('Order update failed')
          this.loading = false;
          return;
        },
      })
    }
  }

  removeOrder(index: number) {
    this.orders.splice(index, 1);
  }

  addOrder() {
    this.itemSubmit = true;
    if (this.itemForm.invalid) return;

    const formValue = this.itemForm.value;
    const nameStr = formValue.itemName.trim();
    
    let orderData: any;
    if (this.orderType === 'item') {
      const matched = this.orditems.find((item: any) => item.name.toLowerCase() === nameStr.toLowerCase());
      orderData = {
        id: matched ? matched._id : 'custom_' + Date.now(),
        name: nameStr,
        qty: formValue.quantity,
        amount: formValue.amount
      };
    } else {
      orderData = {
        id: 'kg_' + Date.now(),
        name: nameStr || 'Clothes (Kg)',
        qty: formValue.quantity,
        amount: formValue.amount
      };
    }

    // ✅ Check for duplicate name
    const exists = this.orders.some(order => order.name.toLowerCase() === orderData.name.toLowerCase());
    if (exists) {
      alert("This item/service is already added to the order list.");
      this.itemSubmit = false;
      return;
    }

    this.orders.push(orderData);

    // Reset form fields
    this.itemForm.reset({
      itemName: this.orderType === 'kg' ? 'Clothes (Kg)' : '',
      quantity: 1,
      amount: 0
    });
    this.itemSubmit = false;
    this.showProductSuggestions = false;
    this.productSuggestions = [];
  }

  setOrderType(type: 'item' | 'kg') {
    if (this.orders.length > 0) {
      if (!confirm("Switching order type will clear the currently added items. Proceed?")) {
        return;
      }
    }
    this.orderType = type;
    this.orders = [];
    this.itemForm.reset({
      itemName: type === 'kg' ? 'Clothes (Kg)' : '',
      quantity: 1,
      amount: 0
    });
  }

  getTotalAmount(): number {
    return this.orders.reduce((sum, order) => sum + (order.qty * order.amount), 0);
  }

  fetchSuggestions(term: string, field: 'name' | 'mobile') {
    this.activeField = field;
    this.customerService.getAll(term).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.suggestions = res.data;
          this.showSuggestions = this.suggestions.length > 0;
        } else {
          this.suggestions = [];
          this.showSuggestions = false;
        }
      },
      error: () => {
        this.suggestions = [];
        this.showSuggestions = false;
      }
    });
  }

  selectCustomer(cust: any) {
    this.customerId = cust._id;
    this.newOrderForm.patchValue({
      name: cust.name,
      mobile: cust.mobile,
      whatsapp: cust.whatsapp || '',
      address: cust.address || '',
      sameAsPhone: cust.mobile && cust.whatsapp && cust.mobile === cust.whatsapp
    });
    if (cust.mobile && cust.whatsapp && cust.mobile === cust.whatsapp) {
      this.newOrderForm.get('whatsapp')?.disable();
    } else {
      this.newOrderForm.get('whatsapp')?.enable();
    }
    this.showSuggestions = false;
    this.suggestions = [];
    this.activeField = null;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showSuggestions = false;
      this.showProductSuggestions = false;
    }
  }
}

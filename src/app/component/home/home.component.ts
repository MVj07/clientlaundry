import { Component, OnInit } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  businessName = 'Smart Laundry';
  today = new Date();
  greeting = 'Good Day';
  efficiencyRate = 96;
  workflows: any[] = [];
  todayDeliveries: any[] = [];

  // Full Financial & Operational KPI Set
  kpiCards: any[] = [];
  netProfitToday = 0;
  monthlyRevenue = 0;

  // Workflow Pipeline Summary
  statusSummary: any[] = [];
  totalPipelineOrders = 0;

  // Payment Breakdown Stats computed from loaded/recent orders
  paymentStats = {
    paidCount: 0,
    unpaidCount: 0,
    partialCount: 0,
    totalUnpaidAmount: 0,
    totalPaidAmount: 0,
    paidPercent: 0
  };

  // Top Items/Services in Queue computed from order items
  topServiceItems: { name: string, qty: number, percent: number, icon: string }[] = [];

  // Table Filters
  searchQuery = '';
  statusFilter = 'all';
  paymentFilter = 'all';
  loading = false;

  constructor(
    private order: newOrderService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.computeGreeting();
    this.getOrders();

    const workflowStr = localStorage.getItem('workflow');
    if (workflowStr) {
      try {
        this.workflows = JSON.parse(workflowStr);
      } catch (e) {
        this.workflows = [];
      }
    }

    this.loadDashboardMetrics();

    const storedStore = localStorage.getItem('store');
    if (storedStore) {
      this.businessName = storedStore;
    }
  }

  computeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Good Morning';
    } else if (hour < 17) {
      this.greeting = 'Good Afternoon';
    } else {
      this.greeting = 'Good Evening';
    }
  }

  getOrders() {
    this.loading = true;
    this.order.getAllOrders("", 1, 25).subscribe({
      next: (res) => {
        this.loading = false;
        this.orders = res.data || [];
        this.applyFilters();
        this.computeOrderStats();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadDashboardMetrics() {
    this.order.getDashboardMetrics().subscribe({
      next: (metrics) => {
        this.todayDeliveries = metrics.todayDeliveries || [];
        
        const rev = metrics.todayRevenue || 0;
        const exp = metrics.todayExpenses || 0;
        this.netProfitToday = rev - exp;
        this.monthlyRevenue = metrics.monthlyRevenue || 0;

        this.kpiCards = [
          { title: 'Today\'s Orders', value: metrics.todayOrdersCount || 0, subtitle: 'Received Today', icon: 'order', trend: '+12%', trendUp: true, colorClass: 'kpi-primary' },
          { title: 'Active Pipeline', value: metrics.activeOrdersCount || 0, subtitle: 'In Processing', icon: 'active', trend: 'Live Queue', trendUp: true, colorClass: 'kpi-info' },
          { title: 'Today\'s Revenue', value: '₹' + rev, subtitle: 'Gross Billings Today', icon: 'revenue', trend: '+18%', trendUp: true, colorClass: 'kpi-success' },
          { title: 'Today\'s Expenses', value: '₹' + exp, subtitle: 'Daily Operating Costs', icon: 'expense', trend: 'Optimized', trendUp: false, colorClass: 'kpi-warning' },
          { title: 'Net Profit Today', value: '₹' + this.netProfitToday, subtitle: 'Revenue minus Expenses', icon: 'profit', trend: this.netProfitToday >= 0 ? 'Profitable' : 'Deficit', trendUp: this.netProfitToday >= 0, colorClass: this.netProfitToday >= 0 ? 'kpi-profit' : 'kpi-loss' },
          { title: 'Monthly Sales', value: '₹' + this.monthlyRevenue, subtitle: 'Current Month Total', icon: 'monthly', trend: 'On Target', trendUp: true, colorClass: 'kpi-monthly' }
        ];

        let totalQueueCount = 0;
        const pendingCount = (metrics.statusCounts?.order_taken || 0) + (metrics.statusCounts?.confirm || 0);
        const trackingCount = (metrics.statusCounts?.washing || 0) + (metrics.statusCounts?.ironing || 0) + (metrics.statusCounts?.packing || 0) + (metrics.statusCounts?.in_progress || 0);
        const deliveryCount = (metrics.statusCounts?.deliver || 0) + (metrics.statusCounts?.delivery || 0);
        const pickupCount = (metrics.statusCounts?.pickup || 0);

        totalQueueCount = pendingCount + trackingCount + deliveryCount + pickupCount;
        if (totalQueueCount === 0 && metrics.activeOrdersCount > 0) {
          totalQueueCount = metrics.activeOrdersCount;
        }

        this.statusSummary = [
          { label: 'Pending Orders', identifier: 'pending', count: pendingCount, route: '/savepannel' },
          { label: 'Tracking Board Queue', identifier: 'tracking', count: trackingCount, route: '/orders' },
          { label: 'Door Delivery Queue', identifier: 'delivery', count: deliveryCount, route: '/delivery' },
          { label: 'Customer Pickup Queue', identifier: 'pickup', count: pickupCount, route: '/pickup' }
        ];
        this.totalPipelineOrders = totalQueueCount;
        
        if (totalQueueCount > 0 && metrics.todayOrdersCount > 0) {
          this.efficiencyRate = Math.min(100, Math.round(90 + (metrics.todayOrdersCount * 0.8)));
        }
      },
      error: (err) => {
        console.error('Error loading dashboard metrics', err);
      }
    });
  }

  computeOrderStats() {
    let paid = 0, unpaid = 0, partial = 0;
    let unpaidAmt = 0, paidAmt = 0;
    const itemMap: { [key: string]: number } = {};
    let totalItemsCount = 0;

    for (const ord of this.orders) {
      if (ord.paymentStatus === 'paid') {
        paid++;
        paidAmt += (ord.billAmount || 0);
      } else if (ord.paymentStatus === 'partial') {
        partial++;
        unpaidAmt += (ord.billAmount || 0);
      } else {
        unpaid++;
        unpaidAmt += (ord.billAmount || 0);
      }

      if (ord.items && Array.isArray(ord.items)) {
        for (const item of ord.items) {
          const name = item.itemName || item.name || 'Garment Item';
          const qty = Number(item.qty || 1);
          itemMap[name] = (itemMap[name] || 0) + qty;
          totalItemsCount += qty;
        }
      }
    }

    const totalOrders = this.orders.length || 1;
    this.paymentStats = {
      paidCount: paid,
      unpaidCount: unpaid,
      partialCount: partial,
      totalUnpaidAmount: unpaidAmt,
      totalPaidAmount: paidAmt,
      paidPercent: Math.round((paid / totalOrders) * 100)
    };

    const iconsMap: { [key: string]: string } = {
      'shirt': '👕',
      'trouser': '👖',
      'pant': '👖',
      'saree': '👗',
      'dress': '👗',
      'coat': '🧥',
      'jacket': '🧥',
      'blanket': '🛏️',
      'bedsheet': '🛏️',
      'dry clean': '✨',
      'wash & iron': '🧺',
      'curtain': '🪟'
    };

    const sortedItems = Object.keys(itemMap).map(k => {
      const lower = k.toLowerCase();
      let icon = '👔';
      for (const key in iconsMap) {
        if (lower.includes(key)) {
          icon = iconsMap[key];
          break;
        }
      }
      return {
        name: k,
        qty: itemMap[k],
        percent: totalItemsCount > 0 ? Math.round((itemMap[k] / totalItemsCount) * 100) : 20,
        icon: icon
      };
    });
    sortedItems.sort((a, b) => b.qty - a.qty);
    this.topServiceItems = sortedItems.slice(0, 4);
  }

  applyFilters() {
    this.filteredOrders = this.orders.filter(ord => {
      const q = this.searchQuery.trim().toLowerCase();
      const matchQuery = !q || 
        (ord.bill && ord.bill.toString().toLowerCase().includes(q)) ||
        (ord.customerId?.name && ord.customerId.name.toLowerCase().includes(q)) ||
        (ord.customerId?.mobile && ord.customerId.mobile.toLowerCase().includes(q));

      const matchStatus = this.statusFilter === 'all' || ord.status === this.statusFilter;
      const matchPayment = this.paymentFilter === 'all' || ord.paymentStatus === this.paymentFilter;

      return matchQuery && matchStatus && matchPayment;
    });
  }

  onFilterChange() {
    this.applyFilters();
  }

  getRouteForStage(stage: string): string {
    const routeMap: { [key: string]: string } = {
      'order_taken': '/savepannel',
      'confirm': '/savepannel',
      'pending': '/savepannel',
      'tracking': '/orders',
      'in_progress': '/orders',
      'washing': '/orders',
      'ironing': '/orders',
      'packing': '/orders',
      'deliver': '/delivery',
      'delivery': '/delivery',
      'pickup': '/pickup'
    };
    return routeMap[stage] || '/orders';
  }

  navigateToQueue(route: string) {
    if (route) {
      this.router.navigate([route]);
    }
  }

  getPercentage(count: number): number {
    if (!this.totalPipelineOrders || this.totalPipelineOrders <= 0) return 0;
    return Math.round((count / this.totalPipelineOrders) * 100);
  }

  getStatusBadgeClass(status: string): string {
    const map: any = {
      confirm: 'badge-confirm',
      washing: 'badge-washing',
      ironing: 'badge-ironing',
      packing: 'badge-packing',
      delivered: 'badge-delivered',
      order_taken: 'badge-confirm',
      deliver: 'badge-delivery',
      pickup: 'badge-pickup'
    };
    return map[status] || 'badge-secondary';
  }

  getPaymentBadgeClass(status: string): string {
    const map: any = {
      paid: 'badge-paid',
      partial: 'badge-partial',
      unpaid: 'badge-unpaid'
    };
    return map[status] || 'badge-unpaid';
  }
}




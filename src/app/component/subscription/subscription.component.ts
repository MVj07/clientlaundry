import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../services/subscription/subscription.service';
import { StorageService } from '../../services/storage.service';

declare let Razorpay: any;

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit {
  statusData: any = null;
  loading: boolean = true;
  processing: boolean = false;
  error: string | null = null;
  successMsg: string | null = null;

  constructor(
    private subscriptionService: SubscriptionService,
    private storageService: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchStatus();
  }

  get isActivePlan(): boolean {
    return this.statusData?.subscriptionStatus?.toLowerCase() === 'active';
  }

  get isTrialPlan(): boolean {
    return this.statusData?.subscriptionStatus?.toLowerCase() === 'trial';
  }

  fetchStatus(): void {
    this.loading = true;
    this.error = null;
    this.subscriptionService.getStatus().subscribe({
      next: (res) => {
        if (res.status && res.data) {
          this.statusData = res.data;
        } else {
          this.error = 'Could not load subscription details.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching subscription status:', err);
        this.error = err?.error?.message || 'Failed to connect to subscription service.';
        this.loading = false;
      }
    });
  }

  subscribeNow(planId: string = 'monthly_150'): void {
    if (typeof Razorpay === 'undefined') {
      this.error = 'Razorpay checkout script not loaded. Please check your internet connection.';
      return;
    }

    this.processing = true;
    this.error = null;
    this.successMsg = null;

    this.subscriptionService.createOrder(planId).subscribe({
      next: (orderRes) => {
        if (!orderRes.status || !orderRes.orderId) {
          this.error = 'Failed to generate Razorpay order ID.';
          this.processing = false;
          return;
        }

        const is200 = planId.includes('200') || orderRes.amount === 20000;
        const planName = is200 ? '₹200 All-In-One Pro Plan' : (planId.includes('300') ? '₹300 Enterprise Growth Plan' : '₹150 Starter Plan');
        const planPriceRs = is200 ? '200' : (planId.includes('300') ? '300' : '150');

        // If backend returned Sandbox Mock Mode (because RAZORPAY_KEY_ID is missing in .env)
        if (orderRes.mockMode) {
          const confirmSandbox = window.confirm(
            `[Sandbox Development Mode]\n\nNo live Razorpay keys (RAZORPAY_KEY_ID) detected in your .env file.\n\nClick OK to simulate a successful ₹${planPriceRs} payment verification and activate your 30-day ${planName} right now!`
          );
          if (confirmSandbox) {
            this.verifyPayment({
              razorpay_order_id: orderRes.orderId,
              razorpay_payment_id: 'pay_mock_' + Date.now(),
              razorpay_signature: 'mock_signature',
              mockMode: true,
              plan: planId
            });
          } else {
            this.processing = false;
            this.error = 'Sandbox checkout cancelled.';
          }
          return;
        }

        const options = {
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency,
          name: 'Laundry SaaS Pro',
          description: `Monthly Subscription (${planName})`,
          order_id: orderRes.orderId,
          prefill: {
            name: this.statusData?.name || 'Laundry Business Owner',
            email: this.statusData?.email || 'owner@laundrysaas.com'
          },
          theme: {
            color: is200 ? '#6366F1' : '#3B82F6'
          },
          handler: (response: any) => {
            this.verifyPayment({ ...response, plan: planId });
          },
          modal: {
            ondismiss: () => {
              this.processing = false;
              this.error = 'Payment checkout cancelled by user.';
            }
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: (err) => {
        console.error('Create order error:', err);
        this.error = err?.error?.message || 'Unable to initiate Razorpay checkout.';
        this.processing = false;
      }
    });
  }

  verifyPayment(paymentResponse: any): void {
    this.subscriptionService.verifyPayment({
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      mockMode: paymentResponse.mockMode,
      plan: paymentResponse.plan
    }).subscribe({
      next: (verifyRes) => {
        this.processing = false;
        if (verifyRes.status) {
          this.successMsg = verifyRes.message || 'Subscription successfully activated for 30 days!';
          this.fetchStatus();
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 2500);
        } else {
          this.error = verifyRes.message || 'Signature verification failed.';
        }
      },
      error: (err) => {
        console.error('Verify payment error:', err);
        this.processing = false;
        this.error = err?.error?.message || 'Payment verification failed.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}

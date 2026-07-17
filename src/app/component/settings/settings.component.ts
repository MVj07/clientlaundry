import { Component, OnInit } from '@angular/core';
import { newOrderService } from '../../services/newOrder/newOrder.service';
import { ToastrService } from 'ngx-toastr';
import { TagPrintService, ThermalTagSettings } from '../../services/tag-print/tag-print.service';
import { LoginService } from '../../services/login/login.service';
import { BusinessService } from '../../services/business/business.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  passwords = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  error = '';
  success = '';
  loading = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  tagSettings: ThermalTagSettings = {
    paperSize: '58mm',
    autoShowModalOnOrderCreate: true,
    showBarcode: true,
    showShopName: true,
    showKuriNo: true,
    showCustomerMobile: true,
    showDueDate: true,
    showInstructions: true,
    copiesPerPiece: 1
  };

  razorpayKeys = {
    razorpay_key_id: '',
    razorpay_key_secret: ''
  };
  keysLoading = false;
  showKeySecret = false;
  isKeySet = false;
  showOtpModal = false;
  razorpayOtp = '';
  otpLoading = false;

  employeesList: any[] = [];
  employeeForm = {
    name: '',
    username: '',
    email: '',
    password: ''
  };
  empLoading = false;
  showEmpPassword = false;

  constructor(
    private orderService: newOrderService,
    private toast: ToastrService,
    public tagPrintService: TagPrintService,
    private loginService: LoginService,
    private businessService: BusinessService
  ) { }

  ngOnInit(): void {
    this.tagSettings = this.tagPrintService.getSettings();
    this.loadEmployees();
    this.loadRazorpayKeys();
  }

  loadRazorpayKeys() {
    this.businessService.getOne().subscribe({
      next: (res: any) => {
        const data = res.data || res;
        if (data) {
          this.razorpayKeys.razorpay_key_id = data.razorpay_key_id || '';
          this.razorpayKeys.razorpay_key_secret = data.razorpay_key_secret || '';
          this.isKeySet = Boolean(data.isKeySet || data.razorpay_key_id || data.razorpay_key_secret);
        }
      },
      error: (err: any) => {
        console.error('Failed to load razorpay keys', err);
      }
    });
  }

  saveRazorpayKeys() {
    this.keysLoading = true;
    const payload = {
      ...this.razorpayKeys,
      otp: this.razorpayOtp || undefined
    };
    this.businessService.saveRazorpayKeys(payload).subscribe({
      next: (res: any) => {
        this.keysLoading = false;
        if (res.requiresOtp) {
          this.showOtpModal = true;
          this.requestRazorpayOtp();
          this.toast.info(res.message || 'Please verify email OTP to update existing Razorpay credentials.');
          return;
        }
        if (res.status || res.success) {
          this.toast.success(res.message || 'Razorpay API keys saved successfully!');
          this.showOtpModal = false;
          this.razorpayOtp = '';
          this.loadRazorpayKeys();
        } else {
          this.toast.error(res.message || 'Failed to save Razorpay keys');
        }
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to save Razorpay keys');
        this.keysLoading = false;
      }
    });
  }

  requestRazorpayOtp() {
    this.otpLoading = true;
    this.businessService.requestRazorpayOtp().subscribe({
      next: (res: any) => {
        this.otpLoading = false;
        this.toast.success(res.message || 'Verification code sent to your email!');
        if (res.devOtp) {
          this.toast.info(`[Security verification code sent to email]: ${res.devOtp}`, 'Code Sent', { timeOut: 15000 });
        }
      },
      error: (err: any) => {
        this.otpLoading = false;
        this.toast.error(err.error?.message || 'Failed to send verification code');
      }
    });
  }

  loadEmployees() {
    this.loginService.getEmployees().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.employeesList = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Failed to load employees', err);
      }
    });
  }

  createEmployee() {
    if (!this.employeeForm.name || !this.employeeForm.username || !this.employeeForm.email || !this.employeeForm.password) {
      this.toast.error('All staff fields are required!');
      return;
    }
    this.empLoading = true;
    this.loginService.createEmployee(this.employeeForm).subscribe({
      next: (res: any) => {
        this.toast.success(res.message || 'Staff employee created successfully!');
        this.employeeForm = { name: '', username: '', email: '', password: '' };
        this.empLoading = false;
        this.loadEmployees();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to create employee');
        this.empLoading = false;
      }
    });
  }

  deleteEmployee(id: any, empName: string) {
    if (confirm(`Are you sure you want to remove staff account "${empName}"? They will no longer be able to log in.`)) {
      this.loginService.deleteEmployee(id).subscribe({
        next: (res: any) => {
          this.toast.success(res.message || 'Employee removed successfully!');
          this.loadEmployees();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete employee');
        }
      });
    }
  }

  passwordsMatch(): boolean {
    return this.passwords.newPassword === this.passwords.confirmPassword;
  }

  onSubmit() {
    if (!this.passwordsMatch()) {
      this.error = 'New passwords does not match';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    let payload = {
      currentPassword: this.passwords.currentPassword,
      newPassword: this.passwords.newPassword,
      confirmPassword: this.passwords.confirmPassword,
      userId: localStorage.getItem('userId')
    }
    this.orderService.changePassword(payload).subscribe({
      next: (res) => {
        if (res) {
          this.toast.success(res.message);
          this.passwords = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
          this.loading = false;
        }
      },
      error: (err) => {
        this.toast.error(err.error.message);
        this.loading = false;
      }
    });
  }

  saveTagSettings() {
    this.tagPrintService.saveSettings(this.tagSettings);
    this.toast.success('Thermal printer & tag configuration saved!', '✅ Settings Saved');
  }

  testPrintSampleTag() {
    const sampleOrder = {
      bill: 'SAMPLE-101',
      kuri: '99',
      customerName: 'Demo Customer',
      phoneNumber: '9876543210',
      dueDate: new Date(Date.now() + 86400000 * 2),
      items: [
        { name: 'Shirt (Dry Clean)', qty: 2, amount: 50 },
        { name: 'Suit (3-Piece)', qty: 1, amount: 150 }
      ]
    };
    const sampleBusiness = {
      business_name: 'LAUNDRY SERVICE DEMO'
    };
    this.tagPrintService.printGarmentTags(sampleOrder, sampleBusiness, this.tagSettings);
  }
}

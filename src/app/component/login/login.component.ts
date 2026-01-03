import { Component } from '@angular/core';
import { Validators, FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { LoginService } from '../../services/login/login.service';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { BusinessService } from '../../services/business/business.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  registerForm: FormGroup;
  constructor(
    private readonly fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private storageService: StorageService,
    private businessService: BusinessService
  ) {
    this.registerForm = this.fb.group({
      name: new FormControl('', [Validators.required, Validators.minLength(3)]),
      password: new FormControl('', [Validators.required, Validators.minLength(3)]),
    });
  }

  getdata() {
    console.log(this.registerForm.value);
    if (this.registerForm.valid) {
      this.loginService.loginUser(this.registerForm.value).subscribe({
        next: (res) => {
          console.log('Login Success:', res);
          if (res.status) {
            this.storageService.setItem('authToken', res.token);
            this.storageService.setItem('userId', res.user._id);
            this.storageService.setItem('profile', res.user.is_profile_completed)
            if (res?.user?.is_profile_completed) {
              // console.log(res.user.is_profile_completed)
              this.businessService.getOne().subscribe({
                next: (res) => {
                  console.log(res)
                  this.storageService.setItem('store', res.data.business_name)
                  this.storageService.setItem('workflow', JSON.stringify(res.data.workflows))
                }, error: (err) => {
                  console.error('Login Error:', err);
                }
              })
              this.router.navigate(['/home'])
            } else {
              this.router.navigate(['/business_setup'])
            }
          }
        },
        error: (err) => {
          console.error('Login Error:', err);
        }
      });
    } else {
      console.warn('Form is invalid');
    }
  }

  get valuename() {
    return this.registerForm.get('name');
  }

  get valuepassword() {
    return this.registerForm.get('password');
  }
}

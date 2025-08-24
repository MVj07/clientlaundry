import { Component } from '@angular/core';
import { Validators, FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { LoginService } from '../../services/login/login.service';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';

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
    private storageService: StorageService
  ){
  this.registerForm = this.fb.group({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });
  }

  getdata() {
    console.log(this.registerForm.value);
    if (this.registerForm.valid) {
      this.loginService.loginUser(this.registerForm.value).subscribe({
        next: (res) => {
          console.log('Login Success:', res);
          if (res.status){
            this.storageService.setItem('authToken', res.token);
            this.router.navigate(['/home'])
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

import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../../services/login/login.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  constructor(private fb: FormBuilder, private toast: ToastrService, private userService: LoginService) { }
  submit: any = false;
  showPassword = false;
  showConfirmPassword = false;
  loading = false;

  signupForm = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmpassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  get form(){
    return this.signupForm?.controls
  }

  signup() {
    this.submit=true
    if (this.signupForm.valid) {
      console.log(this.signupForm.value);
      if (this.signupForm.value['password']!==this.signupForm.value['confirmpassword']){
        this.toast.error('Password and Confirm password not same.')
        return;
      }
      this.loading = true;
      this.userService.signup(this.signupForm.value).subscribe({
        next: (res)=>{
          this.toast.success('User created')
          this.loading = false;
        }, error: (err)=>{
          console.log(err)
          this.toast.error(err.error.message)
          this.loading = false;
          return
        }
      })
      // Call Signup API
    }else{
      return
    }
  }
}

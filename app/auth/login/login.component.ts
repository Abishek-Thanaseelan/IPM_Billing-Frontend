import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

formData = {
  loginId: '',
  password: ''
};

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private http: HttpClient
  ) { }

  login() {
    if (!this.formData.loginId || !this.formData.password) {
      this.toastr.warning('Please enter Email and Password', 'Validation');
      return;
    }

    this.http.post('http://localhost:5000/api/auth/login', this.formData)
    .subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        const role = res.user.role.toLowerCase();
        localStorage.setItem('role', role);

        this.toastr.success('Login Successful', 'Success');

        if (role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'Invalid Email or Password';
        this.toastr.error(msg, 'Login Failed');
      }
    });
  }

  showPassword = false;

togglePassword() {
  this.showPassword = !this.showPassword;
}

}

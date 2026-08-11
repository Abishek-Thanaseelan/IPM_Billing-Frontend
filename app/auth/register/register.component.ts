import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

constructor(private toastr: ToastrService,
   private http: HttpClient,
){}

registerData = {
  name: '',
  mobile: '',
  email: '',
  password: '',

};

showPassword = false;

togglePassword() {
  this.showPassword = !this.showPassword;
}

resetForm(): void {
  this.registerData = {
    name: '',
    mobile: '',
    email: '',
    password: '',
  
  };
}

register() {

  this.http.post(
    'http://localhost:5000/api/auth/register',
    this.registerData
  ).subscribe({

    next: (res: any) => {

      this.toastr.success(
        'User Registered Successfully'
      );

      this.resetForm();

    },

    error: (err: { error: { message: string | undefined; }; }) => {

      this.toastr.error(
        err.error.message
      );

    }

  });

}

allowOnlyDigits(event: KeyboardEvent): void {
  const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete'];

  const isNumber = /^[0-9]$/.test(event.key);

  if (!isNumber && !allowedKeys.includes(event.key)) {
    event.preventDefault();
  }
}
}

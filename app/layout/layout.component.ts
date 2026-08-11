import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  isSidebarOpen = false;
  userName: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    const saved = sessionStorage.getItem('sidebarOpen');
    if (saved === 'true') this.isSidebarOpen = true;
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        this.userName = parsed.name || '';
      } catch {}
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    sessionStorage.setItem('sidebarOpen', String(this.isSidebarOpen));
  }

  logout() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        sessionStorage.clear();
        Swal.fire({
          icon: 'success',
          title: 'Logged Out',
          text: 'Logout Successful',
          timer: 1500,
          showConfirmButton: false
        });
        this.router.navigateByUrl('/login');
      }
    });
  }
}

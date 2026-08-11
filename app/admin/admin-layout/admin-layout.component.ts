import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  isSidebarOpen = false;
  userName: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    const saved = sessionStorage.getItem('adminSidebar');
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
    sessionStorage.setItem('adminSidebar', String(this.isSidebarOpen));
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
        this.router.navigateByUrl('/login');
      }
    });
  }
}

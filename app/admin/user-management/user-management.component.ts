import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  loading = true;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService
  ) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (res: any) => { this.users = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  approve(id: string) {
    this.adminService.approveUser(id).subscribe({
      next: () => { this.toastr.success('User approved'); this.loadUsers(); },
      error: () => { this.toastr.error('Failed to approve'); }
    });
  }

  decline(id: string) {
    this.adminService.declineUser(id).subscribe({
      next: () => { this.toastr.success('User declined'); this.loadUsers(); },
      error: () => { this.toastr.error('Failed to decline'); }
    });
  }
}

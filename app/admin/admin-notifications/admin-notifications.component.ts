import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-notifications',
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.css']
})
export class AdminNotificationsComponent implements OnInit {
  notifications: any = {};
  loading = true;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getNotifications().subscribe({
      next: (res: any) => { this.notifications = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}

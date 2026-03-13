import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

interface Feature {
  icon: string;
  title: string;
  description: string;
  tag: string;
}

interface Stat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './welcomepage.html',
  styleUrls: ['./welcomepage.css'],
})
export class Welcomepage implements OnInit {
  showAnnouncement = true;

  features: Feature[] = [
    {
      icon: 'business_center',
      title: 'Organization-Based Workspaces',
      description:
        'Each organization gets its own isolated workspace. Your projects, teams, and data stay private and secure within your organization.',
      tag: 'Complete isolation',
    },
    {
      icon: 'admin_panel_settings',
      title: 'Admin Control Panel',
      description:
        'Organization admins have full control. Create user accounts, assign IDs, manage permissions, and oversee all projects from a centralized dashboard.',
      tag: 'Full admin access',
    },
    {
      icon: 'account_tree',
      title: 'Project Management',
      description:
        'Create and manage projects within your organization. Track progress from inception to completion with real-time updates visible only to your team.',
      tag: 'Organization-scoped',
    },
    {
      icon: 'task_alt',
      title: 'Task Assignment & Tracking',
      description:
        'Admins assign tasks to team members using their User IDs. Members update task status, and progress is calculated automatically in real-time.',
      tag: 'Auto progress tracking',
    },
    {
      icon: 'group_add',
      title: 'Team Member Management',
      description:
        'Admins add team members through the control panel, generate User IDs, and manage access. Members log in using Org ID + User ID + Password.',
      tag: 'Secure ID-based login',
    },
    {
      icon: 'security',
      title: 'Enterprise-Grade Security',
      description:
        'Multi-level authentication ensures only authorized users access your organization data. Complete privacy with organization-specific credentials.',
      tag: 'Bank-level security',
    },
  ];

  stats: Stat[] = [
    { value: '1K+', label: 'Organizations Registered' },
    { value: '50K+', label: 'Projects Managed' },
    { value: '200K+', label: 'Tasks Completed' },
    { value: '99.9%', label: 'Uptime Guaranteed' },
  ];

  constructor(private router: Router) { }

  ngOnInit(): void { }

  onGetStarted(): void {
    this.router.navigate(['/org-registration']);
  }

  onTryDemo(): void {
    this.router.navigate(['/login']);
  }

  closeAnnouncement(): void {
    this.showAnnouncement = false;
  }
}
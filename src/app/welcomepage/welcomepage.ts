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
      icon: 'groups',
      title: 'Team Management',
      description:
        'Build your team from registered members, assign roles, and keep everyone accountable under one roof.',
      tag: 'Manager controlled',
    },
    {
      icon: 'account_tree',
      title: 'Project Pipelines',
      description:
        'Create projects, define scope, set deadlines, and track them from New → Active → Completed in real time.',
      tag: 'Full lifecycle',
    },
    {
      icon: 'task_alt',
      title: 'Task Assignment',
      description:
        'Managers assign tasks to specific members. Members update status — progress calculates automatically.',
      tag: 'Auto progress %',
    },
    {
      icon: 'insights',
      title: 'Live Progress Tracking',
      description:
        'Every check-mark a team member makes instantly updates the project progress bar. No manual reporting.',
      tag: 'Real-time updates',
    },
    {
      icon: 'tune',
      title: 'Role-Based Access',
      description:
        'Managers see everything and control it. Members see their assigned work and update their own tasks.',
      tag: 'Manager & Member roles',
    },
    {
      icon: 'dark_mode',
      title: 'Built for Comfort',
      description:
        'Dark mode, light mode, accent colors and a clean interface designed to keep your team in flow.',
      tag: 'Fully customizable',
    },
  ];

  stats: Stat[] = [
    { value: '50K+', label: 'Projects Managed' },
    { value: '200K+', label: 'Tasks Completed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '10K+', label: 'Active Teams' },
  ];

  constructor(private router: Router) { }

  ngOnInit(): void { }

  onGetStarted(): void {
    this.router.navigate(['/signup']);
  }

  onTryDemo(): void {
    this.router.navigate(['/login']);
  }
}
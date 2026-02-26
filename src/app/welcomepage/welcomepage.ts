import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';

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
  selector: 'app-welcomepage',
  standalone: true,
  imports: [CommonModule, Footer, Navbar],
  templateUrl: './welcomepage.html',
  styleUrl: './welcomepage.css',
})
export class Welcomepage {

  showAnnouncement = true;

  features: Feature[] = [
    {
      icon: 'bolt',
      title: 'Lightning Fast',
      description:
        'Built on a zero-bloat architecture. Every action resolves in under 50ms — no spinners, no waiting.',
      tag: '< 50ms response',
    },
    {
      icon: 'feather',
      title: 'Featherweight',
      description:
        'Under 30KB total bundle. TaskFlow loads instantly even on the slowest connections.',
      tag: '< 30KB bundle',
    },
    {
      icon: 'devices',
      title: 'Syncs Everywhere',
      description:
        'Real-time sync across all your devices — desktop, tablet, or phone. Always in perfect sync.',
      tag: 'Real-time sync',
    },
    {
      icon: 'lock',
      title: 'Privacy First',
      description:
        'End-to-end encryption on all your tasks. Your data belongs to you — never sold, never shared.',
      tag: 'E2E encrypted',
    },
    {
      icon: 'palette',
      title: 'Fully Customizable',
      description:
        'Themes, labels, priorities, due dates — shape TaskFlow to match exactly how your brain works.',
      tag: 'Your way',
    },
    {
      icon: 'group',
      title: 'Team Ready',
      description:
        'Invite your team, assign tasks, track progress together — collaboration without the chaos.',
      tag: 'Up to 10 members free',
    },
  ];

  stats: Stat[] = [
    { value: '50K+', label: 'Active Users' },
    { value: '2M+', label: 'Tasks Completed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '< 50ms', label: 'Avg. Response' },
  ];

  constructor(private router: Router) { }

  ngOnInit(): void { }

  onGetStarted(): void {
    this.router.navigate(['/signup']);
  }

  onTryDemo(): void {
    this.router.navigate(['/demo']);
  }
}
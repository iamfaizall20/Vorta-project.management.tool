import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface Member {
  name: string;
  initials: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'new' | 'active' | 'hold' | 'completed' | 'cancelled';
  color: string;
  tasksCompleted: number;
  tasksTotal: number;
  members: Member[];
  dueDate: string;
}

interface StatCard {
  icon: string;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  trend: string;
  trendUp: boolean;
}

interface Task {
  id: string;
  name: string;
  project: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
}

interface Activity {
  initials: string;
  color: string;
  actor: string;
  action: string;
  target: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements OnInit {

  // ── Current user ──────────────────────────────────────────────
  user: any = {};
  currentUser = {
    name: '',
    firstName: '',
    initials: '',
  };

  // ── UI state ──────────────────────────────────────────────────
  searchQuery = '';
  projectQuery = '';
  searchOpen = false;
  viewMode: 'kanban' | 'list' = 'kanban';
  activeFilter = 'all';
  unreadCount = 3;

  // ── Time greeting ─────────────────────────────────────────────
  get timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  // ── Filters ───────────────────────────────────────────────────
  filters = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'New', value: 'new' },
    { label: 'On Hold', value: 'hold' },
    { label: 'Completed', value: 'completed' },
  ];

  // ── Kanban columns ────────────────────────────────────────────
  kanbanColumns = [
    { status: 'new', label: 'New', color: '#A1A1AA' },
    { status: 'active', label: 'Active', color: '#30A46C' },
    { status: 'hold', label: 'On Hold', color: '#F59E0B' },
    { status: 'completed', label: 'Completed', color: '#5B5BD6' },
  ];

  // ── Mock Projects ─────────────────────────────────────────────
  projects: Project[] = [
    {
      id: 'p1',
      name: 'Backend API v2',
      description: 'REST API refactor with new auth layer and rate limiting.',
      status: 'active',
      color: '#5B5BD6',
      tasksCompleted: 8,
      tasksTotal: 12,
      dueDate: '2025-03-15',
      members: [
        { name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6' },
        { name: 'Ali Raza', initials: 'AR', color: '#E54D2E' },
        { name: 'Sara Zeb', initials: 'SZ', color: '#30A46C' },
      ],
    },
    {
      id: 'p2',
      name: 'Mobile App Redesign',
      description: 'Full UI overhaul for iOS and Android with new design system.',
      status: 'active',
      color: '#E54D2E',
      tasksCompleted: 3,
      tasksTotal: 10,
      dueDate: '2025-04-01',
      members: [
        { name: 'Sara Zeb', initials: 'SZ', color: '#30A46C' },
        { name: 'Omar Farooq', initials: 'OF', color: '#F59E0B' },
        { name: 'Aisha Malik', initials: 'AM', color: '#E54D2E' },
        { name: 'Bilal Khan', initials: 'BK', color: '#5B5BD6' },
        { name: 'Nadia Hussain', initials: 'NH', color: '#7C7CE8' },
      ],
    },
    {
      id: 'p3',
      name: 'Auth & Onboarding',
      description: 'Signup, login, email verification and onboarding flow.',
      status: 'completed',
      color: '#30A46C',
      tasksCompleted: 9,
      tasksTotal: 9,
      dueDate: '2025-02-01',
      members: [
        { name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6' },
        { name: 'Ali Raza', initials: 'AR', color: '#E54D2E' },
      ],
    },
    {
      id: 'p4',
      name: 'Design System',
      description: 'Component library, tokens and documentation for Vorta UI.',
      status: 'hold',
      color: '#F59E0B',
      tasksCompleted: 4,
      tasksTotal: 15,
      dueDate: '2025-05-10',
      members: [
        { name: 'Sara Zeb', initials: 'SZ', color: '#30A46C' },
        { name: 'Aisha Malik', initials: 'AM', color: '#E54D2E' },
      ],
    },
    {
      id: 'p5',
      name: 'Analytics Dashboard',
      description: 'Usage metrics, funnel analysis and reporting for the product team.',
      status: 'new',
      color: '#7C7CE8',
      tasksCompleted: 0,
      tasksTotal: 8,
      dueDate: '2025-06-01',
      members: [
        { name: 'Omar Farooq', initials: 'OF', color: '#F59E0B' },
      ],
    },
    {
      id: 'p6',
      name: 'Notification System',
      description: 'In-app and email notification engine with user preferences.',
      status: 'active',
      color: '#EC4899',
      tasksCompleted: 2,
      tasksTotal: 6,
      dueDate: '2025-03-28',
      members: [
        { name: 'Bilal Khan', initials: 'BK', color: '#5B5BD6' },
        { name: 'Nadia Hussain', initials: 'NH', color: '#7C7CE8' },
      ],
    },
  ];

  // ── Stats ─────────────────────────────────────────────────────
  stats: StatCard[] = [
    {
      icon: 'folder_open',
      iconBg: 'rgba(91,91,214,0.1)',
      iconColor: '#5B5BD6',
      value: '6',
      label: 'Total Projects',
      trend: '+2 this month',
      trendUp: true,
    },
    {
      icon: 'task_alt',
      iconBg: 'rgba(48,164,108,0.1)',
      iconColor: '#30A46C',
      value: '26',
      label: 'Tasks Completed',
      trend: '+8 this week',
      trendUp: true,
    },
    {
      icon: 'pending_actions',
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#F59E0B',
      value: '34',
      label: 'Tasks Remaining',
      trend: '-3 since yesterday',
      trendUp: false,
    },
    {
      icon: 'groups',
      iconBg: 'rgba(236,72,153,0.1)',
      iconColor: '#EC4899',
      value: '7',
      label: 'Team Members',
      trend: '+1 this month',
      trendUp: true,
    },
  ];

  // ── My Tasks Today ────────────────────────────────────────────
  myTasks: Task[] = [
    { id: 't1', name: 'Review API endpoints', project: 'Backend API v2', priority: 'high', done: false },
    { id: 't2', name: 'Update wireframes', project: 'Mobile Redesign', priority: 'medium', done: false },
    { id: 't3', name: 'Write unit tests', project: 'Backend API v2', priority: 'high', done: true },
    { id: 't4', name: 'Set up CI pipeline', project: 'Analytics Dashboard', priority: 'low', done: false },
    { id: 't5', name: 'Merge notification branch', project: 'Notification System', priority: 'medium', done: false },
  ];

  // ── Activity Feed ─────────────────────────────────────────────
  activities: Activity[] = [
    { initials: 'AR', color: '#E54D2E', actor: 'Ali Raza', action: 'completed task in', target: 'Backend API v2', time: '2m ago' },
    { initials: 'SZ', color: '#30A46C', actor: 'Sara Zeb', action: 'updated status of', target: 'Mobile Redesign', time: '18m ago' },
    { initials: 'FH', color: '#5B5BD6', actor: 'Faizal Hassan', action: 'created project', target: 'Analytics Dashboard', time: '1h ago' },
    { initials: 'OF', color: '#F59E0B', actor: 'Omar Farooq', action: 'was added to', target: 'Design System', time: '3h ago' },
    { initials: 'BK', color: '#5B5BD6', actor: 'Bilal Khan', action: 'marked task done in', target: 'Notification System', time: '5h ago' },
    { initials: 'AM', color: '#E54D2E', actor: 'Aisha Malik', action: 'commented on', target: 'Mobile Redesign', time: 'Yesterday' },
  ];

  // ── Computed ──────────────────────────────────────────────────
  get totalProjects(): number {
    return this.projects.length;
  }

  get activeProjectCount(): number {
    return this.projects.filter(p => p.status === 'active').length;
  }

  get myTasksToday(): number {
    return this.myTasks.filter(t => !t.done).length;
  }

  get filteredProjects(): Project[] {
    return this.projects.filter(p => {
      const matchesFilter = this.activeFilter === 'all' || p.status === this.activeFilter;
      const matchesQuery = p.name.toLowerCase().includes(this.projectQuery.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────
  constructor(private router: Router) { }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    const fullName = this.user.full_name || '';
    this.currentUser.name = fullName;
    this.currentUser.firstName = fullName.split(' ')[0] || '';
    this.currentUser.initials = (fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('') || '').toUpperCase();
  }

  // ── Methods ───────────────────────────────────────────────────
  getFilteredProjects(status: string): Project[] {
    return this.projects.filter(p => {
      const matchesStatus = p.status === status;
      const matchesQuery = p.name.toLowerCase().includes(this.projectQuery.toLowerCase());
      const matchesFilter = this.activeFilter === 'all' || this.activeFilter === status;
      return matchesStatus && matchesQuery && matchesFilter;
    });
  }

  getProgress(p: Project): number {
    if (p.tasksTotal === 0) return 0;
    return Math.round((p.tasksCompleted / p.tasksTotal) * 100);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  setFilter(value: string): void {
    this.activeFilter = value;
  }

  toggleTask(task: Task): void {
    task.done = !task.done;
  }

  toggleNotifications(): void {
    this.unreadCount = 0;
  }

  onNewProject(): void {
    this.router.navigate(['/app/projects/new']);
  }

  onOpenProject(id: string): void {
    this.router.navigate(['/app/projects', id]);
  }
}
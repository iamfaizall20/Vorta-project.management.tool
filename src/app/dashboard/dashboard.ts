import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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

  // ── Dashboard data ────────────────────────────────────────────
  projects: Project[] = [];
  stats: StatCard[] = [];
  myTasks: Task[] = [];
  activities: Activity[] = []; // Optional: keep empty if API doesn't provide

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
  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    const fullName = this.user.full_name || '';
    this.currentUser.name = fullName;
    this.currentUser.firstName = fullName.split(' ')[0] || '';
    this.currentUser.initials = (fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('') || '').toUpperCase();

    this.fetchDashboardData();
  }

  // ── Methods ───────────────────────────────────────────────────
  fetchDashboardData(): void {
    const orgId = localStorage.getItem('organization_id') || '';
    const body = {
      user_id: this.user.user_id,
      organization_id: orgId
    };

    this.http.post<any>('http://localhost/VortaAppApis/dashboard/get-dashboard.php', body, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    })
      .pipe(
        catchError(err => {
          console.error('Dashboard API error:', err);
          return of(null);
        })
      )
      .subscribe(res => {
        if (res && res.status === 'success') {
          const data = res.data;

          // ── Update stats ─────────────────────────────
          this.stats = [
            {
              icon: 'folder_open',
              iconBg: 'rgba(91,91,214,0.1)',
              iconColor: '#5B5BD6',
              value: String(data.summary.total_projects),
              label: 'Total Projects',
              trend: '',
              trendUp: true,
            },
            {
              icon: 'task_alt',
              iconBg: 'rgba(48,164,108,0.1)',
              iconColor: '#30A46C',
              value: String(data.summary.tasks_completed),
              label: 'Tasks Completed',
              trend: '',
              trendUp: true,
            },
            {
              icon: 'pending_actions',
              iconBg: 'rgba(245,158,11,0.1)',
              iconColor: '#F59E0B',
              value: String(data.summary.tasks_remaining),
              label: 'Tasks Remaining',
              trend: '',
              trendUp: false,
            },
            {
              icon: 'groups',
              iconBg: 'rgba(236,72,153,0.1)',
              iconColor: '#EC4899',
              value: String(data.summary.team_members),
              label: 'Team Members',
              trend: '',
              trendUp: true,
            },
          ];

          // ── Update projects ──────────────────────────
          this.projects = data.projects.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            color: p.color,
            tasksCompleted: p.tasksCompleted,
            tasksTotal: p.tasksTotal,
            dueDate: p.dueDate,
            members: p.members || [],
          }));

          // ── Update my tasks ─────────────────────────
          this.myTasks = data.my_tasks.map((t: any) => ({
            id: t.id,
            name: t.name,
            project: t.project,
            priority: t.priority,
            done: t.done,
          }));
        }
      });
  }

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
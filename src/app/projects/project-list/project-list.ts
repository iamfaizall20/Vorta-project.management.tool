import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, TitleCasePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Project } from '../project-detail/project-detail';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TitleCasePipe, SlicePipe],
  templateUrl: './project-list.html',
  styleUrls: ['./project-list.css'],
})
export class ProjectList implements OnInit {

  // ── State ──────────────────────────────────────────────────
  projects: Project[] = [];
  searchQuery = '';
  searchFocused = false;
  activeFilter = 'all';
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'name' | 'status' | 'progress' | 'dueDate' = 'name';

  // ── Context menu ───────────────────────────────────────────
  menuProject: Project | null = null;
  menuX = 0;
  menuY = 0;

  // ── Filters ────────────────────────────────────────────────
  filters = [
    { label: 'All', value: 'all', color: '' },
    { label: 'Active', value: 'active', color: '#30A46C' },
    { label: 'New', value: 'new', color: '#A1A1AA' },
    { label: 'On Hold', value: 'hold', color: '#F59E0B' },
    { label: 'Completed', value: 'completed', color: '#5B5BD6' },
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.loadProjects();
  }

  // ── Load from localStorage + merge with mock data ──────────
  loadProjects(): void {
    const stored: Project[] = JSON.parse(localStorage.getItem('vorta_projects') || '[]');

    // If no projects yet in localStorage, seed with mock data
    if (stored.length === 0) {
      this.projects = this.getMockProjects();
      localStorage.setItem('vorta_projects', JSON.stringify(this.projects));
    } else {
      this.projects = stored;
    }
  }

  getMockProjects(): Project[] {
    return [
      {
        id: 'p1', name: 'Backend API v2',
        description: 'REST API refactor with new auth layer and rate limiting.',
        status: 'active', color: '#5B5BD6', priority: 'high',
        dueDate: '2025-03-15', createdAt: new Date().toISOString(),
        members: [
          { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
          { id: 'u2', name: 'Ali Raza', initials: 'AR', color: '#E54D2E', role: 'Member' },
          { id: 'u3', name: 'Sara Zeb', initials: 'SZ', color: '#30A46C', role: 'Member' },
        ],
        tasks: [
          { id: 't1', projectId: 'p1', title: 'Design auth endpoints', description: '', assignee: null, priority: 'high', status: 'done', dueDate: '', createdAt: '' },
          { id: 't2', projectId: 'p1', title: 'Rate limiting', description: '', assignee: null, priority: 'high', status: 'inprogress', dueDate: '', createdAt: '' },
          { id: 't3', projectId: 'p1', title: 'Write docs', description: '', assignee: null, priority: 'medium', status: 'todo', dueDate: '', createdAt: '' },
        ],
      },
      {
        id: 'p2', name: 'Mobile App Redesign',
        description: 'Full UI overhaul for iOS and Android with new design system.',
        status: 'active', color: '#E54D2E', priority: 'medium',
        dueDate: '2025-04-01', createdAt: new Date().toISOString(),
        members: [
          { id: 'u3', name: 'Sara Zeb', initials: 'SZ', color: '#30A46C', role: 'Member' },
          { id: 'u4', name: 'Omar Farooq', initials: 'OF', color: '#F59E0B', role: 'Member' },
          { id: 'u5', name: 'Aisha Malik', initials: 'AM', color: '#EC4899', role: 'Member' },
          { id: 'u6', name: 'Bilal Khan', initials: 'BK', color: '#7C7CE8', role: 'Member' },
          { id: 'u7', name: 'Nadia H.', initials: 'NH', color: '#0EA5E9', role: 'Member' },
        ],
        tasks: [
          { id: 't4', projectId: 'p2', title: 'Wireframes', description: '', assignee: null, priority: 'high', status: 'done', dueDate: '', createdAt: '' },
          { id: 't5', projectId: 'p2', title: 'Components', description: '', assignee: null, priority: 'medium', status: 'inprogress', dueDate: '', createdAt: '' },
          { id: 't6', projectId: 'p2', title: 'Testing', description: '', assignee: null, priority: 'low', status: 'todo', dueDate: '', createdAt: '' },
        ],
      },
      {
        id: 'p3', name: 'Auth & Onboarding',
        description: 'Signup, login, email verification and onboarding flow.',
        status: 'completed', color: '#30A46C', priority: 'high',
        dueDate: '2025-02-01', createdAt: new Date().toISOString(),
        members: [
          { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
          { id: 'u2', name: 'Ali Raza', initials: 'AR', color: '#E54D2E', role: 'Member' },
        ],
        tasks: [
          { id: 't7', projectId: 'p3', title: 'Login page', description: '', assignee: null, priority: 'high', status: 'done', dueDate: '', createdAt: '' },
          { id: 't8', projectId: 'p3', title: 'Signup flow', description: '', assignee: null, priority: 'high', status: 'done', dueDate: '', createdAt: '' },
          { id: 't9', projectId: 'p3', title: 'Email verify', description: '', assignee: null, priority: 'high', status: 'done', dueDate: '', createdAt: '' },
        ],
      },
      {
        id: 'p4', name: 'Design System',
        description: 'Component library, tokens and documentation for Vorta UI.',
        status: 'hold', color: '#F59E0B', priority: 'low',
        dueDate: '2025-05-10', createdAt: new Date().toISOString(),
        members: [
          { id: 'u3', name: 'Sara Zeb', initials: 'SZ', color: '#30A46C', role: 'Member' },
          { id: 'u5', name: 'Aisha Malik', initials: 'AM', color: '#EC4899', role: 'Member' },
        ],
        tasks: [
          { id: 't10', projectId: 'p4', title: 'Token setup', description: '', assignee: null, priority: 'medium', status: 'done', dueDate: '', createdAt: '' },
          { id: 't11', projectId: 'p4', title: 'Button variants', description: '', assignee: null, priority: 'low', status: 'todo', dueDate: '', createdAt: '' },
        ],
      },
      {
        id: 'p5', name: 'Analytics Dashboard',
        description: 'Usage metrics, funnel analysis and reporting for the product team.',
        status: 'new', color: '#7C7CE8', priority: 'medium',
        dueDate: '2025-06-01', createdAt: new Date().toISOString(),
        members: [
          { id: 'u4', name: 'Omar Farooq', initials: 'OF', color: '#F59E0B', role: 'Member' },
        ],
        tasks: [],
      },
      {
        id: 'p6', name: 'Notification System',
        description: 'In-app and email notification engine with user preferences.',
        status: 'active', color: '#EC4899', priority: 'medium',
        dueDate: '2025-03-28', createdAt: new Date().toISOString(),
        members: [
          { id: 'u6', name: 'Bilal Khan', initials: 'BK', color: '#7C7CE8', role: 'Member' },
          { id: 'u7', name: 'Nadia H.', initials: 'NH', color: '#0EA5E9', role: 'Member' },
        ],
        tasks: [
          { id: 't12', projectId: 'p6', title: 'Email templates', description: '', assignee: null, priority: 'high', status: 'done', dueDate: '', createdAt: '' },
          { id: 't13', projectId: 'p6', title: 'Push service', description: '', assignee: null, priority: 'medium', status: 'inprogress', dueDate: '', createdAt: '' },
        ],
      },
    ];
  }

  // ── Computed ───────────────────────────────────────────────
  get activeCount(): number {
    return this.projects.filter(p => p.status === 'active').length;
  }

  get completedCount(): number {
    return this.projects.filter(p => p.status === 'completed').length;
  }

  getCountByStatus(status: string): number {
    if (status === 'all') return this.projects.length;
    return this.projects.filter(p => p.status === status).length;
  }

  get filteredProjects(): Project[] {
    let list = [...this.projects];

    // Filter by status
    if (this.activeFilter !== 'all') {
      list = list.filter(p => p.status === this.activeFilter);
    }

    // Search
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (this.sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'status': return a.status.localeCompare(b.status);
        case 'progress': return this.getProgress(b) - this.getProgress(a);
        case 'dueDate': return (a.dueDate || '').localeCompare(b.dueDate || '');
        default: return 0;
      }
    });

    return list;
  }

  // ── Helpers ────────────────────────────────────────────────
  getProgress(p: Project): number {
    if (!p.tasks || p.tasks.length === 0) return 0;
    const done = p.tasks.filter(t => t.status === 'done').length;
    return Math.round((done / p.tasks.length) * 100);
  }

  getCompletedTasks(p: Project): number {
    return (p.tasks || []).filter(t => t.status === 'done').length;
  }

  getPriorityIcon(priority: string): string {
    const map: Record<string, string> = {
      low: 'south', medium: 'remove', high: 'north', critical: 'priority_high'
    };
    return map[priority] ?? 'remove';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isOverdue(dateStr: string): boolean {
    return !!dateStr && new Date(dateStr) < new Date();
  }

  // ── Actions ────────────────────────────────────────────────
  setFilter(value: string): void {
    this.activeFilter = value;
  }

  clearFilters(): void {
    this.activeFilter = 'all';
    this.searchQuery = '';
  }

  openProject(id: string): void {
    this.router.navigate(['/app/projects', id]);
  }

  onNewProject(): void {
    this.router.navigate(['/app/projects/new']);
  }

  onEditProject(p: Project): void {
    this.router.navigate(['/app/projects', p.id, 'edit']);
  }

  onDeleteProject(p: Project): void {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    this.projects = this.projects.filter(proj => proj.id !== p.id);
    localStorage.setItem('vorta_projects', JSON.stringify(this.projects));
  }

  // ── Context menu ───────────────────────────────────────────
  onMenuClick(p: Project, event: MouseEvent): void {
    this.menuProject = p;
    this.menuX = event.clientX;
    this.menuY = event.clientY;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuProject = null;
  }
}
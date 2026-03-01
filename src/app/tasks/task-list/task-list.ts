import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface FlatTask {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'inprogress' | 'done' | 'blocked';
  dueDate: string;
  createdAt: string;
}

interface CalCell {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: FlatTask[];
}

interface DayPopup {
  label: string;
  tasks: FlatTask[];
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TitleCasePipe],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.css'],
})
export class TaskList implements OnInit {

  // ── State ──────────────────────────────────────────────────
  tasks: FlatTask[] = [];
  allProjects: { id: string; name: string }[] = [];
  viewMode: 'list' | 'kanban' | 'calendar' = 'list';
  searchQuery = '';
  searchFocused = false;
  activePriority = 'all';
  sortBy: 'dueDate' | 'priority' | 'project' | 'status' = 'dueDate';
  today = new Date().toISOString().split('T')[0];

  // ── Drawers ────────────────────────────────────────────────
  selectedTask: FlatTask | null = null;
  showCreate = false;
  creating = false;

  // ── Calendar state ─────────────────────────────────────────
  calYear = new Date().getFullYear();
  calMonth = new Date().getMonth();
  dayPopup: DayPopup | null = null;
  dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ── Groups open state ──────────────────────────────────────
  openGroups: Record<string, boolean> = {
    overdue: true, today: true, week: true, later: false, nodue: false,
  };

  // ── Draft ──────────────────────────────────────────────────
  draft = {
    title: '',
    description: '',
    projectId: '',
    priority: 'medium' as FlatTask['priority'],
    status: 'todo' as 'todo' | 'inprogress' | 'blocked',
    dueDate: '',
  };

  // ── Filter options ─────────────────────────────────────────
  priorityFilters = [
    { label: 'All', value: 'all' },
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  priorityOptions: { value: FlatTask['priority']; label: string; icon: string }[] = [
    { value: 'low', label: 'Low', icon: 'south' },
    { value: 'medium', label: 'Medium', icon: 'remove' },
    { value: 'high', label: 'High', icon: 'north' },
    { value: 'critical', label: 'Critical', icon: 'priority_high' },
  ];

  // ── Kanban columns ─────────────────────────────────────────
  kanbanCols = [
    { status: 'todo', label: 'To Do', color: '#A1A1AA' },
    { status: 'inprogress', label: 'In Progress', color: '#5B5BD6' },
    { status: 'blocked', label: 'Blocked', color: '#EF4444' },
    { status: 'done', label: 'Done', color: '#30A46C' },
  ];

  // ── Quick status actions ───────────────────────────────────
  quickStatuses: { value: FlatTask['status']; label: string; icon: string; color: string }[] = [
    { value: 'todo', label: 'Todo', icon: 'radio_button_unchecked', color: '#A1A1AA' },
    { value: 'inprogress', label: 'In Progress', icon: 'autorenew', color: '#5B5BD6' },
    { value: 'blocked', label: 'Blocked', icon: 'block', color: '#EF4444' },
    { value: 'done', label: 'Done', icon: 'check_circle', color: '#30A46C' },
  ];

  // ── Lifecycle ──────────────────────────────────────────────
  ngOnInit(): void {
    this.loadTasks();
    this.loadProjects();
  }

  // ── Load all tasks assigned to current user from projects ──
  loadTasks(): void {
    const projects = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
    const currentUserId = 'u1'; // Logged-in user
    const flat: FlatTask[] = [];

    for (const p of projects) {
      for (const t of (p.tasks || [])) {
        if (t.assignee?.id === currentUserId) {
          flat.push({
            id: t.id,
            projectId: p.id,
            projectName: p.name,
            title: t.title,
            description: t.description || '',
            priority: t.priority || 'medium',
            status: t.status,
            dueDate: t.dueDate || '',
            createdAt: t.createdAt || '',
          });
        }
      }
    }

    // If no tasks assigned yet, inject rich mock data for demo
    if (flat.length === 0) {
      this.tasks = this.getMockTasks();
    } else {
      this.tasks = flat;
    }
  }

  loadProjects(): void {
    const projects = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
    this.allProjects = projects.map((p: any) => ({ id: p.id, name: p.name }));
    if (this.allProjects.length === 0) {
      this.allProjects = [
        { id: 'p1', name: 'Backend API v2' },
        { id: 'p2', name: 'Mobile App Redesign' },
        { id: 'p3', name: 'Auth & Onboarding' },
        { id: 'p4', name: 'Design System' },
      ];
    }
  }

  getMockTasks(): FlatTask[] {
    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const twoDaysAgo = new Date(now); twoDaysAgo.setDate(now.getDate() - 2);
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const in3days = new Date(now); in3days.setDate(now.getDate() + 3);
    const in5days = new Date(now); in5days.setDate(now.getDate() + 5);
    const in10days = new Date(now); in10days.setDate(now.getDate() + 10);
    const in20days = new Date(now); in20days.setDate(now.getDate() + 20);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    return [
      { id: 't1', projectId: 'p1', projectName: 'Backend API v2', title: 'Fix CORS headers on staging', description: 'Preflight requests failing on /api/v2', priority: 'critical', status: 'blocked', dueDate: fmt(twoDaysAgo), createdAt: '' },
      { id: 't2', projectId: 'p3', projectName: 'Auth & Onboarding', title: 'Review OAuth callback handling', description: 'Check redirect URI mismatch on Google', priority: 'high', status: 'todo', dueDate: fmt(yesterday), createdAt: '' },
      { id: 't3', projectId: 'p1', projectName: 'Backend API v2', title: 'Write Swagger docs for /auth endpoints', description: '', priority: 'medium', status: 'inprogress', dueDate: fmt(now), createdAt: '' },
      { id: 't4', projectId: 'p2', projectName: 'Mobile App Redesign', title: 'Review home screen wireframes', description: 'Check spacing and icon alignment', priority: 'high', status: 'todo', dueDate: fmt(now), createdAt: '' },
      { id: 't5', projectId: 'p1', projectName: 'Backend API v2', title: 'Implement rate limiting middleware', description: 'Use express-rate-limit with Redis', priority: 'high', status: 'inprogress', dueDate: fmt(tomorrow), createdAt: '' },
      { id: 't6', projectId: 'p4', projectName: 'Design System', title: 'Define colour token palette', description: '', priority: 'medium', status: 'todo', dueDate: fmt(in3days), createdAt: '' },
      { id: 't7', projectId: 'p2', projectName: 'Mobile App Redesign', title: 'Design onboarding carousel', description: 'Three slides, skip button, CTA', priority: 'medium', status: 'todo', dueDate: fmt(in3days), createdAt: '' },
      { id: 't8', projectId: 'p1', projectName: 'Backend API v2', title: 'Set up CI/CD pipeline', description: 'GitHub Actions with staging deploy', priority: 'medium', status: 'todo', dueDate: fmt(in5days), createdAt: '' },
      { id: 't9', projectId: 'p3', projectName: 'Auth & Onboarding', title: 'Implement email verification flow', description: '', priority: 'high', status: 'done', dueDate: fmt(in5days), createdAt: '' },
      { id: 't10', projectId: 'p1', projectName: 'Backend API v2', title: 'Performance audit on DB queries', description: 'Focus on N+1 query issues', priority: 'low', status: 'todo', dueDate: fmt(in10days), createdAt: '' },
      { id: 't11', projectId: 'p2', projectName: 'Mobile App Redesign', title: 'Build component library in Figma', description: '', priority: 'low', status: 'todo', dueDate: fmt(in20days), createdAt: '' },
      { id: 't12', projectId: 'p1', projectName: 'Backend API v2', title: 'Design auth endpoints', description: 'POST /auth/login, /signup, /refresh', priority: 'high', status: 'done', dueDate: '', createdAt: '' },
    ];
  }

  // ── Computed: filtered + sorted ───────────────────────────
  get filteredTasks(): FlatTask[] {
    let list = [...this.tasks];

    if (this.activePriority !== 'all') {
      list = list.filter(t => t.priority === this.activePriority);
    }

    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (this.sortBy) {
        case 'dueDate': return (a.dueDate || 'z').localeCompare(b.dueDate || 'z');
        case 'priority': return this.priorityOrder(b.priority) - this.priorityOrder(a.priority);
        case 'project': return a.projectName.localeCompare(b.projectName);
        case 'status': return a.status.localeCompare(b.status);
        default: return 0;
      }
    });

    return list;
  }

  priorityOrder(p: string): number {
    return { low: 1, medium: 2, high: 3, critical: 4 }[p] ?? 0;
  }

  // ── Due-date bucketing ─────────────────────────────────────
  private isToday(d: string): boolean {
    return !!d && d === this.today;
  }

  isOverdue(d: string): boolean {
    return !!d && d < this.today;
  }

  private isThisWeek(d: string): boolean {
    if (!d || d <= this.today) return false;
    const end = new Date(); end.setDate(end.getDate() + 7);
    return new Date(d) <= end;
  }

  private isLater(d: string): boolean {
    if (!d) return false;
    const end = new Date(); end.setDate(end.getDate() + 7);
    return new Date(d) > end;
  }

  get overdueTasks(): FlatTask[] { return this.filteredTasks.filter(t => t.status !== 'done' && this.isOverdue(t.dueDate)); }
  get todayTasks(): FlatTask[] { return this.filteredTasks.filter(t => t.status !== 'done' && this.isToday(t.dueDate)); }
  get thisWeekTasks(): FlatTask[] { return this.filteredTasks.filter(t => t.status !== 'done' && this.isThisWeek(t.dueDate)); }
  get laterTasks(): FlatTask[] { return this.filteredTasks.filter(t => t.status !== 'done' && this.isLater(t.dueDate)); }
  get noDueTasks(): FlatTask[] { return this.filteredTasks.filter(t => !t.dueDate); }

  // ── Stats ──────────────────────────────────────────────────
  get overdueCount(): number { return this.tasks.filter(t => t.status !== 'done' && this.isOverdue(t.dueDate)).length; }
  get todayCount(): number { return this.tasks.filter(t => t.status !== 'done' && this.isToday(t.dueDate)).length; }
  get doneCount(): number { return this.tasks.filter(t => t.status === 'done').length; }
  get totalCount(): number { return this.tasks.length; }

  // ── Kanban ─────────────────────────────────────────────────
  getByStatus(status: string): FlatTask[] {
    return this.filteredTasks.filter(t => t.status === status);
  }

  // ── Helpers ────────────────────────────────────────────────
  getPriorityIcon(p: string): string {
    return { low: 'south', medium: 'remove', high: 'north', critical: 'priority_high' }[p] ?? 'remove';
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const date = new Date(d);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff <= 7) return `In ${diff} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ── Group toggle ───────────────────────────────────────────
  toggleGroup(key: string): void {
    this.openGroups[key] = !this.openGroups[key];
  }

  // ── Task actions ───────────────────────────────────────────
  toggleDone(t: FlatTask): void {
    this.setStatus(t, t.status === 'done' ? 'todo' : 'done');
  }

  setStatus(t: FlatTask, status: FlatTask['status']): void {
    t.status = status;
    if (this.selectedTask?.id === t.id) this.selectedTask = { ...t };
    this.saveTaskToProject(t);
  }

  saveTaskToProject(updated: FlatTask): void {
    const projects = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
    for (const p of projects) {
      for (const t of (p.tasks || [])) {
        if (t.id === updated.id) {
          t.status = updated.status;
        }
      }
    }
    localStorage.setItem('vorta_projects', JSON.stringify(projects));
  }

  // ── Drawers ────────────────────────────────────────────────
  openDetail(t: FlatTask): void {
    this.selectedTask = { ...t };
    this.showCreate = false;
  }

  openCreate(defaultStatus: string = 'todo'): void {
    this.draft = { title: '', description: '', projectId: '', priority: 'medium', status: defaultStatus as any, dueDate: '' };
    this.showCreate = true;
    this.selectedTask = null;
  }

  closeCreate(): void { this.showCreate = false; }

  onCreateTask(form: NgForm): void {
    if (form.invalid) return;
    this.creating = true;
    setTimeout(() => {
      const project = this.allProjects.find(p => p.id === this.draft.projectId);
      const newTask: FlatTask = {
        id: 't' + Date.now(),
        projectId: this.draft.projectId,
        projectName: project?.name || '',
        title: this.draft.title.trim(),
        description: this.draft.description.trim(),
        priority: this.draft.priority,
        status: this.draft.status,
        dueDate: this.draft.dueDate,
        createdAt: new Date().toISOString(),
      };
      this.tasks = [newTask, ...this.tasks];

      // Also add to the corresponding project in localStorage
      if (this.draft.projectId) {
        const projects = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
        const proj = projects.find((p: any) => p.id === this.draft.projectId);
        if (proj) {
          proj.tasks = proj.tasks || [];
          proj.tasks.push({ ...newTask, assignee: { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' } });
          localStorage.setItem('vorta_projects', JSON.stringify(projects));
        }
      }

      this.creating = false;
      this.showCreate = false;
    }, 800);
  }

  onEditTask(t: FlatTask): void {
    this.selectedTask = null;
    this.draft = {
      title: t.title,
      description: t.description,
      projectId: t.projectId,
      priority: t.priority,
      status: t.status as any,
      dueDate: t.dueDate,
    };
    this.showCreate = true;
  }

  onDeleteTask(t: FlatTask): void {
    if (!confirm(`Delete "${t.title}"?`)) return;
    this.tasks = this.tasks.filter(task => task.id !== t.id);
    this.selectedTask = null;

    // Remove from project too
    const projects = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
    for (const p of projects) {
      p.tasks = (p.tasks || []).filter((pt: any) => pt.id !== t.id);
    }
    localStorage.setItem('vorta_projects', JSON.stringify(projects));
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.activePriority = 'all';
  }

  // ── Calendar ───────────────────────────────────────────────
  get calMonthLabel(): string {
    return new Date(this.calYear, this.calMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    this.calMonth--;
    if (this.calMonth < 0) { this.calMonth = 11; this.calYear--; }
  }

  nextMonth(): void {
    this.calMonth++;
    if (this.calMonth > 11) { this.calMonth = 0; this.calYear++; }
  }

  goToToday(): void {
    const now = new Date();
    this.calYear = now.getFullYear();
    this.calMonth = now.getMonth();
  }

  get calendarCells(): CalCell[] {
    const firstDay = new Date(this.calYear, this.calMonth, 1);
    const lastDay = new Date(this.calYear, this.calMonth + 1, 0);
    const todayStr = this.today;

    const cells: CalCell[] = [];
    // Leading empty days
    for (let i = 0; i < firstDay.getDay(); i++) {
      const d = new Date(firstDay); d.setDate(d.getDate() - (firstDay.getDay() - i));
      cells.push({ day: d.getDate(), date: d, isCurrentMonth: false, isToday: false, tasks: [] });
    }

    // Days in current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.calYear, this.calMonth, d);
      const dateStr = date.toISOString().split('T')[0];
      const tasks = this.tasks.filter(t => t.dueDate === dateStr);
      cells.push({ day: d, date, isCurrentMonth: true, isToday: dateStr === todayStr, tasks });
    }

    // Trailing empty days to fill last row
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(lastDay); d.setDate(d.getDate() + i);
        cells.push({ day: d.getDate(), date: d, isCurrentMonth: false, isToday: false, tasks: [] });
      }
    }

    return cells;
  }

  openDayTasks(cell: CalCell): void {
    this.dayPopup = {
      label: cell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      tasks: cell.tasks,
    };
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.selectedTask = null;
    this.showCreate = false;
    this.dayPopup = null;
  }
}
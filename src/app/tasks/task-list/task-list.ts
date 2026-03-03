import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../services/task-service';
import { UserService } from '../../services/user-service';

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
  assignee?: { id: string; name: string } | null;
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

  constructor(private taskService: TaskService, private userService: UserService) { }

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
  createError: string | null = null;
  createSuccess: string | null = null;

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
    assigneeId: '',
    priority: 'medium' as FlatTask['priority'],
    status: 'todo' as 'todo' | 'inprogress' | 'blocked',
    dueDate: '',
  };

  // ── Users list (for assignee dropdown) ────────────────────
  allUsers: { id: string; name: string }[] = [];

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
    this.loadUsers();
  }

  // ── Load users via UserService ─────────────────────────────
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users: any[]) => {
        this.allUsers = users.map(u => ({ id: String(u.id), name: u.name }));
        if (!this.draft.assigneeId && this.allUsers.length) {
          this.draft.assigneeId = this.allUsers[0].id;
        }
      },
      error: () => {
        this.allUsers = [{ id: '1', name: 'Faizal Hassan' }];
        if (!this.draft.assigneeId) this.draft.assigneeId = '1';
      }
    });
  }

  // ── Load tasks from localStorage ───────────────────────────
  loadTasks(): void {
    const projects = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
    const currentUserId = 'u1';
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
            assignee: t.assignee || null,
          });
        }
      }
    }

    this.tasks = flat.length ? flat : this.getMockTasks();
  }

  // ── Load projects from localStorage ────────────────────────
  loadProjects(): void {
    const projects = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
    this.allProjects = projects.map((p: any) => ({ id: p.id, name: p.name }));
    if (!this.allProjects.length) {
      this.allProjects = [
        { id: 'p1', name: 'Backend API v2' },
        { id: 'p2', name: 'Mobile App Redesign' },
        { id: 'p3', name: 'Auth & Onboarding' },
        { id: 'p4', name: 'Design System' },
      ];
    }
  }

  // ── Mock tasks ────────────────────────────────────────────
  getMockTasks(): FlatTask[] { /* same as before, omitted for brevity */ return []; }

  // ── Filters & sorting ─────────────────────────────────────
  get filteredTasks(): FlatTask[] { /* same as before */ return []; }
  priorityOrder(p: string): number { return { low: 1, medium: 2, high: 3, critical: 4 }[p] ?? 0; }

  // ── Due-date helpers ──────────────────────────────────────
  private isToday(d: string): boolean { return !!d && d === this.today; }
  isOverdue(d: string): boolean { return !!d && d < this.today; }
  private isThisWeek(d: string): boolean { if (!d || d <= this.today) return false; const end = new Date(); end.setDate(end.getDate() + 7); return new Date(d) <= end; }
  private isLater(d: string): boolean { if (!d) return false; const end = new Date(); end.setDate(end.getDate() + 7); return new Date(d) > end; }

  get overdueTasks(): FlatTask[] { return this.filteredTasks.filter(t => t.status !== 'done' && this.isOverdue(t.dueDate)); }
  get todayTasks(): FlatTask[] { return this.filteredTasks.filter(t => t.status !== 'done' && this.isToday(t.dueDate)); }
  get thisWeekTasks(): FlatTask[] { return this.filteredTasks.filter(t => t.status !== 'done' && this.isThisWeek(t.dueDate)); }
  get laterTasks(): FlatTask[] { return this.filteredTasks.filter(t => t.status !== 'done' && this.isLater(t.dueDate)); }
  get noDueTasks(): FlatTask[] { return this.filteredTasks.filter(t => !t.dueDate); }

  get overdueCount(): number { return this.tasks.filter(t => t.status !== 'done' && this.isOverdue(t.dueDate)).length; }
  get todayCount(): number { return this.tasks.filter(t => t.status !== 'done' && this.isToday(t.dueDate)).length; }
  get doneCount(): number { return this.tasks.filter(t => t.status === 'done').length; }
  get totalCount(): number { return this.tasks.length; }

  getByStatus(status: string): FlatTask[] { return this.filteredTasks.filter(t => t.status === status); }

  getPriorityIcon(p: string): string { return { low: 'south', medium: 'remove', high: 'north', critical: 'priority_high' }[p] ?? 'remove'; }
  formatDate(d: string): string { /* same as before */ return ''; }

  toggleGroup(key: string): void { this.openGroups[key] = !this.openGroups[key]; }

  toggleDone(t: FlatTask): void { this.setStatus(t, t.status === 'done' ? 'todo' : 'done'); }
  setStatus(t: FlatTask, status: FlatTask['status']): void { t.status = status; if (this.selectedTask?.id === t.id) this.selectedTask = { ...t }; this.saveTaskToProject(t); }
  saveTaskToProject(updated: FlatTask): void { /* same as before */ }

  openDetail(t: FlatTask): void { this.selectedTask = { ...t }; this.showCreate = false; }

  openCreate(defaultStatus: string = 'todo'): void {
    this.draft = {
      title: '',
      description: '',
      projectId: this.allProjects[0]?.id || '',
      assigneeId: this.allUsers[0]?.id || '',
      priority: 'medium',
      status: defaultStatus as any,
      dueDate: '',
    };
    this.createError = null;
    this.createSuccess = null;
    this.showCreate = true;
    this.selectedTask = null;
  }

  closeCreate(): void {
    this.showCreate = false;
    this.createError = null;
    this.createSuccess = null;
  }

  onCreateTask(form: NgForm): void {
    if (form.invalid) return;

    this.creating = true;
    this.createError = null;
    this.createSuccess = null;

    const payload = {
      title: this.draft.title.trim(),
      description: this.draft.description.trim(),
      priority: this.draft.priority,
      status: this.draft.status,
      project_id: Number(this.draft.projectId),
      user_id: Number(this.draft.assigneeId),
      due_date: this.draft.dueDate || null,
    };

    this.taskService.createTask(payload).subscribe({
      next: (res: any) => {
        if (res?.success && res.task_id) {
          const project = this.allProjects.find(p => p.id === this.draft.projectId);
          const assignee = this.allUsers.find(u => u.id === this.draft.assigneeId);

          const newTask: FlatTask = {
            id: String(res.task_id),
            projectId: this.draft.projectId,
            projectName: project?.name ?? '',
            title: payload.title,
            description: payload.description,
            priority: this.draft.priority,
            status: this.draft.status,
            dueDate: this.draft.dueDate,
            createdAt: new Date().toISOString(),
            assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
          };

          this.tasks = [newTask, ...this.tasks];

          const projects = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
          const proj = projects.find((p: any) => p.id === this.draft.projectId);
          if (proj) {
            proj.tasks = proj.tasks || [];
            proj.tasks.push(newTask);
            localStorage.setItem('vorta_projects', JSON.stringify(projects));
          }

          this.creating = false;
          this.showCreate = false;
          this.createSuccess = 'Task created successfully!';
        } else {
          this.createError = res?.message ?? 'Failed to create task.';
          this.creating = false;
        }
      },
      error: (err) => {
        this.createError = err?.error?.message || 'Network error. Please try again.';
        this.creating = false;
      }
    });
  }

  onEditTask(t: FlatTask): void { /* same as before */ }
  onDeleteTask(t: FlatTask): void { /* same as before */ }
  clearFilters(): void { this.searchQuery = ''; this.activePriority = 'all'; }

  get calMonthLabel(): string { return new Date(this.calYear, this.calMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
  prevMonth(): void { this.calMonth--; if (this.calMonth < 0) { this.calMonth = 11; this.calYear--; } }
  nextMonth(): void { this.calMonth++; if (this.calMonth > 11) { this.calMonth = 0; this.calYear++; } }
  goToToday(): void { const now = new Date(); this.calYear = now.getFullYear(); this.calMonth = now.getMonth(); }

  get calendarCells(): CalCell[] { /* same as before */ return []; }
  openDayTasks(cell: CalCell): void { this.dayPopup = { label: cell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), tasks: cell.tasks }; }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.selectedTask = null; this.showCreate = false; this.dayPopup = null; }
}
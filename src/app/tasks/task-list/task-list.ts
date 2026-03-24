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
  teamName: string;
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
  allProjects: { id: string; name: string; members?: { id: string; name: string }[] }[] = [];
  viewMode: 'list' | 'kanban' | 'calendar' = 'list';
  searchQuery = '';
  searchFocused = false;
  activePriority = 'all';
  sortBy: 'dueDate' | 'priority' | 'project' | 'status' = 'dueDate';
  today = new Date().toISOString().split('T')[0];

  // ── Loading / error state ──────────────────────────────────
  isLoadingTasks = false;
  loadError: string | null = null;

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

  // ── Users list ─────────────────────────────────────────────
  allUsers: { id: string; name: string }[] = [];

  // ── Project members for current draft project ──────────────
  get projectMembers(): { id: string; name: string }[] {
    if (!this.draft.projectId) return this.allUsers;
    const proj = this.allProjects.find(p => p.id === this.draft.projectId);
    if (proj?.members?.length) return proj.members;
    return this.allUsers;
  }

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
        this.resetDraftAssignee();
      },
      error: () => {
        this.allUsers = [];
        this.resetDraftAssignee();
      }
    });
  }

  // ── Reset assignee to first available project member ───────
  private resetDraftAssignee(): void {
    const members = this.projectMembers;
    if (!this.draft.assigneeId && members.length) {
      this.draft.assigneeId = members[0].id;
    }
  }

  // ── Called when project dropdown changes ───────────────────
  onProjectChange(): void {
    const members = this.projectMembers;
    this.draft.assigneeId = members.length ? members[0].id : '';
  }

  // ── Normalize status from API response ────────────────────
  // API returns empty string or various status strings — map to valid FlatTask statuses
  private normalizeStatus(raw: string): FlatTask['status'] {
    const s = (raw || '').toLowerCase().trim();
    if (s === 'done' || s === 'completed' || s === 'complete') return 'done';
    if (s === 'inprogress' || s === 'in_progress' || s === 'in progress') return 'inprogress';
    if (s === 'blocked') return 'blocked';
    // Default empty / unknown → todo
    return 'todo';
  }

  // ── Normalize priority from API response ──────────────────
  private normalizePriority(raw: string): FlatTask['priority'] {
    const p = (raw || '').toLowerCase().trim();
    if (p === 'critical') return 'critical';
    if (p === 'high') return 'high';
    if (p === 'low') return 'low';
    return 'medium';
  }

  // ── Load tasks from API ────────────────────────────────────
  // Calls GET http://localhost/VortaAppApis/tasks/get.php?id=<userId>
  // Maps API shape: { task_id, task_description, status, priority, due_date, created_at,
  //                   user_id, project_name, team_name }
  loadTasks(): void {
    this.isLoadingTasks = true;
    this.loadError = null;

    // Retrieve the current user id — adjust the source to match your auth setup
    const currentUserId = Number(localStorage.getItem('vorta_user_id') || 23817);

    this.taskService.getTasks(currentUserId).subscribe({
      next: (res: any) => {
        this.isLoadingTasks = false;

        if (res?.success && Array.isArray(res.tasks)) {
          this.tasks = res.tasks.map((t: any): FlatTask => ({
            id: String(t.task_id),
            // project_name is the project identifier from the API
            projectId: t.project_name ?? '',
            projectName: t.project_name ?? '',
            teamName: t.team_name ?? '',
            // task_description is the task title in the API response
            title: t.task_description ?? '',
            description: '',
            priority: this.normalizePriority(t.priority),
            status: this.normalizeStatus(t.status),
            dueDate: t.due_date ? t.due_date.split(' ')[0] : '',
            createdAt: t.created_at ?? '',
            assignee: t.user_id ? { id: String(t.user_id), name: '' } : null,
          }));
        } else {
          this.tasks = [];
          this.loadError = res?.message ?? 'No tasks found.';
        }
      },
      error: (err) => {
        this.isLoadingTasks = false;
        this.tasks = [];
        this.loadError = err?.error?.message || 'Failed to load tasks. Please try again.';
        console.error('loadTasks error:', err);
      }
    });
  }

  // ── Load projects from localStorage ────────────────────────
  loadProjects(): void {
    const projects = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
    this.allProjects = projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      members: (p.members || []).map((m: any) => ({ id: String(m.id), name: m.name })),
    }));
  }

  // ── Filters & sorting ─────────────────────────────────────
  get filteredTasks(): FlatTask[] {
    let list = [...this.tasks];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        t.teamName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    if (this.activePriority !== 'all') {
      list = list.filter(t => t.priority === this.activePriority);
    }

    list.sort((a, b) => {
      switch (this.sortBy) {
        case 'priority':
          return this.priorityOrder(b.priority) - this.priorityOrder(a.priority);
        case 'project':
          return a.projectName.localeCompare(b.projectName);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'dueDate':
        default:
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
      }
    });

    return list;
  }

  priorityOrder(p: string): number {
    return ({ low: 1, medium: 2, high: 3, critical: 4 } as Record<string, number>)[p] ?? 0;
  }

  // ── Due-date helpers ──────────────────────────────────────
  private isToday(d: string): boolean { return !!d && d === this.today; }

  isOverdue(d: string): boolean { return !!d && d < this.today; }

  private isThisWeek(d: string): boolean {
    if (!d || d <= this.today) return false;
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return new Date(d) <= end;
  }

  private isLater(d: string): boolean {
    if (!d) return false;
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return new Date(d) > end;
  }

  get overdueTasks(): FlatTask[] {
    return this.filteredTasks.filter(t => t.status !== 'done' && this.isOverdue(t.dueDate));
  }
  get todayTasks(): FlatTask[] {
    return this.filteredTasks.filter(t => t.status !== 'done' && this.isToday(t.dueDate));
  }
  get thisWeekTasks(): FlatTask[] {
    return this.filteredTasks.filter(t => t.status !== 'done' && this.isThisWeek(t.dueDate));
  }
  get laterTasks(): FlatTask[] {
    return this.filteredTasks.filter(t => t.status !== 'done' && this.isLater(t.dueDate));
  }
  get noDueTasks(): FlatTask[] {
    return this.filteredTasks.filter(t => !t.dueDate);
  }

  get overdueCount(): number {
    return this.tasks.filter(t => t.status !== 'done' && this.isOverdue(t.dueDate)).length;
  }
  get todayCount(): number {
    return this.tasks.filter(t => t.status !== 'done' && this.isToday(t.dueDate)).length;
  }
  get doneCount(): number { return this.tasks.filter(t => t.status === 'done').length; }
  get totalCount(): number { return this.tasks.length; }

  getByStatus(status: string): FlatTask[] {
    return this.filteredTasks.filter(t => t.status === status);
  }

  getPriorityIcon(p: string): string {
    return ({ low: 'south', medium: 'remove', high: 'north', critical: 'priority_high' } as Record<string, string>)[p] ?? 'remove';
  }

  formatDate(d: string): string {
    if (!d) return '';
    // due_date from API may be "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
    const dateStr = d.split(' ')[0];
    const dt = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const diff = Math.round((dt.getTime() - now.setHours(0, 0, 0, 0)) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  toggleGroup(key: string): void { this.openGroups[key] = !this.openGroups[key]; }

  // ── Status helpers ────────────────────────────────────────
  toggleDone(t: FlatTask): void { this.setStatus(t, t.status === 'done' ? 'todo' : 'done'); }

  setStatus(t: FlatTask, status: FlatTask['status']): void {
    t.status = status;
    if (this.selectedTask?.id === t.id) this.selectedTask = { ...t };

    // Persist via API
    this.taskService.updateTaskStatus(Number(t.id), status).subscribe({
      error: (err) => console.error('updateTaskStatus error:', err)
    });
  }

  // ── Detail drawer ─────────────────────────────────────────
  openDetail(t: FlatTask): void {
    this.selectedTask = { ...t };
    this.showCreate = false;
  }

  // ── Create drawer ─────────────────────────────────────────
  openCreate(defaultStatus: string = 'todo'): void {
    const firstProject = this.allProjects[0];
    const firstMember = firstProject?.members?.[0] ?? this.allUsers[0];

    this.draft = {
      title: '',
      description: '',
      projectId: firstProject?.id || '',
      assigneeId: firstMember?.id || '',
      priority: 'medium',
      status: defaultStatus as 'todo' | 'inprogress' | 'blocked',
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

  // ── Create task via API ───────────────────────────────────
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
          const assignee = this.projectMembers.find(u => u.id === this.draft.assigneeId);

          const newTask: FlatTask = {
            id: String(res.task_id),
            projectId: this.draft.projectId,
            projectName: project?.name ?? '',
            teamName: '',
            title: payload.title,
            description: payload.description,
            priority: this.draft.priority,
            status: this.draft.status,
            dueDate: this.draft.dueDate,
            createdAt: new Date().toISOString(),
            assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
          };

          // Optimistic update
          this.tasks = [newTask, ...this.tasks];

          this.creating = false;
          this.showCreate = false;
          this.createSuccess = 'Task created successfully!';
          setTimeout(() => { this.createSuccess = null; }, 3000);

          // Reload from API to get fresh server state including team_name
          this.loadTasks();

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

  onEditTask(t: FlatTask): void {
    const idx = this.tasks.findIndex(x => x.id === t.id);
    if (idx !== -1) this.tasks[idx] = { ...t };
  }

  // ── Delete task ───────────────────────────────────────────
  onDeleteTask(t: FlatTask): void {
    this.tasks = this.tasks.filter(x => x.id !== t.id);
    if (this.selectedTask?.id === t.id) this.selectedTask = null;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.activePriority = 'all';
  }

  // ── Calendar ──────────────────────────────────────────────
  get calMonthLabel(): string {
    return new Date(this.calYear, this.calMonth, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
    const cells: CalCell[] = [];
    const firstDay = new Date(this.calYear, this.calMonth, 1);
    const lastDay = new Date(this.calYear, this.calMonth + 1, 0);
    const todayStr = this.today;

    for (let i = 0; i < firstDay.getDay(); i++) {
      const date = new Date(this.calYear, this.calMonth, -firstDay.getDay() + i + 1);
      cells.push({ day: date.getDate(), date, isCurrentMonth: false, isToday: false, tasks: [] });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.calYear, this.calMonth, d);
      const dateStr = date.toISOString().split('T')[0];
      const tasks = this.tasks.filter(t => t.dueDate && t.dueDate.split(' ')[0] === dateStr);
      cells.push({
        day: d,
        date,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        tasks,
      });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(this.calYear, this.calMonth + 1, i);
      cells.push({ day: i, date, isCurrentMonth: false, isToday: false, tasks: [] });
    }

    return cells;
  }

  openDayTasks(cell: CalCell): void {
    if (!cell.tasks.length) return;
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
import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// ── Interfaces ────────────────────────────────────────────────
export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignee: Member | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'inprogress' | 'done' | 'blocked';
  dueDate: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'new' | 'active' | 'hold' | 'completed' | 'cancelled';
  color: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  members: Member[];
  tasks: Task[];
  createdAt: string;
}

interface TaskDraft {
  title: string;
  description: string;
  assigneeId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'inprogress' | 'blocked';
  dueDate: string;
}

interface ActivityItem {
  initials: string;
  color: string;
  actor: string;
  action: string;
  target: string;
  time: string;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TitleCasePipe],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.css'],
})
export class ProjectDetail implements OnInit {

  project: Project | null = null;
  boardView: 'kanban' | 'list' = 'kanban';
  confirmDelete = false;
  showCreateTask = false;
  selectedTask: Task | null = null;
  taskCreating = false;
  today = new Date().toISOString().split('T')[0];

  // ── Task draft ─────────────────────────────────────────────
  taskDraft: TaskDraft = {
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
  };

  // ── Kanban columns ─────────────────────────────────────────
  taskColumns = [
    { status: 'todo', label: 'To Do', color: '#A1A1AA' },
    { status: 'inprogress', label: 'In Progress', color: '#5B5BD6' },
    { status: 'blocked', label: 'Blocked', color: '#EF4444' },
    { status: 'done', label: 'Done', color: '#30A46C' },
  ];

  // ── Quick status actions on card ───────────────────────────
  quickStatuses: { value: Task['status']; label: string; icon: string; color: string }[] = [
    { value: 'todo', label: 'Todo', icon: 'radio_button_unchecked', color: '#A1A1AA' },
    { value: 'inprogress', label: 'In Progress', icon: 'autorenew', color: '#5B5BD6' },
    { value: 'blocked', label: 'Blocked', icon: 'block', color: '#EF4444' },
    { value: 'done', label: 'Done', icon: 'check_circle', color: '#30A46C' },
  ];

  // ── Priority options ───────────────────────────────────────
  priorityOptions: { value: 'low' | 'medium' | 'high' | 'critical'; label: string; icon: string }[] = [
    { value: 'low', label: 'Low', icon: 'south' },
    { value: 'medium', label: 'Medium', icon: 'remove' },
    { value: 'high', label: 'High', icon: 'north' },
    { value: 'critical', label: 'Critical', icon: 'priority_high' },
  ];

  // ── Mock activity feed ─────────────────────────────────────
  activity: ActivityItem[] = [];

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Route ID:', id);

    const stored = JSON.parse(localStorage.getItem('vorta_projects') || '[]');
    console.log('All projects:', stored);

    this.loadProject(id!);
  }

  // ── Load project ───────────────────────────────────────────
  // Replace with ProjectService.getById(id) later
  loadProject(id: string): void {
    // First check localStorage (projects created via CreateProject)
    const stored = JSON.parse(localStorage.getItem('vorta_projects') || '[]') as Project[];
    let found = stored.find(p => p.id === id);

    // Fallback mock data for dev/demo
    if (!found) {
      found = this.getMockProject(id);
    }

    if (found) {
      // Ensure tasks array exists
      if (!found.tasks) found.tasks = [];
      this.project = found;
      this.buildActivity();
    }
  }

  getMockProject(id: string): Project {
    return {
      id,
      name: 'Backend API v2',
      description: 'REST API refactor with new auth layer, rate limiting and improved error handling across all endpoints.',
      status: 'active',
      color: '#5B5BD6',
      priority: 'high',
      dueDate: '2025-03-15',
      createdAt: new Date().toISOString(),
      members: [
        { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
        { id: 'u2', name: 'Ali Raza', initials: 'AR', color: '#E54D2E', role: 'Member' },
        { id: 'u3', name: 'Sara Zeb', initials: 'SZ', color: '#30A46C', role: 'Member' },
        { id: 'u4', name: 'Omar Farooq', initials: 'OF', color: '#F59E0B', role: 'Member' },
      ],
      tasks: [
        {
          id: 't1', projectId: id, title: 'Design auth endpoints', description: 'Define POST /auth/login, /auth/signup, /auth/refresh',
          assignee: { id: 'u2', name: 'Ali Raza', initials: 'AR', color: '#E54D2E', role: 'Member' },
          priority: 'high', status: 'done', dueDate: '2025-02-20', createdAt: new Date().toISOString(),
        },
        {
          id: 't2', projectId: id, title: 'Implement rate limiting', description: 'Use express-rate-limit with Redis store',
          assignee: { id: 'u3', name: 'Sara Zeb', initials: 'SZ', color: '#30A46C', role: 'Member' },
          priority: 'high', status: 'inprogress', dueDate: '2025-03-01', createdAt: new Date().toISOString(),
        },
        {
          id: 't3', projectId: id, title: 'Write API documentation', description: 'Swagger/OpenAPI spec for all endpoints',
          assignee: { id: 'u4', name: 'Omar Farooq', initials: 'OF', color: '#F59E0B', role: 'Member' },
          priority: 'medium', status: 'todo', dueDate: '2025-03-10', createdAt: new Date().toISOString(),
        },
        {
          id: 't4', projectId: id, title: 'Set up CI/CD pipeline', description: '',
          assignee: { id: 'u1', name: 'Faizal Hassan', initials: 'FH', color: '#5B5BD6', role: 'Manager' },
          priority: 'medium', status: 'todo', dueDate: '2025-03-05', createdAt: new Date().toISOString(),
        },
        {
          id: 't5', projectId: id, title: 'Fix CORS headers on staging', description: 'Preflight requests failing on /api/v2',
          assignee: { id: 'u2', name: 'Ali Raza', initials: 'AR', color: '#E54D2E', role: 'Member' },
          priority: 'critical', status: 'blocked', dueDate: '2025-02-25', createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  buildActivity(): void {
    if (!this.project) return;
    this.activity = [
      { initials: 'AR', color: '#E54D2E', actor: 'Ali Raza', action: 'marked done', target: 'Design auth endpoints', time: '2h ago' },
      { initials: 'SZ', color: '#30A46C', actor: 'Sara Zeb', action: 'started work on', target: 'Implement rate limiting', time: '5h ago' },
      { initials: 'FH', color: '#5B5BD6', actor: 'Faizal Hassan', action: 'created task', target: 'Set up CI/CD pipeline', time: '1d ago' },
    ];
  }

  // ── Computed ───────────────────────────────────────────────
  get completedCount(): number {
    return this.project?.tasks.filter(t => t.status === 'done').length ?? 0;
  }

  getProgress(): number {
    if (!this.project || this.project.tasks.length === 0) return 0;
    return Math.round((this.completedCount / this.project.tasks.length) * 100);
  }

  getTasksByStatus(status: string): Task[] {
    return this.project?.tasks.filter(t => t.status === status) ?? [];
  }

  getMemberTaskCount(memberId: string): number {
    return this.project?.tasks.filter(t => t.assignee?.id === memberId).length ?? 0;
  }

  get projectStats() {
    return [
      { icon: 'task_alt', label: 'Total tasks', value: this.project?.tasks.length ?? 0, color: '#5B5BD6', bg: 'rgba(91,91,214,0.1)' },
      { icon: 'check_circle', label: 'Completed', value: this.completedCount, color: '#30A46C', bg: 'rgba(48,164,108,0.1)' },
      { icon: 'autorenew', label: 'In progress', value: this.getTasksByStatus('inprogress').length, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
      { icon: 'block', label: 'Blocked', value: this.getTasksByStatus('blocked').length, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
      { icon: 'groups', label: 'Team members', value: this.project?.members.length ?? 0, color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
    ];
  }

  // ── Helpers ────────────────────────────────────────────────
  getPriorityIcon(priority: string): string {
    const map: Record<string, string> = { low: 'south', medium: 'remove', high: 'north', critical: 'priority_high' };
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

  // ── Task CRUD ──────────────────────────────────────────────
  openCreateTask(defaultStatus: string = 'todo'): void {
    this.taskDraft = { title: '', description: '', assigneeId: '', priority: 'medium', status: defaultStatus as any, dueDate: '' };
    this.showCreateTask = true;
    this.selectedTask = null;
  }

  closeCreateTask(): void {
    this.showCreateTask = false;
  }

  onCreateTask(form: NgForm): void {
    if (form.invalid || !this.project) return;
    this.taskCreating = true;

    setTimeout(() => {
      const assignee = this.project!.members.find(m => m.id === this.taskDraft.assigneeId) ?? null;
      const newTask: Task = {
        id: 't' + Date.now(),
        projectId: this.project!.id,
        title: this.taskDraft.title.trim(),
        description: this.taskDraft.description.trim(),
        assignee,
        priority: this.taskDraft.priority,
        status: this.taskDraft.status,
        dueDate: this.taskDraft.dueDate,
        createdAt: new Date().toISOString(),
      };

      this.project!.tasks = [...this.project!.tasks, newTask];
      this.saveProject();
      this.updateProjectStatus();

      // Add to activity
      this.activity.unshift({
        initials: 'FH', color: '#5B5BD6', actor: 'You',
        action: 'created task', target: newTask.title, time: 'Just now',
      });

      this.taskCreating = false;
      this.showCreateTask = false;
      form.resetForm();
    }, 800);
  }

  updateTaskStatus(task: Task, status: Task['status']): void {
    task.status = status;
    if (this.selectedTask?.id === task.id) {
      this.selectedTask = { ...task };
    }
    this.saveProject();
    this.updateProjectStatus();

    this.activity.unshift({
      initials: 'FH', color: '#5B5BD6', actor: 'You',
      action: status === 'done' ? 'completed' : `set to ${status}`,
      target: task.title, time: 'Just now',
    });
  }

  quickToggleDone(task: Task): void {
    this.updateTaskStatus(task, task.status === 'done' ? 'todo' : 'done');
  }

  onDeleteTask(task: Task): void {
    if (!this.project) return;
    this.project.tasks = this.project.tasks.filter(t => t.id !== task.id);
    this.selectedTask = null;
    this.saveProject();
    this.updateProjectStatus();
  }

  openTaskDetail(task: Task): void {
    this.selectedTask = { ...task };
    this.showCreateTask = false;
  }

  openTaskMenu(task: Task): void {
    this.openTaskDetail(task);
  }

  onEditTask(task: Task): void {
    // TODO: populate taskDraft and open create drawer in edit mode
    this.selectedTask = null;
    this.openCreateTask(task.status);
    this.taskDraft.title = task.title;
    this.taskDraft.description = task.description;
    this.taskDraft.assigneeId = task.assignee?.id ?? '';
    this.taskDraft.priority = task.priority;
    this.taskDraft.dueDate = task.dueDate;
  }

  // ── Auto-update project status based on tasks ──────────────
  updateProjectStatus(): void {
    if (!this.project || this.project.tasks.length === 0) return;
    const pct = this.getProgress();
    if (pct === 100) {
      this.project.status = 'completed';
    } else if (pct > 0 && this.project.status === 'new') {
      this.project.status = 'active';
    }
  }

  // ── Persist to localStorage ────────────────────────────────
  saveProject(): void {
    if (!this.project) return;
    const all = JSON.parse(localStorage.getItem('vorta_projects') || '[]') as Project[];
    const idx = all.findIndex(p => p.id === this.project!.id);
    if (idx !== -1) {
      all[idx] = this.project;
    } else {
      all.push(this.project);
    }
    localStorage.setItem('vorta_projects', JSON.stringify(all));
  }

  // ── Navigation ─────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/app/projects']);
  }

  onEditProject(): void {
    this.router.navigate(['/app/projects', this.project?.id, 'edit']);
  }

  onDeleteProject(): void {
    if (!this.project) return;
    const all = JSON.parse(localStorage.getItem('vorta_projects') || '[]') as Project[];
    const updated = all.filter(p => p.id !== this.project!.id);
    localStorage.setItem('vorta_projects', JSON.stringify(updated));
    this.router.navigate(['/app/projects']);
  }
}
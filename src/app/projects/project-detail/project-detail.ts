import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectsService } from '../../services/projects-service';
import { TaskService } from '../../services/task-service';

// ───────────────── Interfaces ─────────────────
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

// ───────────────── Component ─────────────────
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TitleCasePipe],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.css'],
})
export class ProjectDetail implements OnInit {

  project: Project | null = null;
  isLoading = true;
  boardView: 'kanban' | 'list' = 'kanban';
  confirmDelete = false;
  showCreateTask = false;
  selectedTask: Task | null = null;
  taskCreating = false;
  today = new Date().toISOString().split('T')[0];

  taskDraft: TaskDraft = {
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
  };

  taskColumns = [
    { status: 'todo', label: 'To Do', color: '#A1A1AA' },
    { status: 'inprogress', label: 'In Progress', color: '#5B5BD6' },
    { status: 'blocked', label: 'Blocked', color: '#EF4444' },
    { status: 'done', label: 'Done', color: '#30A46C' },
  ];

  quickStatuses: { value: Task['status']; label: string; icon: string; color: string }[] = [
    { value: 'todo', label: 'Todo', icon: 'radio_button_unchecked', color: '#A1A1AA' },
    { value: 'inprogress', label: 'In Progress', icon: 'autorenew', color: '#5B5BD6' },
    { value: 'blocked', label: 'Blocked', icon: 'block', color: '#EF4444' },
    { value: 'done', label: 'Done', icon: 'check_circle', color: '#30A46C' },
  ];

  priorityOptions: { value: Task['priority']; label: string; icon: string }[] = [
    { value: 'low', label: 'Low', icon: 'south' },
    { value: 'medium', label: 'Medium', icon: 'remove' },
    { value: 'high', label: 'High', icon: 'north' },
    { value: 'critical', label: 'Critical', icon: 'priority_high' },
  ];

  activity: ActivityItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectsService,
    private taskService: TaskService
  ) { }

  // ───────────────── Init ─────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.fetchProjectData(id);
      this.fetchTasks(Number(id));
    }
  }

  // ───────────────── Fetch Project ─────────────────
  fetchProjectData(id: string): void {
    this.isLoading = true;

    this.projectService.projectDetails(id).subscribe({
      next: (data) => {

        this.project = {
          ...data,
          tasks: [],
          members: data.members.map((m: any) => ({
            ...m,
            initials: this.getInitials(m.name),
            color: m.avatar || '#5B5BD6'
          }))
        };

        this.buildActivity();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.isLoading = false;
      }
    });
  }

  // ───────────────── Fetch Tasks ─────────────────
  fetchTasks(projectId: number): void {

    this.taskService.getTasks(projectId).subscribe({

      next: (res: any) => {

        if (!this.project) return;

        const mappedTasks: Task[] = res.tasks.map((t: any) => ({
          id: String(t.task_id),
          projectId: String(projectId),
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: this.mapBackendStatus(t.status),
          dueDate: t.due_date,
          createdAt: t.created_at,
          assignee: null
        }));

        this.project.tasks = mappedTasks;
      },

      error: (err) => {
        console.error('Fetch Tasks Error:', err);
      }

    });

  }

  private mapBackendStatus(status: string): Task['status'] {

    const map: Record<string, Task['status']> = {
      pending: 'todo',
      todo: 'todo',
      inprogress: 'inprogress',
      done: 'done',
      blocked: 'blocked'
    };

    return map[status] ?? 'todo';
  }

  private getInitials(name: string): string {
    return name
      ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
      : '??';
  }

  buildActivity(): void {
    if (!this.project) return;
    this.activity = [
      {
        initials: 'SYS',
        color: '#5B5BD6',
        actor: 'System',
        action: 'loaded project',
        target: this.project.name,
        time: 'Just now'
      }
    ];
  }

  // ───────────────── Computed ─────────────────
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

  // ───────────────── Helpers ─────────────────
  getPriorityIcon(priority: string): string {
    const map: Record<string, string> = {
      low: 'south',
      medium: 'remove',
      high: 'north',
      critical: 'priority_high'
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

  // ───────────────── Task CRUD ─────────────────
  openCreateTask(defaultStatus: string = 'todo'): void {
    this.taskDraft = {
      title: '',
      description: '',
      assigneeId: '',
      priority: 'medium',
      status: defaultStatus as TaskDraft['status'],
      dueDate: ''
    };
    this.showCreateTask = true;
    this.selectedTask = null;
  }

  closeCreateTask(): void {
    this.showCreateTask = false;
  }

  setTaskPriority(value: Task['priority']): void {
    this.taskDraft.priority = value;
  }

  onCreateTask(form: NgForm): void {
    if (form.invalid || !this.project) return;

    this.taskCreating = true;

    const taskBody = {
      title: this.taskDraft.title.trim(),
      description: this.taskDraft.description.trim(),
      priority: this.taskDraft.priority,
      status: 'pending',
      due_date: this.taskDraft.dueDate,
      project_id: Number(this.project.id),
      user_id: Number(this.taskDraft.assigneeId)
    };

    this.taskService.createTask(taskBody).subscribe({
      next: () => {
        alert("Task Added");
        this.fetchTasks(Number(this.project!.id));
        this.taskCreating = false;
        this.showCreateTask = false;
        form.resetForm();
      },
      error: (err: any) => {
        alert("Failed to add task");
        console.error('Create Task Error:', err);
        this.taskCreating = false;
      }
    });
  }

  updateTaskStatus(task: Task, status: Task['status']): void {

    const oldStatus = task.status;
    task.status = status;

    this.taskService.updateTaskStatus(Number(task.id), status).subscribe({

      next: () => {

        if (this.selectedTask?.id === task.id) {
          this.selectedTask = { ...task };
        }

        this.updateProjectStatus();

        this.activity.unshift({
          initials: 'FH',
          color: '#5B5BD6',
          actor: 'You',
          action: status === 'done' ? 'completed' : `set to ${status}`,
          target: task.title,
          time: 'Just now',
        });

      },

      error: (err) => {

        console.error("Status Update Failed", err);

        // revert if API fails
        task.status = oldStatus;

        alert("Failed to update task status");

      }

    });

  }

  quickToggleDone(task: Task): void {
    this.updateTaskStatus(task, task.status === 'done' ? 'todo' : 'done');
  }

  onEditTask(task: Task): void {
    this.openCreateTask(task.status);

    this.taskDraft = {
      title: task.title,
      description: task.description,
      assigneeId: task.assignee?.id ?? '',
      priority: task.priority,
      status: task.status as TaskDraft['status'],
      dueDate: task.dueDate,
    };
  }

  onDeleteTask(task: Task): void {
    if (!this.project) return;

    this.project.tasks = this.project.tasks.filter(t => t.id !== task.id);
    this.selectedTask = null;
    this.updateProjectStatus();
  }

  openTaskDetail(task: Task): void {
    this.selectedTask = { ...task };
    this.showCreateTask = false;
  }

  openTaskMenu(task: Task): void {
    this.openTaskDetail(task);
  }

  updateProjectStatus(): void {
    if (!this.project || this.project.tasks.length === 0) return;

    const pct = this.getProgress();

    if (pct === 100) {
      this.project.status = 'completed';
    } else if (pct > 0 && this.project.status === 'new') {
      this.project.status = 'active';
    }
  }

  // ───────────────── Navigation ─────────────────
  goBack(): void {
    this.router.navigate(['/app/projects']);
  }

  onEditProject(): void {
    this.router.navigate(['/app/projects', this.project?.id, 'edit']);
  }

  onDeleteProject(): void {
    const projectId: number = Number(this.route.snapshot.paramMap.get('id'));

    this.projectService.deleteProject(projectId).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.router.navigate(['/app/projects']);
      },
      error: (err: any) => {
        console.log('Error', err.message);
      }
    })
  }

}
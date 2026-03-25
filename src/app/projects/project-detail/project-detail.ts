import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskService } from '../../services/task-service';
import { ProjectsService } from '../../services/projects-service';

// ───────────────── Interfaces ─────────────────
export interface Member {
  id: string | number;
  name: string;
  initials: string;
  color: string;
  role?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title?: string;
  description: string;
  assignee: Member | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'inprogress' | 'done' | 'blocked';
  dueDate: string;
  createdAt?: string;
  teamId?: string;
}

export interface Team {
  teamId: string;
  teamName: string;
  tasks: Task[];
}

export interface ProjectStats {
  totalTasks: number;
  todo: number;
  inProgress: number;
  done: number;
  completedTasks: number;
  blocked: number
}

export interface Project {
  id: string | number;
  name: string;
  description: string;
  status: 'new' | 'active' | 'hold' | 'completed';
  color: string;
  priority: 'low' | 'medium' | 'mid' | 'high' | 'critical';
  dueDate: string;
  createdAt?: string;
  members: Member[];
  teams: Team[];
  stats: ProjectStats;
}

interface TaskDraft {
  title: string;
  description: string;
  assigneeId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'inprogress' | 'blocked';
  dueDate: string;
  teamId: string; // Added team selection
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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-detail.html',
  styleUrls: ['./project-detail.css'],
})
export class ProjectDetail implements OnInit {

  project: Project | null = null;
  isLoading = true;
  confirmDelete = false;
  showCreateTask = false;
  selectedTask: Task | null = null;
  taskCreating = false;
  isUserAdmin: boolean = false;
  today = new Date().toISOString().split('T')[0];

  // Team tabs
  selectedTeamId: string = 'all';

  taskDraft: TaskDraft = {
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    teamId: '' // Initialize team selection
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

    // Checking User Role
    const user = JSON.parse(localStorage.getItem('user')!);
    if (user.role === 'admin') {
      this.isUserAdmin = true;
    }

    console.log('🚀 ProjectDetail component initialized');
    const id = this.route.snapshot.paramMap.get('id');
    const organizationId = localStorage.getItem('organization_id');

    console.log('📍 Project ID from route:', id);
    console.log('🏢 Organization ID from localStorage:', organizationId);

    if (!organizationId) {
      console.error('❌ No organization_id found in localStorage');
      this.isLoading = false;
      this.router.navigate(['/app/projects']);
      return;
    }

    if (id) {
      this.fetchProjectData(id);
    } else {
      console.error('❌ No project ID in route params');
    }
  }

  // ───────────────── Fetch Project ─────────────────
  fetchProjectData(id: string): void {
    this.isLoading = true;
    console.log('🔍 Fetching project data for ID:', id);

    this.projectService.projectDetails(id).subscribe({
      next: (data: any) => {
        console.log('✅ Project data received:', data);
        console.log('📊 Stats:', data.stats);
        console.log('👥 Members count:', data.members?.length || 0);
        console.log('🏢 Teams count:', data.teams?.length || 0);

        // Map members with initials and colors
        const mappedMembers: Member[] = (data.members || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          initials: this.getInitials(m.name),
          color: this.generateColorFromName(m.name),
          role: m.role || 'Member'
        }));

        // Map teams and their tasks
        const mappedTeams: Team[] = (data.teams || []).map((team: any) => {
          const teamTasks: Task[] = (team.tasks || []).map((t: any) => {
            // Find assignee from members or use assignee_name from API
            let assignee: Member | null = null;

            if (t.assignee_id) {
              assignee = mappedMembers.find(m => m.id === t.assignee_id) || null;

              // If not found in members, create from assignee_name
              if (!assignee && t.assignee_name) {
                assignee = {
                  id: t.assignee_id,
                  name: t.assignee_name,
                  initials: this.getInitials(t.assignee_name),
                  color: this.generateColorFromName(t.assignee_name),
                  role: 'Member'
                };
              }
            }

            return {
              id: t.id,
              projectId: String(data.id),
              title: t.title || t.description,
              description: t.description,
              priority: t.priority,
              status: this.mapBackendStatus(t.status),
              dueDate: t.dueDate,
              createdAt: t.createdAt || '',
              teamId: team.teamId,
              assignee: assignee
            };
          });

          return {
            teamId: team.teamId,
            teamName: team.teamName,
            tasks: teamTasks
          };
        });

        this.project = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          status: data.status,
          color: data.color,
          priority: data.priority,
          dueDate: data.dueDate || '',
          createdAt: data.createdAt || '',

          members: mappedMembers,
          teams: mappedTeams,
          stats: data.stats || {
            totalTasks: 0,
            todo: 0,
            inProgress: 0,
            done: 0,
            completedTasks: 0
          }
        };

        console.log('✅ Project object created:', this.project);
        console.log('📋 Mapped members:', mappedMembers);
        console.log('🏢 Mapped teams:', mappedTeams);

        // Select first team by default if exists
        if (this.project.teams.length > 0) {
          this.selectedTeamId = 'all';
          console.log('✅ Selected team: all');
        } else {
          console.log('⚠️ No teams found');
        }

        this.buildActivity();
        this.isLoading = false;
        console.log('✅ Project loading complete');
      },
      error: (err: any) => {
        console.error('❌ API Error:', err);
        console.error('❌ Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });
        this.isLoading = false;
        alert('Failed to load project details');
        this.router.navigate(['/app/projects']);
      }
    });
  }

  private mapBackendStatus(status: string): Task['status'] {
    const statusMap: Record<string, Task['status']> = {
      'todo': 'todo',
      'pending': 'todo',
      'inprogress': 'inprogress',
      'in_progress': 'inprogress',
      'inProgress': 'inprogress',
      'done': 'done',
      'completed': 'done',
      'blocked': 'blocked'
    };
    return statusMap[status] || 'todo';
  }

  private getInitials(name: string): string {
    return name
      ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
      : '??';
  }

  // Generate a consistent color from a name
  private generateColorFromName(name: string): string {
    const colors = [
      '#5B5BD6', '#30A46C', '#F59E0B', '#E93D82',
      '#0091FF', '#8E4EC6', '#FF6B6B', '#4ECDC4',
      '#45B7D1', '#F38181', '#95E1D3', '#FFA07A'
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
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

  // ───────────────── Team Selection ─────────────────
  selectTeam(teamId: string): void {
    this.selectedTeamId = teamId;
  }

  get currentTasks(): Task[] {
    if (!this.project) return [];

    if (this.selectedTeamId === 'all') {
      // Return all tasks from all teams
      return this.project.teams.flatMap(team => team.tasks);
    }

    // Return tasks from selected team
    const team = this.project.teams.find(t => t.teamId === this.selectedTeamId);
    return team ? team.tasks : [];
  }

  get currentTeamName(): string {
    if (this.selectedTeamId === 'all') return 'All Teams';
    const team = this.project?.teams.find(t => t.teamId === this.selectedTeamId);
    return team ? team.teamName : '';
  }

  // ───────────────── Computed ─────────────────
  get completedCount(): number {
    return this.project?.stats.completedTasks ?? 0;
  }

  getProgress(): number {
    if (!this.project || this.project.stats.totalTasks === 0) return 0;
    return Math.round((this.project.stats.completedTasks / this.project.stats.totalTasks) * 100);
  }

  getTasksByStatus(status: string): Task[] {
    return this.currentTasks.filter(t => t.status === status);
  }

  getMemberTaskCount(memberId: string | number): number {
    if (!this.project) return 0;
    const allTasks = this.project.teams.flatMap(team => team.tasks);
    return allTasks.filter(t => t.assignee?.id === memberId).length;
  }

  get projectStats() {
    if (!this.project) return [];

    return [
      {
        icon: 'task_alt',
        label: 'Total tasks',
        value: this.project.stats.totalTasks,
        color: '#5B5BD6',
        bg: 'rgba(91,91,214,0.1)'
      },
      {
        icon: 'check_circle',
        label: 'Completed',
        value: this.project.stats.completedTasks,
        color: '#30A46C',
        bg: 'rgba(48,164,108,0.1)'
      },
      {
        icon: 'autorenew',
        label: 'In progress',
        value: this.project.stats.inProgress,
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.1)'
      },
      {
        icon: 'radio_button_unchecked',
        label: 'To Do',
        value: this.project.stats.todo,
        color: '#A1A1AA',
        bg: 'rgba(161,161,170,0.1)'
      },
      {
        icon: 'groups',
        label: 'Team members',
        value: this.project.members.length,
        color: '#EC4899',
        bg: 'rgba(236,72,153,0.1)'
      },
      {
        icon: 'workspaces',
        label: 'Teams',
        value: this.project.teams.length,
        color: '#0091FF',
        bg: 'rgba(0,145,255,0.1)'
      },
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
    // Pre-select the first team if user is viewing a specific team, otherwise leave empty
    const defaultTeamId = this.selectedTeamId !== 'all' ? this.selectedTeamId :
      (this.project?.teams.length ? this.project.teams[0].teamId : '');

    this.taskDraft = {
      title: '',
      description: '',
      assigneeId: '',
      priority: 'medium',
      status: defaultStatus as TaskDraft['status'],
      dueDate: '',
      teamId: defaultTeamId
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
    if (form.invalid || !this.project) {
      console.error('❌ Form invalid or no project');
      return;
    }

    // Get required IDs from localStorage and component state
    const organizationId = localStorage.getItem('organization_id');
    const userId = localStorage.getItem('user_id');

    // Validate required fields
    if (!organizationId) {
      console.error('❌ Missing organization_id in localStorage');
      alert('Unable to create task. Missing organization information.');
      return;
    }

    if (!this.taskDraft.teamId) {
      console.error('❌ Team not selected');
      alert('Please select a team for this task.');
      return;
    }

    if (!this.taskDraft.assigneeId) {
      console.error('❌ Assignee not selected');
      alert('Please assign this task to a team member.');
      return;
    }

    this.taskCreating = true;

    // Generate a unique task_id (you can modify this logic as needed)
    const taskId = `task-${Date.now()}`;

    // Prepare the complete task data with all required fields
    const taskBody = {
      organization_id: organizationId,
      project_id: String(this.project.id),
      team_id: this.taskDraft.teamId,
      task_id: taskId,
      user_id: Number(this.taskDraft.assigneeId),
      description: this.taskDraft.description.trim() || this.taskDraft.title.trim(),
      status: 'pending', // API expects 'pending' for new tasks
      priority: this.taskDraft.priority,
      due_date: this.taskDraft.dueDate
    };

    console.log('📤 Creating task with data:', taskBody);

    this.taskService.createTask(taskBody).subscribe({
      next: (response) => {
        console.log('✅ Task created successfully:', response);
        alert('Task created successfully!');

        // Reload project data to get the new task
        this.fetchProjectData(String(this.project!.id));

        this.taskCreating = false;
        this.showCreateTask = false;
        form.resetForm();
      },
      error: (err: any) => {
        console.error('❌ Create Task Error:', err);
        console.error('❌ Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error
        });
        alert('Failed to create task. Please try again.');
        this.taskCreating = false;
      }
    });
  }

  updateTaskStatus(task: Task, status: Task['status']): void {
    const oldStatus = task.status;
    task.status = status;

    // const taskId = task.id.includes('-') ? Number(task.id.split('-')[1]) : Number(task.id);

    this.taskService.updateTaskStatus(task.id, status).subscribe({
      next: () => {
        if (this.selectedTask?.id === task.id) {
          this.selectedTask = { ...task };
        }

        if (this.project) {
          const allTasks = this.project.teams.flatMap(t => t.tasks);
          this.project.stats.completedTasks = allTasks.filter(t => t.status === 'done').length;
          this.project.stats.todo = allTasks.filter(t => t.status === 'todo').length;
          this.project.stats.inProgress = allTasks.filter(t => t.status === 'inprogress').length;
        }

        this.activity.unshift({
          initials: 'YOU',
          color: '#5B5BD6',
          actor: 'You',
          action: status === 'done' ? 'completed' : `set to ${status}`,
          target: task.title || task.description,
          time: 'Just now',
        });
      },
      error: (err) => {
        console.error('❌ Status Update Failed:', err);
        task.status = oldStatus;
        alert('Failed to update task status');
      }
    });
  }

  quickToggleDone(task: Task): void {
    this.updateTaskStatus(task, task.status === 'done' ? 'todo' : 'done');
  }

  onEditTask(task: Task): void {
    this.openCreateTask(task.status);

    this.taskDraft = {
      title: task.title || '',
      description: task.description,
      assigneeId: String(task.assignee?.id ?? ''),
      priority: task.priority,
      status: task.status as TaskDraft['status'],
      dueDate: task.dueDate,
      teamId: task.teamId || ''
    };
  }

  onDeleteTask(task: Task): void {
    if (!this.project) return;

    // Ask for confirmation before deletion
    const confirmed = confirm("Delete the Task??");
    if (!confirmed) return;

    // Call the backend API to delete the task
    this.taskService.deleteTask(task.id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          // Remove the task from all teams in the project
          this.project!.teams.forEach(team => {
            team.tasks = team.tasks.filter(t => t.id !== task.id);
          });

          // Clear selected task if it was the deleted one
          if (this.selectedTask?.id === task.id) {
            this.selectedTask = null;
          }

          // Recalculate project stats
          if (!this.project || !this.project.teams) return;

          const allTasks = this.project.teams.flatMap(t => t.tasks);

          this.project.stats.totalTasks = allTasks.length;
          this.project.stats.completedTasks = allTasks.filter(t => t.status === 'done').length;
          this.project.stats.todo = allTasks.filter(t => t.status === 'todo').length;
          this.project.stats.inProgress = allTasks.filter(t => t.status === 'inprogress').length;
          this.project.stats.blocked = allTasks.filter(t => t.status === 'blocked').length;

          alert('Task Deleted Successfully');
        } else {
          alert('Failed to delete task');
        }
      },
      error: (err) => {
        console.error('Delete task error:', err);
        alert('An error occurred while deleting the task');
      }
    });
  }

  openTaskDetail(task: Task): void {
    this.selectedTask = { ...task };
    this.showCreateTask = false;
  }

  openTaskMenu(task: Task): void {
    this.openTaskDetail(task);
  }

  // ───────────────── Navigation ─────────────────
  goBack(): void {
    this.router.navigate(['/app/projects']);
  }

  onEditProject(): void {
    this.router.navigate(['/app/projects', this.project?.id, 'edit']);
  }

  onDeleteProject(): void {
    if (!this.project) return;

    const projectId = String(this.project.id);

    this.projectService.deleteProject(projectId).subscribe({
      next: (res: any) => {
        alert(res.message || 'Project deleted successfully');
        this.router.navigate(['/app/projects']);
      },
      error: (err: any) => {
        console.error('❌ Delete Error:', err);
        alert('Failed to delete project');
      }
    });
  }

}
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ProjectsService } from '../services/projects-service';
import { TaskService } from '../services/task-service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

interface RecentProject {
  id: number;
  name: string;
  color: string;
  status: 'active' | 'completed' | 'pending' | 'new';
}

// interface RecentItem {
//   icon: string;
//   label: string;
//   route: string;
// }

interface OrgStats {
  teams: number;
  members: number;
  projects: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class Sidebar implements OnInit {

  isCollapsed = false;
  projectsExpanded = true;
  recentsExpanded = true;
  createMenuExpanded = false;
  isUserAdmin = false;
  taskCount: number = 0;

  // ── Organization info ────────────────────────────────────────
  orgStats: OrgStats = {
    teams: 8,
    members: 42,
    projects: 15
  };

  // ── Main navigation (removed Teams and Members) ──────────────

  mainNav: NavItem[] = [
    { icon: 'grid_view', label: 'Dashboard', route: '/app/dashboard' },
    { icon: 'folder_open', label: 'Projects', route: '/app/projects' },
    { icon: 'task_alt', label: 'My Tasks', route: '/app/tasks' }
  ];

  // ── Recent projects ──────────────────────────────────────────
  recentProjects: RecentProject[] = [];

  onTeamCreated(team: any): void {
    console.log('New team created:', team);
    // You can emit this to parent component or handle it here
    // Example: refresh teams list, show notification, etc.
  }

  updateNavBadge() {
    console.log("Badge function called");
    const taskItem = this.mainNav.find(item => item.label === 'My Tasks');
    if (taskItem) {
      taskItem.badge = this.taskCount;

    }
  }

  onDialogClosed(): void {
    console.log('Team creation dialog closed');
  }

  constructor(private router: Router, private projectService: ProjectsService, private taskService: TaskService) { }

  ngOnInit(): void {
    const saved = localStorage.getItem('vorta_sidebar_collapsed');
    if (saved !== null) {
      this.isCollapsed = saved === 'true';
    }
    this.isUserAdmin = this.checkUserRole;
    this.getRecentProjects();
    this.loadOrgStats();
    this.countTasks();
  }

  countTasks() {
    console.log("Count function called");

    const user = JSON.parse(localStorage.getItem('user')!);

    this.taskService.getTasks(user.user_id).subscribe({
      next: (res: any) => {
        this.taskCount = res.tasks?.length || 0;
        console.log("API Called");

        this.updateNavBadge();
      },
      error: (err: any) => {
        console.log('Error', err);

      }
    })
  }

  get checkUserRole() {
    const user = JSON.parse(localStorage.getItem('user')!);

    return (user?.role === 'admin') ? true : false;

  }

  getRecentProjects() {
    this.projectService.projectDetails().subscribe({
      next: (res: any[]) => {
        if (res) {
          this.recentProjects = res.slice(0, 5).map(project => ({
            id: project.id,
            name: project.name,
            color: project.color,
            status: project.status
          }));

          // Update org stats with actual project count
          this.orgStats.projects = res.length;
        }
      },
      error: (err: any) => {
        console.log('Error', err.message);
      }
    });
  }

  loadOrgStats() {
    // TODO: Replace with actual API calls
    // This is placeholder data - you can update with real service calls
    this.orgStats = {
      teams: 8,
      members: 42,
      projects: this.orgStats.projects || 15
    };
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('vorta_sidebar_collapsed', String(this.isCollapsed));
    if (this.isCollapsed) {
      this.createMenuExpanded = false;
    }
  }

  toggleCreateMenu(): void {

    if (this.isCollapsed) {
      this.isCollapsed = false;
      localStorage.setItem('vorta_sidebar_collapsed', 'false');
    }

    this.createMenuExpanded = !this.createMenuExpanded;
  }
  onNewProject(): void {
    this.router.navigate(['/app/projects/new']);
    this.createMenuExpanded = false;
  }

  onNewTeam(): void {
    this.router.navigate(['/app/team/new']);
    this.createMenuExpanded = false;
  }

  onNewMember(): void {
    this.router.navigate(['/app/member/new']);
    this.createMenuExpanded = false;
  }

  onOrgClick(): void {
    this.router.navigate(['/app/organization']);
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ProjectsService } from '../services/projects-service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

interface RecentProject {
  id: string;
  name: string;
  color: string;
  status: 'active' | 'completed' | 'hold' | 'new';
}

interface RecentItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
})
export class Sidebar implements OnInit {
  isCollapsed = true;
  projectsExpanded = true;
  recentsExpanded = true;

  // ── Current user (replace with AuthService later) ────────────
  currentUser = {
    name: 'Faizal Hassan',
    role: 'Manager',
    initials: 'FH',
    avatar: null,
  };

  // ── Main navigation ──────────────────────────────────────────
  mainNav: NavItem[] = [
    { icon: 'grid_view', label: 'Dashboard', route: '/app/dashboard' },
    { icon: 'folder_open', label: 'Projects', route: '/app/projects' },
    { icon: 'task_alt', label: 'My Tasks', route: '/app/tasks', badge: 5 },
    { icon: 'groups', label: 'Teams', route: '/app/teams' },
    { icon: 'people', label: 'Members', route: '/app/members' },
  ];

  // ── Recent projects (replace with ProjectService later) ──────
  recentProjects: RecentProject[] = [];

  // ── Recent items ─────────────────────────────────────────────
  recentItems: RecentItem[] = [
    { icon: 'task_alt', label: 'Sprint Planning — Task #42', route: '/app/tasks' },
    { icon: 'folder', label: 'Backend API', route: '/app/projects/p1' },
    { icon: 'person', label: 'Ali Raza — Profile', route: '/app/members' },
  ];

  constructor(private router: Router, private projectService: ProjectsService) { }

  ngOnInit(): void {
    const saved = localStorage.getItem('vorta_sidebar_collapsed');
    if (saved !== null) {
      this.isCollapsed = saved === 'true';
    }

    const user = JSON.parse(localStorage.getItem('user')!);

    this.currentUser.name = user.full_name;
    this.getRecentProjects();
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
        }
      },
      error: (err: any) => {
        console.log('Error', err.message);
      }
    });
  }
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('vorta_sidebar_collapsed', String(this.isCollapsed));
  }

  onNewProject(): void {
    this.router.navigate(['/app/projects/new']);
  }

  onProfileClick(): void {
    this.router.navigate(['/app/profile']);
  }
}
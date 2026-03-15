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
  id: number;
  name: string;
  color: string;
  status: 'active' | 'completed' | 'pending' | 'new';
}

interface RecentItem {
  icon: string;
  label: string;
  route: string;
}

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
    { icon: 'task_alt', label: 'My Tasks', route: '/app/tasks', badge: 5 }
  ];

  // ── Recent projects ──────────────────────────────────────────
  recentProjects: RecentProject[] = [
    {
      id: 1,
      name: 'Website Redesign',
      color: '#4CAF50',
      status: 'active'
    },
    {
      id: 2,
      name: 'Mobile App UI',
      color: '#2196F3',
      status: 'active'
    },
    {
      id: 3,
      name: 'Backend API Development',
      color: '#FF9800',
      status: 'pending'
    },
    {
      id: 4,
      name: 'Marketing Landing Page',
      color: '#E91E63',
      status: 'completed'
    },
    {
      id: 5,
      name: 'Database Optimization',
      color: '#9C27B0',
      status: 'active'
    }
  ];

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

    this.getRecentProjects();
    this.loadOrgStats();
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
    this.router.navigate(['/app/teams/new']);
    this.createMenuExpanded = false;
  }

  onNewMember(): void {
    this.router.navigate(['/app/member/new']);
    this.createMenuExpanded = false;
  }

  onOrgClick(): void {
    // this.router.navigate(['/app/organization']);
  }
}
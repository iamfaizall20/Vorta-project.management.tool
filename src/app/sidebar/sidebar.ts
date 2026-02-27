import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

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
  recentProjects: RecentProject[] = [
    { id: 'p1', name: 'Backend API', color: '#5B5BD6', status: 'active' },
    { id: 'p2', name: 'Mobile Redesign', color: '#E54D2E', status: 'active' },
    { id: 'p3', name: 'Auth & Onboarding', color: '#30A46C', status: 'completed' },
    { id: 'p4', name: 'Design System', color: '#F76B15', status: 'hold' },
  ];

  // ── Recent items ─────────────────────────────────────────────
  recentItems: RecentItem[] = [
    { icon: 'task_alt', label: 'Sprint Planning — Task #42', route: '/app/tasks' },
    { icon: 'folder', label: 'Backend API', route: '/app/projects/p1' },
    { icon: 'person', label: 'Ali Raza — Profile', route: '/app/members' },
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    const saved = localStorage.getItem('vorta_sidebar_collapsed');
    if (saved !== null) {
      this.isCollapsed = saved === 'true';
    }
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
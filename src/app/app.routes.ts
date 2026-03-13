import { Routes } from '@angular/router';
import { Welcomepage } from './welcomepage/welcomepage';
import { OrgRegistrationComponent } from './org-registration/org-registration';
import { AppShell } from './app-shell/app-shell';
import { Dashboard } from './dashboard/dashboard';
import { ProjectList } from './projects/project-list/project-list';
import { ProjectDetail } from './projects/project-detail/project-detail';
import { CreateProject } from './projects/create-project/create-project';
import { TaskList } from './tasks/task-list/task-list';
import { TeamList } from './teams/team-list/team-list';
import { Members } from './members/members';
import { Profile } from './profile/profile';
import { Settings } from './settings/settings';
import { LoginComponent } from './login/login';

export const routes: Routes = [

  // ── Public routes (no sidebar) ──────────────────────────────
  { path: '', component: Welcomepage },
  { path: 'org-registration', component: OrgRegistrationComponent },
  { path: 'login', component: LoginComponent },

  // ── Authenticated shell (sidebar lives here) ─────────────────
  {
    path: 'app',
    component: AppShell,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },

      // Projects
      {
        path: 'projects',
        children: [
          { path: '', component: ProjectList },
          { path: 'new', component: CreateProject },  // ← MUST be before :id
          { path: ':id', component: ProjectDetail },
        ]
      },

      // Tasks
      { path: 'tasks', component: TaskList },

      // Teams — single page, drawers handle create/detail internally
      { path: 'teams', component: TeamList },

      // Members
      { path: 'members', component: Members },

      // Profile & Settings
      { path: 'profile', component: Profile },
      { path: 'settings', component: Settings },
    ]
  },

  // ── Fallback ─────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
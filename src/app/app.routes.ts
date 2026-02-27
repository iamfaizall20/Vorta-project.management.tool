import { Routes } from '@angular/router';
import { Welcomepage } from './welcomepage/welcomepage';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { AppShell } from './app-shell/app-shell';
import { Dashboard } from './dashboard/dashboard';
import { ProjectList } from './projects/project-list/project-list';
import { ProjectDetail } from './projects/project-detail/project-detail';
import { TaskList } from './tasks/task-list/task-list';
import { TeamList } from './teams/team-list/team-list';
import { Members } from './members/members';
import { Profile } from './profile/profile';
import { Settings } from './settings/settings';

export const routes: Routes = [

  // ── Public routes (no sidebar) ──────────────────────────────
  { path: '', component: Welcomepage },
  { path: 'signup', component: Signup },
  { path: 'login', component: Login },

  // ── Authenticated shell (sidebar lives here) ─────────────────
  {
    path: 'app',
    component: AppShell,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'projects', component: ProjectList },
      { path: 'projects/:id', component: ProjectDetail },
      { path: 'tasks', component: TaskList },
      { path: 'teams', component: TeamList },
      { path: 'members', component: Members },
      { path: 'profile', component: Profile },
      { path: 'settings', component: Settings },
    ]
  },

  // ── Fallback ─────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
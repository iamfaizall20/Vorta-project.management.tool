import { Routes } from '@angular/router';
import { Welcomepage } from './welcomepage/welcomepage';
import { Signup } from './signup/signup';
import { Login } from './login/login';
import { AppShell } from './app-shell/app-shell';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [

  // ── Public routes (no sidebar) ──────────────────────────────
  { path: '',       component: Welcomepage },
  { path: 'signup', component: Signup },
  { path: 'login',  component: Login },

  // ── Authenticated shell (sidebar lives here) ─────────────────
  {
    path: 'app',
    component: AppShell,
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },

      // Add these as you build them:
      // { path: 'projects',     component: ProjectList },
      // { path: 'projects/:id', component: ProjectDetail },
      // { path: 'tasks',        component: TaskList },
      // { path: 'teams',        component: TeamList },
      // { path: 'members',      component: Members },
      // { path: 'profile',      component: Profile },
      // { path: 'settings',     component: Settings },
    ]
  },

  // ── Fallback ─────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
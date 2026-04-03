import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './organization.html',
  styleUrls: ['./organization.css']
})
export class OrganizationComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────
  isDirty = false;
  saving = false;
  saveSuccess = false;
  activeSection: string | null = 'general';

  // ── Org data ───────────────────────────────────────────────────
  org = {
    // Identity
    name: 'Vorta Technologies',
    initials: 'VT',
    slug: 'vorta-technologies',
    color: '#5B5BD6',
    plan: 'Business',
    planRenews: 'Aug 1, 2026',
    industry: 'Technology',
    bio: 'Building the next generation of project management tools. We help teams ship faster, collaborate smarter, and stay in sync.',
    createdAt: 'Jan 2022',

    // Stats
    employeeCount: 48,
    projectCount: 124,
    teamCount: 12,

    // Quick info
    website: 'https://vorta.io',
    contactEmail: 'hello@vorta.io',
    phone: '+1 (415) 555-0192',

    // Contact details
    address: '101 Market St, Suite 800',
    city: 'San Francisco',
    postalCode: '94105',
    state: 'California',
    country: 'United States',
  };

  // ── Mesh gradient ──────────────────────────────────────────────
  get meshGradient(): string {
    const c = this.org.color;
    return `
      radial-gradient(ellipse at 20% 20%, ${c}14 0%, transparent 55%),
      radial-gradient(ellipse at 80% 80%, ${c}0a 0%, transparent 55%),
      radial-gradient(ellipse at 80% 10%, ${c}0f 0%, transparent 45%)
    `;
  }

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void { }

  // ── Accordion ─────────────────────────────────────────────────
  toggleSection(key: string): void {
    this.activeSection = this.activeSection === key ? null : key;
  }

  // ── Change tracking ────────────────────────────────────────────
  onFieldChange(): void {
    this.isDirty = true;
    this.saveSuccess = false;
  }

  onCancel(): void {
    this.isDirty = false;
  }

  // ── Save ───────────────────────────────────────────────────────
  onSave(): void {
    if (!this.isDirty) return;
    this.saving = true;

    setTimeout(() => {
      this.saving = false;
      this.isDirty = false;
      this.saveSuccess = true;
      setTimeout(() => (this.saveSuccess = false), 3500);
    }, 1200);
  }

  // ── Danger zone ────────────────────────────────────────────────
  onTransferOwnership(): void {
    console.log('Transfer ownership');
  }

  onDeleteOrg(): void {
    console.log('Delete organization');
  }
}
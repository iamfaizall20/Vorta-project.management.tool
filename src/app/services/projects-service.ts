import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';// Adjust path as needed

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost/VortaAppApis/projects'; // Adjust based on your API endpoint

  constructor(private http: HttpClient) { }

  /**
   * Get project details for the current organization
   * @param id Optional project ID to fetch a single project
   * @returns Observable with project(s) data
   */
  projectDetails(id?: string): Observable<any> {
    const organizationId = localStorage.getItem('organization_id');

    if (!organizationId) {
      throw new Error('organization_id not found in localStorage');
    }

    const body: any = {
      organization_id: organizationId
    };

    // If id is provided, add it to the body for single project fetch
    if (id) {
      body.id = id;
    }

    return this.http.post<any>(this.apiUrl, body);
  }

  /**
   * Create a new team for a project
   * @param teamData Team creation data
   * @returns Observable with created team data
   */
  createTeam(teamData: any): Observable<any> {
    const organizationId = localStorage.getItem('organization_id');

    if (!organizationId) {
      throw new Error('organization_id not found in localStorage');
    }

    const body = {
      ...teamData,
      organization_id: organizationId
    };

    // Adjust endpoint as needed
    return this.http.post<any>(`${this.apiUrl}/teams`, body);
  }
}
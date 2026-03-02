import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private apiUrl = 'http://localhost/VortaAppApis/projects/projects.php';

  constructor(private http: HttpClient) { }

  // Handles both list fetch and single project fetch
  projectDetails(id?: string): Observable<any> {
    const url = id ? `${this.apiUrl}?id=${id}` : this.apiUrl;
    return this.http.get<any>(url);
  }
}
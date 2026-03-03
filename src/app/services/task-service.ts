import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TaskService {

  constructor(private http: HttpClient) { }

  createTask(taskData: any): Observable<any> {
    return this.http.post('http://localhost/VortaAppApis/tasks/create.php', taskData);
  }
}

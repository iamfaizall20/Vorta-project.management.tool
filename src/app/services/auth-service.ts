import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(private http: HttpClient,) { }

  login(formValue: { username: string, password: string }) {
    return this.http.post('http://localhost/VortaAppApis/auth/login.php', formValue);
  }

}

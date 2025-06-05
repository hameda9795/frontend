import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
  onSubmit(): void {
    if (this.loginForm.valid && !this.loading) {
      this.loading = true;
      const { username, password } = this.loginForm.value;

      this.authService.login({ username, password }).subscribe({
        next: (response) => {
          this.loading = false;
          this.snackBar.open('Succesvol ingelogd!', 'Sluiten', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.loading = false;
          let errorMessage = 'Fout bij inloggen. Probeer opnieuw.';
            if (error.status === 401) {
            errorMessage = 'Onjuiste gebruikersnaam of wachtwoord.';
          } else if (error.status === 0) {
            errorMessage = 'Kan geen verbinding maken met de server.';
          }

          this.snackBar.open(errorMessage, 'Sluiten', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  getUsernameErrorMessage(): string {
    const usernameControl = this.loginForm.get('username');
    if (usernameControl?.hasError('required')) {
      return 'Gebruikersnaam is verplicht';
    }
    if (usernameControl?.hasError('minlength')) {
      return 'Gebruikersnaam moet minimaal 3 karakters bevatten';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Wachtwoord is verplicht';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'Wachtwoord moet minimaal 6 karakters bevatten';
    }
    return '';
  }
}

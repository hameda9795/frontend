import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-registration-prompt',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './registration-prompt.component.html',
  styleUrls: ['./registration-prompt.component.scss']
})
export class RegistrationPromptComponent {
  @Output() closeModal = new EventEmitter<void>();

  constructor(private router: Router) {}

  onClose(): void {
    this.closeModal.emit();
  }

  onRegister(): void {
    this.closeModal.emit();
    this.router.navigate(['/register']);
  }

  onLogin(): void {
    this.closeModal.emit();
    this.router.navigate(['/login']);
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}

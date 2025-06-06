import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, SendMessageRequest } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule, 
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  isSubmitted = false;
  errorMessage = '';

  contactReasons = [
    { value: 'support', label: 'Technische ondersteuning' },
    { value: 'content', label: 'Content suggestie' },
    { value: 'bug', label: 'Bug rapportage' },
    { value: 'privacy', label: 'Privacy vraag' },
    { value: 'copyright', label: 'Auteursrecht' },
    { value: 'other', label: 'Anders' }
  ];

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private authService: AuthService
  ) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      reason: ['', Validators.required],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(20)]]
    });
    console.log('Contact form initialized:', this.contactForm);
  }
  ngOnInit(): void {
    // Pre-fill form if user is logged in
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.contactForm.patchValue({
        name: currentUser.username,
        email: currentUser.email
      });
    }
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      
      const messageData: SendMessageRequest = {
        name: this.contactForm.value.name,
        email: this.contactForm.value.email,
        reason: this.contactForm.value.reason,
        subject: this.contactForm.value.subject,
        message: this.contactForm.value.message
      };

      this.messageService.sendMessage(messageData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.isSubmitted = true;
          this.contactForm.reset();
          console.log('Message sent successfully:', response);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = 'Er is een fout opgetreden bij het versturen van uw bericht. Probeer het opnieuw.';
          console.error('Error sending message:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  resetForm(): void {
    this.isSubmitted = false;
    this.errorMessage = '';
    this.contactForm.reset();
    
    // Pre-fill form again if user is logged in
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.contactForm.patchValue({
        name: currentUser.username,
        email: currentUser.email
      });
    }
  }
}

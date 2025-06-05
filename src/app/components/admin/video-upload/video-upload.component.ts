import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { VideoService } from '../../../services/video.service';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './video-upload.component.html',
  styleUrls: ['./video-upload.component.scss']
})
export class VideoUploadComponent implements OnInit {
  uploadForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  selectedVideoFile: File | null = null;
  selectedImageFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private videoService: VideoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/home']);
      return;
    }

    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      poemText: [''],
      hashtags: [''],
      contentType: ['FREE', [Validators.required]],
      seoTitle: [''],
      seoDescription: [''],
      seoKeywords: [''],
      spotifyLink: [''],
      amazonLink: [''],
      appleMusicLink: [''],
      itunesLink: [''],
      youtubeMusicLink: [''],
      instagramLink: ['']
    });
  }

  onVideoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedVideoFile = input.files[0];
    }
  }

  onImageFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImageFile = input.files[0];
    }
  }
  onSubmit(): void {
    if (this.uploadForm.valid && this.selectedVideoFile) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const videoData = this.uploadForm.value;

      this.videoService.uploadVideo(videoData, this.selectedVideoFile, this.selectedImageFile || undefined).subscribe({
        next: (response) => {
          this.successMessage = 'Video succesvol geüpload!';
          setTimeout(() => {
            this.router.navigate(['/admin']);
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = 'Fout bij het uploaden van de video. Probeer het opnieuw.';
          this.isLoading = false;
          console.error('Upload error:', error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  get title() {
    return this.uploadForm.get('title');
  }
}

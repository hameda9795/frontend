import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoService, Video } from '../../../services/video.service';
import { AuthService } from '../../../services/auth.service';
import { RegistrationPromptComponent } from '../../auth/registration-prompt/registration-prompt.component';

@Component({
  selector: 'app-video-detail',
  standalone: true,
  imports: [CommonModule, RegistrationPromptComponent],
  templateUrl: './video-detail.component.html',
  styleUrls: ['./video-detail.component.scss']
})
export class VideoDetailComponent implements OnInit {
  video: Video | null = null;
  loading = true;
  error = '';
  canWatch = false;
  hasViewBeenIncremented = false;
  showRegistrationPrompt = false;
  
  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private videoService: VideoService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.loadVideo(id);
      }
    });
  }
  loadVideo(id: number): void {
    this.loading = true;
    this.videoService.getVideo(id).subscribe({
      next: (video: Video) => {
        this.video = video;
        this.canWatch = this.checkCanWatch(video);
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Video niet gevonden';
        this.loading = false;
        console.error('Error loading video:', error);
      }
    });
  }
  checkCanWatch(video: Video): boolean {
    // First check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.showRegistrationPrompt = true;
      return false;
    }
    
    // Then check premium content access
    if (video.contentType === 'FREE') return true;
    return this.authService.isAuthenticated() && this.authService.getCurrentUser()?.premium;
  }
  incrementView(id: number): void {
    if (this.canWatch && !this.hasViewBeenIncremented) {
      this.hasViewBeenIncremented = true;
      this.videoService.incrementView(id).subscribe({
        next: (updatedVideo: Video) => {
          if (this.video) {
            this.video.viewCount = updatedVideo.viewCount;
          }
        },
        error: (error: any) => {
          console.error('Error incrementing view:', error);
          this.hasViewBeenIncremented = false; // Reset flag on error
        }
      });
    }
  }

  onVideoPlay(): void {
    if (this.video) {
      this.incrementView(this.video.id);
    }
  }

  formatViews(views: number): string {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  toggleLike(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.video) {
      this.videoService.toggleLike(this.video.id).subscribe({
        next: (updatedVideo: Video) => {
          if (this.video) {
            this.video.likeCount = updatedVideo.likeCount;
            this.video.isLiked = updatedVideo.isLiked;
          }
        },
        error: (error: any) => {
          console.error('Error toggling like:', error);
        }
      });
    }
  }

  toggleFavorite(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.video) {
      this.videoService.toggleFavorite(this.video.id).subscribe({
        next: (updatedVideo: Video) => {
          if (this.video) {
            this.video.isFavorited = updatedVideo.isFavorited;
            if (updatedVideo.favoriteCount !== undefined) {
              this.video.favoriteCount = updatedVideo.favoriteCount;
            }
          }
        },
        error: (error: any) => {
          console.error('Error toggling favorite:', error);
        }
      });
    }
  }

  getVideoUrl(): string {
    return this.video ? this.videoService.getVideoUrl(this.video.videoUrl) : '';
  }

  getCoverImageUrl(): string {
    return this.video ? this.videoService.getCoverImageUrl(this.video.coverImageUrl) : '';
  }
  goBack(): void {
    this.router.navigate(['/home']);
  }

  closeRegistrationPrompt(): void {
    this.showRegistrationPrompt = false;
  }
}

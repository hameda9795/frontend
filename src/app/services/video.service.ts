import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Video {
  id: number;
  title: string;
  description: string;
  poemText: string;
  videoUrl: string;
  coverImageUrl: string;
  hashtags: string;
  contentType: 'FREE' | 'PREMIUM';
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  spotifyLink: string;
  amazonLink: string;
  appleMusicLink: string;
  itunesLink: string;
  youtubeMusicLink: string;
  instagramLink: string;
  viewCount: number;
  likeCount: number;
  favoriteCount?: number;
  isLiked?: boolean;
  isFavorited?: boolean;
  duration?: number; // Duration in seconds
  createdAt: string;
  updatedAt: string;
}

export interface VideoRequest {
  title: string;
  description?: string;
  poemText?: string;
  hashtags?: string;
  contentType: 'FREE' | 'PREMIUM';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  spotifyLink?: string;
  amazonLink?: string;
  appleMusicLink?: string;
  itunesLink?: string;
  youtubeMusicLink?: string;
  instagramLink?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: any;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'http://localhost:8080/api/videos';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  uploadVideo(videoData: VideoRequest, videoFile: File, coverImage?: File): Observable<Video> {
    const formData = new FormData();
    
    Object.keys(videoData).forEach(key => {
      const value = (videoData as any)[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    
    formData.append('videoFile', videoFile);
    if (coverImage) {
      formData.append('coverImage', coverImage);
    }

    return this.http.post<Video>(`${this.apiUrl}/upload`, formData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getPublicVideos(page: number = 0, size: number = 10): Observable<PageResponse<Video>> {
    return this.http.get<PageResponse<Video>>(`${this.apiUrl}/public?page=${page}&size=${size}`);
  }
  getAllVideos(page: number = 0, size: number = 10): Observable<PageResponse<Video>> {
    return this.http.get<PageResponse<Video>>(`${this.apiUrl}/all?page=${page}&size=${size}`, {
      headers: this.authService.getAuthHeaders()
    });  }

  // For general video fetching - uses /all if authenticated, /public if not
  getVideos(page: number = 0, size: number = 10): Observable<Video[]> {
    if (this.authService.isAuthenticated()) {
      // Use /all endpoint for authenticated users (returns PageResponse)
      return new Observable(observer => {
        this.getAllVideos(page, size).subscribe({
          next: (pageResponse) => observer.next(pageResponse.content),
          error: (error) => observer.error(error),
          complete: () => observer.complete()
        });
      });
    } else {
      // Use /public endpoint for unauthenticated users (returns PageResponse)
      return new Observable(observer => {
        this.getPublicVideos(page, size).subscribe({
          next: (pageResponse) => observer.next(pageResponse.content),
          error: (error) => observer.error(error),
          complete: () => observer.complete()
        });
      });
    }
  }

  getVideo(id: number): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/${id}`);
  }

  searchVideos(keyword: string, page: number = 0, size: number = 10): Observable<PageResponse<Video>> {
    return this.http.get<PageResponse<Video>>(`${this.apiUrl}/search?keyword=${keyword}&page=${page}&size=${size}`);
  }

  getTrendingVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/trending`);
  }

  getPopularVideos(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/popular`);
  }  incrementView(id: number): Observable<Video> {
    // Only include auth headers if user is authenticated
    const options = this.authService.isAuthenticated() ? {
      headers: this.authService.getAuthHeaders()
    } : {};
    
    return this.http.post<Video>(`${this.apiUrl}/${id}/view`, {}, options);
  }

  toggleLike(id: number): Observable<Video> {
    return this.http.post<Video>(`${this.apiUrl}/${id}/like`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }
  toggleFavorite(id: number): Observable<Video> {
    return this.http.post<Video>(`${this.apiUrl}/${id}/favorite`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getLikedVideos(page: number = 0, size: number = 10): Observable<PageResponse<Video>> {
    return this.http.get<PageResponse<Video>>(`${this.apiUrl}/liked?page=${page}&size=${size}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getFavoriteVideos(page: number = 0, size: number = 10): Observable<PageResponse<Video>> {
    return this.http.get<PageResponse<Video>>(`${this.apiUrl}/favorites?page=${page}&size=${size}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteVideo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getVideoUrl(videoPath: string): string {
    return `http://localhost:8080/uploads/${videoPath}`;
  }

  getCoverImageUrl(imagePath: string): string {
    return `http://localhost:8080/uploads/${imagePath}`;
  }
}

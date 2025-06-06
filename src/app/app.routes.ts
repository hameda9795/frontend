import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'home', 
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent) 
  },  { 
    path: 'video/:id', 
    loadComponent: () => import('./components/video/video-detail/video-detail.component').then(m => m.VideoDetailComponent),
    data: { renderMode: 'csr' }
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./components/user/profile/profile.component').then(m => m.ProfileComponent) 
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) 
  },  { 
    path: 'admin/upload', 
    loadComponent: () => import('./components/admin/video-upload/video-upload.component').then(m => m.VideoUploadComponent) 
  },
  { 
    path: 'privacy', 
    loadComponent: () => import('./components/legal/privacy/privacy.component').then(m => m.PrivacyComponent) 
  },
  { 
    path: 'terms', 
    loadComponent: () => import('./components/legal/terms/terms.component').then(m => m.TermsComponent) 
  },
  { 
    path: 'contact', 
    loadComponent: () => import('./components/legal/contact/contact.component').then(m => m.ContactComponent) 
  },
  { path: '**', redirectTo: '/home' }
];

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, map, tap, switchMap, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Preferences } from '@capacitor/preferences';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

const AUTH_DATA = 'auth_data';

export interface User {
    id: number;
    username: string;
    email: string;
    roles: string[];
    departmentId?: number;
    name?: string;
    mobile?: string;
    organizationName?: string;
    organizationLogo?: string;
}

export interface AuthResponse {
    token: string;
    type: string;
    id: number;
    username: string;
    email: string;
    roles: string[];
    departmentId?: number;
    name?: string;
    mobile?: string;
    organizationName?: string;
    organizationLogo?: string;
}

import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/api/auth`;
    private userSubject = new BehaviorSubject<User | null>(null);
    private currentToken: string | null = null;

    constructor(
        private http: HttpClient,
        private router: Router
    ) {
        // loadUser is now explicitly called via init() in APP_INITIALIZER
    }

    async init() {
        await this.loadUser();
    }

    get user$() {
        return this.userSubject.asObservable();
    }

    get currentUserValue() {
        return this.userSubject.value;
    }

    login(credentials: any): Observable<any> {
        // Direct header to ensure ngrok bypass works even if interceptor fails
        const headers = { 'ngrok-skip-browser-warning': 'true' };

        console.log('Attempting Login to:', `${this.apiUrl}/login`);

        return this.http.post<any>(`${this.apiUrl}/login`, credentials, { headers }).pipe(
            timeout(15000),
            switchMap(async (response: any) => {
                console.log('Login Response:', response);
                const authData = response.data || response;
                if (authData.token) {
                    await this.saveToken(authData);
                }
                return response;
            }),
            // Catch error to log it visibly
            tap({
                error: (error) => console.error('Login Error Detailed:', JSON.stringify(error))
            })
        );
    }

    updateProfile(data: any): Observable<any> {
        return this.http.put<any>(`${environment.apiUrl}/api/user/profile`, data).pipe(
            tap(async response => {
                // If token refreshed
                if (response.success && response.data.token) {
                    // Get current storage to merge
                    const { value } = await Preferences.get({ key: AUTH_DATA });
                    if (value) {
                        const current = JSON.parse(value);
                        current.token = response.data.token;
                        // Update user details
                        const updatedUser = response.data.user;
                        current.name = updatedUser.name;
                        current.email = updatedUser.email;
                        current.mobile = updatedUser.mobile;

                        await this.saveToken(current);
                    }
                }
            })
        );
    }

    uploadProfilePhoto(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(`${environment.apiUrl}/api/user/profile-photo`, formData);
    }

    async logout() {
        await Preferences.remove({ key: AUTH_DATA });
        this.currentToken = null;
        this.userSubject.next(null);
        this.router.navigate(['/login']);
    }

    private async saveToken(data: AuthResponse) {
        await Preferences.set({
            key: AUTH_DATA,
            value: JSON.stringify(data)
        });

        this.currentToken = data.token;
        this.userSubject.next({
            id: data.id,
            username: data.username,
            email: data.email,
            roles: data.roles,
            departmentId: data.departmentId,
            name: data.name,
            mobile: data.mobile,
            organizationName: data.organizationName,
            organizationLogo: data.organizationLogo
        });
    }

    private async loadUser() {
        const { value } = await Preferences.get({ key: AUTH_DATA });
        if (value) {
            try {
                const parsed = JSON.parse(value);
                this.currentToken = parsed.token;
                this.userSubject.next({
                    id: parsed.id,
                    username: parsed.username,
                    email: parsed.email,
                    roles: parsed.roles,
                    departmentId: parsed.departmentId,
                    name: parsed.name,
                    mobile: parsed.mobile,
                    organizationName: parsed.organizationName,
                    organizationLogo: parsed.organizationLogo
                });
            } catch (e) {
                console.error('Failed to parse auth data', e);
                await this.logout();
            }
        }
    }

    getToken(): string | null {
        return this.currentToken;
    }

    // Biometric Logic

    async isBiometricAvailable(): Promise<boolean> {
        try {
            const result = await NativeBiometric.isAvailable();
            return result.isAvailable;
        } catch (e) {
            console.error('Biometric not available:', e);
            return false;
        }
    }

    async enableBiometricLogin(email: string, password: string): Promise<boolean> {
        try {
            // Save credentials securely
            await NativeBiometric.setCredentials({
                username: email,
                password: password,
                server: 'com.nagar.parishad.biometric', // Unique identifier
            });
            // Set flag
            await Preferences.set({ key: 'biometric_enabled', value: 'true' });
            return true;
        } catch (e) {
            console.error('Failed to enable biometric:', e);
            return false;
        }
    }

    async disableBiometricLogin(): Promise<void> {
        try {
            await NativeBiometric.deleteCredentials({
                server: 'com.nagar.parishad.biometric',
            });
            await Preferences.remove({ key: 'biometric_enabled' });
        } catch (e) {
            console.error('Failed to disable biometric:', e);
        }
    }

    async isBiometricEnabled(): Promise<boolean> {
        const { value } = await Preferences.get({ key: 'biometric_enabled' });
        return value === 'true';
    }

    async performBiometricLogin(): Promise<Observable<any> | null> {
        try {
            // 1. Verify Identity
            await NativeBiometric.verifyIdentity({
                reason: 'Login with Biometrics',
                title: 'Biometric Login',
                subtitle: 'Authenticate to access your account',
                description: 'Touch ID / Face ID'
            });

            // 2. Get Credentials
            const credentials = await NativeBiometric.getCredentials({
                server: 'com.nagar.parishad.biometric',
            });

            if (credentials && credentials.username && credentials.password) {
                // 3. Perform Login
                return this.login({ email: credentials.username, password: credentials.password });
            }
        } catch (e) {
            console.error('Biometric login failed:', e);
        }
        return null;
    }

    async verifyBiometricAccessOnly(): Promise<boolean> {
        try {
            await NativeBiometric.verifyIdentity({
                reason: 'Verify Identity',
                title: 'Unlock App',
                subtitle: 'Authenticate to continue',
                description: 'Touch ID / Face ID'
            });
            return true;
        } catch (e) {
            console.error('Biometric verification failed:', e);
            return false;
        }
    }

    async updateUserSubject(user: any) {
        if (!user) return;
        const { value } = await Preferences.get({ key: AUTH_DATA });
        if (value) {
            const parsed = JSON.parse(value);
            parsed.name = user.name || parsed.name;
            parsed.username = user.name || parsed.username;
            parsed.email = user.email || parsed.email;
            if (user.role) parsed.roles = [user.role];
            if (user.organizationName) parsed.organizationName = user.organizationName;
            if (user.organizationLogo !== undefined) parsed.organizationLogo = user.organizationLogo;

            await Preferences.set({ key: AUTH_DATA, value: JSON.stringify(parsed) });
            this.userSubject.next({
                id: parsed.id,
                username: parsed.username,
                email: parsed.email,
                roles: parsed.roles,
                departmentId: parsed.departmentId,
                name: parsed.name,
                mobile: parsed.mobile,
                organizationName: parsed.organizationName,
                organizationLogo: parsed.organizationLogo
            });
        }
    }
}

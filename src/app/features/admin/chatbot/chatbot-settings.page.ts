import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ChatbotService, ChatbotSettings } from '../../../services/chatbot.service';
import { IonicModule, IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-chatbot-settings',
    templateUrl: './chatbot-settings.page.html',
    styleUrls: ['./chatbot-settings.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class ChatbotSettingsPage implements OnInit {
    @ViewChild(IonContent) content!: IonContent;

    settings: ChatbotSettings = {};
    isLoading = false;

    // Tabs
    activeTab: 'config' | 'sim' = 'sim'; // Default to Sim for mobile

    // Simulator
    chatHistory: { sender: 'bot' | 'user', text: string }[] = [];
    simMessage: string = '';
    simLoading: boolean = false;
    selectedFile: File | null = null;

    constructor(
        private chatbotService: ChatbotService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadSettings();
    }

    loadSettings() {
        this.isLoading = true;
        this.chatbotService.getSettings().subscribe({
            next: (data) => {
                this.settings = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load settings', err);
                this.isLoading = false;
                alert('Failed to load chatbot settings. Please check your internet connection or administrative permissions.');
            }
        });
    }

    save() {
        // Validate JSON
        if (this.settings.chatbotFlow) {
            try {
                JSON.parse(this.settings.chatbotFlow);
            } catch (e) {
                alert('Invalid JSON in Chatbot Flow Config');
                return;
            }
        }

        this.isLoading = true;
        this.chatbotService.saveSettings(this.settings).subscribe({
            next: (msg) => {
                this.isLoading = false;
                alert('Settings saved successfully');
            },
            error: (err) => {
                console.error('Failed to save settings', err);
                this.isLoading = false;
                alert('Failed to save settings');
            }
        });
    }

    segmentChanged(ev: any) {
        this.activeTab = ev.detail.value;
    }

    // Simulator Logic
    onFileSelected(event: any) {
        console.log('DEBUG: File input change detected', event);
        if (event.target.files && event.target.files.length > 0) {
            this.selectedFile = event.target.files[0];
            console.log('DEBUG: File selected:', this.selectedFile);
        } else {
            console.log('DEBUG: No file selected');
        }
    }

    sendSimMessage() {
        if (!this.simMessage.trim() && !this.selectedFile) return;

        const msg = this.simMessage;

        if (this.selectedFile) {
            this.chatHistory.push({ sender: 'user', text: '[PHOTO] ' + this.selectedFile.name + (msg ? ' - ' + msg : '') });
        } else {
            this.chatHistory.push({ sender: 'user', text: msg });
        }

        this.simMessage = '';
        this.simLoading = true;
        this.scrollToBottom();

        const fileToSend = this.selectedFile;
        this.selectedFile = null;

        if (fileToSend) {
            this.chatbotService.uploadFile(fileToSend).subscribe({
                next: (uploadRes) => {
                    const mediaUrl = uploadRes.url;
                    this.sendToBot(msg, mediaUrl);
                },
                error: (err) => {
                    console.error('Upload failed', err);
                    this.chatHistory.push({ sender: 'bot', text: `Error: Upload failed. Status: ${err.status} ${err.statusText || ''}` });
                    this.simLoading = false;
                    this.scrollToBottom();
                }
            });
        } else {
            const isUrl = msg.toLowerCase().startsWith('http');
            this.sendToBot(msg, isUrl ? msg : undefined);
        }
    }

    sendToBot(msg: string, mediaUrl?: string) {
        this.chatbotService.simulateChat(msg || '', 1, mediaUrl).subscribe({
            next: (res) => {
                this.simLoading = false;
                if (res.response) {
                    this.chatHistory.push({ sender: 'bot', text: res.response });
                }
                this.scrollToBottom();
            },
            error: (err) => {
                this.simLoading = false;
                this.chatHistory.push({ sender: 'bot', text: 'Error: Could not reach bot.' });
                this.scrollToBottom();
            }
        });
    }

    clearChat() {
        this.chatHistory = [];
        this.sendSimMessage(); // Reset logic if backend supports it via empty or specific trigger
    }

    scrollToBottom() {
        setTimeout(() => {
            this.content.scrollToBottom(300);
        }, 100);
    }
}

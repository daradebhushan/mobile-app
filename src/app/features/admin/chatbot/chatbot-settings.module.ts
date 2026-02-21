import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ChatbotSettingsPage } from './chatbot-settings.page';

const routes: Routes = [
    {
        path: '',
        component: ChatbotSettingsPage
    }
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        TranslatePipe
    ],
    declarations: [ChatbotSettingsPage]
})
export class ChatbotSettingsPageModule { }

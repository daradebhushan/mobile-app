import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { SafeUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-image-modal',
    template: `
    <ion-content class="ion-no-padding" style="--background: black;">
      <div class="w-full h-full flex flex-col items-center justify-center bg-black relative">
          
          <!-- Close Button -->
          <button (click)="close()" class="absolute top-12 right-6 z-50 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center active:scale-90 transition-transform backdrop-blur-sm border border-white/20">
            <ion-icon name="close" class="text-3xl"></ion-icon>
          </button>

          <img [src]="imageUrl" class="max-w-full max-h-full object-contain" />
      </div>
    </ion-content>
  `,
    standalone: true,
    imports: [IonicModule, CommonModule]
})
export class ImageModalComponent {
    @Input() imageUrl: string | SafeUrl | undefined;
    constructor(private modalController: ModalController) { }
    close() {
        this.modalController.dismiss();
    }
}

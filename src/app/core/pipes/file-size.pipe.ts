import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'fileSize',
    standalone: true
})
export class FileSizePipe implements PipeTransform {

    transform(sizeInBytes: number | string): string {
        const bytes = Number(sizeInBytes);
        if (isNaN(bytes) || bytes === 0) {
            return '0 B';
        }

        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const power = Math.floor(Math.log(bytes) / Math.log(1024));
        const unitIndex = Math.min(power, units.length - 1);

        const size = bytes / Math.pow(1024, unitIndex);
        const formattedSize = Math.round(size * 100) / 100; // Round to 2 decimal places

        return `${formattedSize} ${units[unitIndex]}`;
    }
}

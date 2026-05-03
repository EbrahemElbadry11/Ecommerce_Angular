import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortdesc',
})
export class ShortdescPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    return value.split(' ').slice(0, 3).join(' ') + '...';
  }
}

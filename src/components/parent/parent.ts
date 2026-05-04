import { Component ,ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icategory } from '../../models/icategory';
import { CurrencyPipe } from '@angular/common';
import { Products } from '../products/products';

@Component({
  selector: 'app-parent',
  imports: [Products,FormsModule,CurrencyPipe,],
  templateUrl: './parent.html',
  styleUrl: './parent.css',
})
export class Parent {
  selectedid:number=0
  catlist:Icategory[]
  total:number=0
 
  constructor(){
    this.catlist= [
    { id: 1, name: 'Beauty' },
    { id: 2, name: 'Fragrances' },
    { id: 3, name: 'Furniture' },
    { id: 4, name: 'Groceries' }
  ];
}
  recivedtotalprice(data:any){
    this.total=data;
  }
  @ViewChild('myInput') inputElement!: ElementRef;

  focusInput() {
    this.inputElement.nativeElement.focus();
    this.inputElement.nativeElement.style.border = '3px solid green';
  }
  
}

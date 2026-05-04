import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Iproduct } from '../../models/iproduct';
import { ToastService } from '../../services/toast';
import { ProductService } from '../../services/product-service';
import { CurrencyPipe, SlicePipe } from '@angular/common';
import { ShortdescPipe } from '../../pipes/shortdesc-pipe';
import { Dynamibutton } from '../dynamibutton/dynamibutton';

@Component({
  selector: 'app-products',
  templateUrl: './products.html',
  styleUrl: './products.css',
  imports: [CurrencyPipe, SlicePipe,ShortdescPipe,Dynamibutton],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Products implements OnChanges, OnInit {
  @Input() Recivedid: number = 0;
  @Output() total = new EventEmitter<number>();

  prdlist: Iproduct[] = [];       
  filterlist: Iproduct[] = [];    
  totalprice: number = 0;

  constructor(
    private productService: ProductService,
    private t: ToastService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getAllProducts(); 
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.filter();
  }

  getAllProducts() {
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.prdlist = products;
        this.filter();
        this.cd.detectChanges(); 
      },
      error: () => this.t.show('Failed to load products', 'danger')
    });
  }

  filter() {
    if (this.Recivedid == 0) {
      this.filterlist = this.prdlist; // ✅ filter على array
    } else {
      this.filterlist = this.prdlist.filter(p => p.categoryid == this.Recivedid);
    }
  }

  buyproducts(inp: any, prd: Iproduct) {
    const val = +inp.value;
    if (val > prd.stock) {
      this.t.show(`Only ${prd.stock} items left in stock!`, 'warning'); 
      inp.value = "1";
      return;
    }
    this.totalprice += val * prd.price;
    prd.stock -= val;
    inp.value = 1;
    this.total.emit(this.totalprice); 
}
}
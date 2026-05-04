import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ProductService } from '../../services/product-service';
import { ToastService } from '../../services/toast';
import { Iproduct } from '../../models/iproduct';
import { Icategory } from '../../models/icategory'; 
import { Observable } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-productoperation',
  imports: [ReactiveFormsModule, CurrencyPipe,AsyncPipe],
  templateUrl: './productoperation.html',
  styleUrl: './productoperation.css',
 changeDetection:ChangeDetectionStrategy.OnPush

})
export class Productoperation implements OnInit {

  products!: Observable<Iproduct[]>;
  catlist : Icategory[] = []
  productForm: FormGroup;
  isEditing: boolean = false;
  selectedId: number = 0;

  constructor(
    private productService: ProductService,
    private t: ToastService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      title:       ['', [Validators.required]],
      description: ['', [Validators.required]],
      price:       ['', [Validators.required, Validators.min(0)]],
      stock:       ['', [Validators.required, Validators.min(0)]],
      categoryid:  ['', [Validators.required]],
      thumbnail:   ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.getAllProducts();
    this.catlist= [
      { id: 1, name: 'Beauty' },
      { id: 2, name: 'Fragrances' },
      { id: 3, name: 'Furniture' },
      { id: 4, name: 'Groceries' }
    ];
  }

  getAllProducts() {
    
    this.products = this.productService.getAllProducts();
    this.cd.markForCheck();
  }

  openAddModal() {
    this.isEditing = false;
    this.productForm.reset();
  }

  openEditModal(product: Iproduct) {
    this.isEditing = true;
    this.selectedId = product.id;
    this.productForm.patchValue(product); 
  }

  addProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.productService.addProduct(this.productForm.value).subscribe({
      next: () => {
        this.t.show('Product added successfully', 'success');
        this.getAllProducts();
        this.closeModal();
      },
      error: () => this.t.show('Failed to add product.', 'danger')
    });
  }

  updateProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.productService.updateProduct(this.selectedId, this.productForm.value).subscribe({
      next: () => {
        this.t.show('Product updated successfully', 'success');
        this.getAllProducts();
        this.closeModal();
      },
      error: () => this.t.show('Failed to update product.', 'danger')
    });
  }

  deleteProduct(id: number) {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.t.show('Product deleted successfully', 'success');
        this.getAllProducts(); 
      },
      error: () => this.t.show('Failed to delete product.', 'danger')
    });
  }

  closeModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    modal?.hide();
  }
}
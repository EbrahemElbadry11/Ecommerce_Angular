import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import {
  Stripe,
  StripeCardElement,
  StripeElements,
} from '@stripe/stripe-js';

import {
  Subject,
  interval,
  takeUntil,
  switchMap,
  filter,
  take,
  finalize,
} from 'rxjs';

import { CartService }
  from '../../../cart/services/cart.service';

import { OrderService }
  from '../../services/order.service';

import { PaymentService }
  from '../../services/payment.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ProductService } from '../../../products/services/product.service';
@Component({
  selector: 'app-checkout-page',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],

  templateUrl:
    './checkout-page.html',

  styleUrls: [
    './checkout-page.css',
  ],
})
export class CheckoutPageComponent
  implements
  OnInit,
  AfterViewInit,
  OnDestroy {

  cart: any = null;

  loading = false;

  paymentLoading = false;

  errorMessage = '';

  successMessage = '';

  stripe: Stripe | null = null;

  elements!: StripeElements;

  cardElement!: StripeCardElement;

  subtotal = 0;

  shippingFees = 50;

  orderId = 0;
  isGuest = true;
  private destroy$ =
    new Subject<void>();

  private pollingDestroy$ =
    new Subject<void>();

  form: FormGroup;

  constructor(
    private fb: FormBuilder,

    private cartService: CartService,

    private orderService: OrderService,

    private paymentService: PaymentService,

    private router: Router,
    private authService: AuthService,
    private productService: ProductService
  ) {
    const isGuest = !this.authService.isLoggedIn();

    this.form = this.fb.group({
      guestName: [
        '',
        isGuest ? [Validators.required, Validators.minLength(3)] : []
      ],
      guestEmail: [
        '',
        isGuest ? [Validators.required, Validators.email] : []
      ],
      shippingAddress: [
        '',
        [Validators.required, Validators.minLength(10)]
      ],
    });
  }

  async ngOnInit() {

    this.loadCart();

    const token =
      localStorage.getItem(
        'authToken'
      );

    this.isGuest = !token;

    if (this.isGuest) {

      this.form
        .get('guestName')
        ?.setValidators([
          Validators.required,
          Validators.minLength(3),
        ]);

      this.form
        .get('guestEmail')
        ?.setValidators([
          Validators.required,
          Validators.email,
        ]);
    }
    else {

      this.form
        .get('guestName')
        ?.disable();

      this.form
        .get('guestEmail')
        ?.disable();
    }

    this.form
      .get('guestName')
      ?.updateValueAndValidity();

    this.form
      .get('guestEmail')
      ?.updateValueAndValidity();

    this.stripe =
      await this.paymentService
        .getStripe();

    if (!this.stripe) {

      this.errorMessage =
        'Stripe failed to initialize.';
    }
  }

  async ngAfterViewInit(): Promise<void> {

    if (!this.stripe) {

      this.stripe =
        await this.paymentService
          .getStripe();
    }

    this.mountCardElement();
  }

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

    this.pollingDestroy$.next();

    this.pollingDestroy$.complete();

    if (this.cardElement) {
      this.cardElement.destroy();
    }
  }

  loadCart(): void {

    this.cartService
      .getCart()

      .pipe(
        takeUntil(this.destroy$)
      )

      .subscribe({

        next: (response: any) => {

          this.cart = {
            ...response.data,

            items: response.data.items.map((item: any) => ({
              ...item,

              imageUrl: item.imageUrl
                ? this.productService.getImageUrl(item.imageUrl)
                : 'assets/images/no-image.png'
            }))
          };

          this.calculateSubtotal();

          if (
            !this.cart?.items?.length
          ) {

            this.errorMessage =
              'Your cart is empty.';
          }
        },

        error: () => {

          this.errorMessage =
            'Failed to load cart.';
        },
      });
  }

  calculateSubtotal(): void {

    if (!this.cart?.items?.length) {

      this.subtotal = 0;

      return;
    }

    this.subtotal =
      this.cart.items.reduce(
        (
          sum: number,
          item: any
        ) =>
          sum +
          (
            item.price *
            item.quantity
          ),
        0
      );
  }

  private mountCardElement(): void {

    try {

      if (!this.stripe) {
        return;
      }

      if (this.cardElement) {
        return;
      }

      this.elements =
        this.stripe.elements();

      const isDarkMode = document.body.classList.contains('dark-mode') || document.documentElement.classList.contains('dark-mode');

      this.cardElement =
        this.elements.create(
          'card',
          {
            style: {

              base: {

                fontSize: '16px',

                color: isDarkMode ? '#f5f2ec' : '#1f2937',

                fontFamily:
                  '"DM Sans", sans-serif',

                '::placeholder': {
                  color: isDarkMode ? '#8a8175' : '#9ca3af',
                },
              },

              invalid: {
                color: '#dc2626',
              },
            },
          }
        );

      this.cardElement.mount(
        '#card-element'
      );

      // Listen for dark mode toggles to update Stripe styles in real-time
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => {
          const isDark = document.body.classList.contains('dark-mode') || document.documentElement.classList.contains('dark-mode');
          if (this.cardElement) {
            this.cardElement.update({
              style: {
                base: {
                  color: isDark ? '#f5f2ec' : '#1f2937',
                  '::placeholder': {
                    color: isDark ? '#8a8175' : '#9ca3af',
                  }
                }
              }
            });
          }
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        this.destroy$.subscribe(() => observer.disconnect());
      }

      this.cardElement.on(
        'change',
        (event) => {

          if (event.error) {

            this.errorMessage =
              event.error.message;

            return;
          }

          this.errorMessage = '';
        }
      );
    }
    catch {

      this.errorMessage =
        'Failed to load payment form.';
    }
  }

  async placeOrder() {

    if (
      this.loading ||
      this.paymentLoading
    ) {
      return;
    }

    this.errorMessage = '';

    this.successMessage = '';

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    if (
      !this.cart ||
      !this.cart.items?.length
    ) {

      this.errorMessage =
        'Your cart is empty.';

      return;
    }

    this.loading = true;

    this.orderService
      .createOrder(this.form.value)

      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.loading = false;
        })
      )

      .subscribe({

        next: async (response) => {

          const data =
            response.data;

          if (!data) {

            this.errorMessage =
              'Invalid order response.';

            return;
          }

          this.orderId =
            data.orderId;

          if (!this.cardElement) {

            this.errorMessage =
              'Payment form failed to load.';

            return;
          }

          const paymentResult =
            await this.paymentService
              .confirmPayment(
                data.clientSecret,

                this.cardElement,

                this.form.value
                  .guestName || '',

                this.form.value
                  .guestEmail || ''
              );

          if (
            paymentResult.error
          ) {

            this.errorMessage =
              paymentResult.error.message ||
              'Payment failed.';

            return;
          }

          if (
            paymentResult.paymentIntent
              ?.status ===
            'requires_action'
          ) {

            this.errorMessage =
              'Additional authentication is required.';

            return;
          }

          this.paymentLoading = true;

          this.successMessage =
            'Payment processing...';

          this.pollOrderStatus();
        },

        error: (err) => {

          this.errorMessage =
            err.message ||
            'Checkout failed.';
        },
      });
  }

  private pollOrderStatus(): void {

    interval(3000)

      .pipe(

        switchMap(() =>
          this.orderService
            .getOrderStatus(
              this.orderId
            )
        ),

        filter(
          (response) =>
            !!response.data
        ),

        take(20),

        takeUntil(
          this.pollingDestroy$
        )
      )

      .subscribe({

        next: (response) => {

          const status =
            response.data;

          if (
            status ===
            'Confirmed'
          ) {

            this.paymentLoading =
              false;

            this.successMessage =
              'Payment successful.';

            this.errorMessage = '';

            this.cart.items = [];

            this.subtotal = 0;

            this.form.reset();

            this.pollingDestroy$.next();

            setTimeout(() => {

              this.router.navigate([
                '/payment-success'
              ]);

            }, 1500);

            return;
          }

          if (
            status ===
            'Cancelled'
          ) {

            this.paymentLoading =
              false;

            this.errorMessage =
              'Payment failed.';

            this.successMessage = '';

            this.pollingDestroy$.next();
          }
        },

        error: () => {

          this.paymentLoading =
            false;

          this.errorMessage =
            'Failed to verify payment.';
        },
      });
  }

  get total(): number {

    return (
      this.subtotal +
      this.shippingFees
    );
  }

  get shippingAddress() {

    return this.form.get(
      'shippingAddress'
    );
  }

  get guestEmail() {

    return this.form.get(
      'guestEmail'
    );
  }
}

import { Injectable } from '@angular/core';

import {
  loadStripe,
  Stripe,
  StripeCardElement,
  PaymentIntentResult,
} from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private stripePromise = loadStripe('pk_test_51TVwRuFx2nVOexmR7GGM8aeMbVIeyF6YxtmhjBuCoxQrxoRWBJXJscpBIAJgiMyrkgCytKO6BlMj8HU2Hu3CzOCx006g5OhgFl');

  async getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  async confirmPayment(
    clientSecret: string,
    cardElement: StripeCardElement,
    billingName: string,
    billingEmail: string
  ): Promise<PaymentIntentResult> {

    const stripe = await this.getStripe();

    if (!stripe) {
      throw new Error(
        'Stripe failed to initialize'
      );
    }

    if (!clientSecret) {
      throw new Error(
        'Client secret is missing'
      );
    }

    const result = await stripe.confirmCardPayment(clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billingName,
            email: billingEmail,
          },
        },
      }
    );

    return result;
  }
}

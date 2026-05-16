export interface CreateOrderResponse {
  orderId: number;

  clientSecret: string;

  totalAmount: number;
}

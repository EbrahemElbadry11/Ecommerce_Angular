import { CartItem } from "./cart.model";

export interface CartResponse {
  cartId: number;
  totalItems: number;
  items: CartItem[];
}

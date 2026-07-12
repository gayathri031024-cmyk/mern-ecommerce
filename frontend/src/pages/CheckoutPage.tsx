import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { useToast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { ROUTES } from '@/utils/constants';
import { PaymentMethod } from '@/types';

const paymentOptions = [
  { label: 'Credit or debit card', value: 'card' },
  { label: 'Cash on delivery', value: 'cod' },
  { label: 'PayPal', value: 'paypal' },
];

export function CheckoutPage() {
  const { cart } = useCart();
  const { mutateAsync: createOrder, isPending } = useCreateOrder();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [shippingAddressId, setShippingAddressId] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await createOrder({ shippingAddressId, paymentMethod });
      navigate(ROUTES.ORDER_SUCCESS);
    } catch {
      showToast({ title: 'Order failed', description: 'Please try again.', variant: 'error' });
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardBody className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Shipping address</h2>
            <Input
              label="Saved address ID"
              name="shippingAddressId"
              placeholder="e.g. addr_123"
              value={shippingAddressId}
              onChange={(event) => setShippingAddressId(event.target.value)}
              hint="Manage saved addresses from your profile page."
              required
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Payment method</h2>
            <Select
              options={paymentOptions}
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            />
          </CardBody>
        </Card>

        <Button type="submit" size="lg" isLoading={isPending} disabled={!cart || cart.itemCount === 0}>
          Place order
        </Button>
      </form>

      <Card className="h-fit">
        <CardBody className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Order total</h2>
          {cart?.items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-ink/60">
                {item.product.title} × {item.quantity}
              </span>
              <span>{formatCurrency(item.priceAtAdd * item.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-3 font-semibold">
            <span>Subtotal</span>
            <span>{formatCurrency(cart?.subtotal ?? 0)}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

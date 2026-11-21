'use client';

import { useEffect, useState } from 'react';
import { getOrderTracking, orderHasShipped } from '@/lib/medusa';

// The tracking numbers of a shipped order, loaded after the order itself.
// Empty until they arrive, for an order that has not shipped, and when the
// backend cannot be reached: the order page never fails because of them.
export function useOrderTracking(order) {
  const [found, setFound] = useState(null);
  const orderId = order?.id || null;
  const shipped = orderHasShipped(order);

  useEffect(() => {
    if (!orderId || !shipped) return undefined;
    let isCurrent = true;

    getOrderTracking(orderId).then((numbers) => {
      if (isCurrent) setFound({ id: orderId, numbers });
    });

    return () => {
      isCurrent = false;
    };
  }, [orderId, shipped]);

  return shipped && found && found.id === orderId ? found.numbers : [];
}

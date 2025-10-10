import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCached, setCache } from '@/lib/tinyCache';
import { toast } from '@/hooks/use-toast';

const MAX_RETRIES = 2;
const RETRY_DELAYS = [200, 800]; // ms

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useTinyApi = () => {
  const [loading, setLoading] = useState(false);

  const callWithRetry = async (fn: () => Promise<any>, retries = 0): Promise<any> => {
    try {
      return await fn();
    } catch (error) {
      if (retries < MAX_RETRIES) {
        await sleep(RETRY_DELAYS[retries]);
        return callWithRetry(fn, retries + 1);
      }
      throw error;
    }
  };

  const invokeFunction = async (
    functionName: string,
    payload?: any,
    cacheKey?: string
  ) => {
    setLoading(true);
    try {
      // Check cache first
      if (cacheKey) {
        const cached = await getCached(cacheKey);
        if (cached) {
          console.log(`[useTinyApi] cache hit: ${cacheKey}`);
          return cached;
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

      const result = await callWithRetry(async () => {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload,
        });

        if (error) throw error;
        if (!data?.ok && data?.error) throw new Error(data.error);
        return data;
      });

      // Cache successful result
      if (cacheKey && result) {
        await setCache(cacheKey, result);
      }

      return result;
    } catch (error: any) {
      const message = error.message || 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: message.slice(0, 100),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createPaymentLink: (orderId: string, amount: number, description: string, customer: any) =>
      invokeFunction('tiny-payments-create-link', { orderId, amount, description, customer }),
    
    issueNFe: (orderId: string) =>
      invokeFunction('tiny-nfe-issue', { orderId }),
    
    getShippingQuote: (orderId: string, cepDestino: string, peso?: number, valorDeclarado?: number) =>
      invokeFunction('tiny-shipping-quote', { orderId, cepDestino, peso, valorDeclarado }, `shipping-quote-${orderId}`),
    
    createShippingLabel: (orderId: string, serviceId: string, carrier: string, service: string, price: number) =>
      invokeFunction('tiny-shipping-create-label', { orderId, serviceId, carrier, service, price }),
    
    trackShipping: (tracking: string) =>
      invokeFunction('tiny-shipping-track', { tracking }, `tracking-${tracking}`),
    
    createOrder: (orderData: any) =>
      invokeFunction('tiny-create-order', orderData),
    
    getOrderStatus: (orderNumber: string) =>
      invokeFunction('tiny-order-status', { number: orderNumber }, `order-status-${orderNumber}`),
  };
};

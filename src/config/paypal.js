import paypal from "@paypal/checkout-server-sdk";

/**
 * PayPal Environment
 * Uses Sandbox by default, switch to Live in production
 */
const environment =
  process.env.PAYPAL_MODE === "live"
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET,
      )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET,
      );
/**
 * PayPal Client
 */
const paypalClient = new paypal.core.PayPalHttpClient(environment);

export default paypalClient;

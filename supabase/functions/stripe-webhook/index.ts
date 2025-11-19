import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-11-20.acacia"
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Log environment check on startup
console.log("[STRIPE-WEBHOOK] Environment check:", {
  hasSupabaseUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  serviceKeyPrefix: supabaseServiceKey?.substring(0, 10),
  hasWebhookSecret: !!webhookSecret,
});

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logStep("ERROR", { message: "No signature provided" });
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  try {
    const body = await req.text();

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Event received", { type: event.type, id: event.id });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id });

        if (session.mode === "subscription" && session.customer && session.subscription) {
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0].price.id;

          // Map price ID to plan
          let plan = "pro_monthly";
          if (priceId === Deno.env.get("STRIPE_PRICE_YEARLY_ID")) {
            plan = "pro_yearly";
          }

          // Find user by customer email
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          const userEmail = customer.email;

          if (!userEmail) {
            throw new Error("Customer email not found");
          }

          logStep("Finding user by email", { email: userEmail });

          // Get user ID by querying auth.users table directly via RPC or profiles
          // First, try to find existing profile by stripe_customer_id
          let { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          // If not found by customer_id, we need to find the user by email
          // We'll update the profile using the customer email from Stripe
          if (!existingProfile) {
            // Query profiles joined with auth.users to find by email
            const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

            if (authError) {
              logStep("ERROR listing users", authError);
              throw new Error(`Failed to list users: ${authError.message}`);
            }

            const user = authData.users.find(u => u.email === userEmail);

            if (!user) {
              throw new Error(`User not found for email: ${userEmail}`);
            }

            existingProfile = { id: user.id };
          }

          logStep("Updating user profile", { userId: existingProfile.id, plan });

          // Update user profile with subscription info
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_plan: plan,
              subscription_status: "active",
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
              subscription_started_at: new Date().toISOString(),
              trial_end: null, // End trial when subscription starts
            })
            .eq("id", existingProfile.id);

          if (updateError) {
            logStep("ERROR updating profile", updateError);
            throw updateError;
          }

          logStep("SUCCESS - User upgraded to Pro", { userId: existingProfile.id, plan });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing customer.subscription.updated", { subscriptionId: subscription.id });

        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;

        let plan = "pro_monthly";
        if (priceId === Deno.env.get("STRIPE_PRICE_YEARLY_ID")) {
          plan = "pro_yearly";
        }

        // Find user by stripe_subscription_id
        const { data: profile, error: findError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (findError || !profile) {
          logStep("Profile not found by subscription_id, trying customer_id");

          const { data: profileByCustomer } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (!profileByCustomer) {
            throw new Error("Profile not found");
          }
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_plan: plan,
            subscription_status: subscription.status,
            subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .or(`stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${customerId}`);

        if (updateError) throw updateError;

        logStep("SUCCESS - Subscription updated");
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing customer.subscription.deleted", { subscriptionId: subscription.id });

        // Check if subscription was created within last 7 days for automatic refund
        const createdDate = new Date(subscription.created * 1000);
        const now = new Date();
        const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        logStep("Checking refund eligibility", { daysSinceCreation });

        if (daysSinceCreation <= 7) {
          logStep("Eligible for automatic refund - processing");

          try {
            // Get the latest invoice
            const invoices = await stripe.invoices.list({
              subscription: subscription.id,
              limit: 1,
            });

            if (invoices.data.length > 0) {
              const invoice = invoices.data[0];

              if (invoice.charge && invoice.status === "paid") {
                // Issue refund
                const refund = await stripe.refunds.create({
                  charge: invoice.charge as string,
                  reason: "requested_by_customer",
                });

                logStep("Refund issued", { refundId: refund.id, amount: refund.amount });
              }
            }
          } catch (refundError: any) {
            logStep("ERROR issuing refund", { message: refundError.message });
            // Don't throw - still process the cancellation
          }
        }

        // Update user profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            subscription_plan: null,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) throw updateError;

        logStep("SUCCESS - Subscription canceled");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_failed", { invoiceId: invoice.id });

        if (invoice.subscription) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              subscription_status: "past_due",
            })
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (updateError) throw updateError;

          logStep("SUCCESS - Subscription marked as past_due");
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});

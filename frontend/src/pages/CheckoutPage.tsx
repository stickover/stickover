import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useCart } from "../context/CartContext";
import { api } from "../utils/api";
import { getSessionId } from "../utils/session";
import { trackInitiateCheckout, trackPurchase, trackAddPaymentInfo } from "../utils/metaPixel";
import { BadgeCheck, Zap } from "lucide-react";
import upiIcon from "../assets/payment-icons/upi.svg";
import visaIcon from "../assets/payment-icons/visa.svg";
import mastercardIcon from "../assets/payment-icons/mastercard.svg";
import CartAnnouncementBar from "../components/CartAnnouncementBar";
import PaymentTrustBanner from "../components/PaymentTrustBanner";
import CheckoutReviewsStrip from "../components/CheckoutReviewsStrip";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Fallback shipping config, used until admin-configured settings load. Kept in
// sync with the defaults shown in Admin -> Content -> Store Config.
const DEFAULT_FREE_SHIPPING_STATES = ["Tamil Nadu", "Puducherry"];
const DEFAULT_SHIPPING_FEE = 50;

export default function CheckoutPage() {
  const { items, subtotal, discount, appliedOffer, nextOffer, itemsToNextOffer, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "", lastName: "", customerEmail: "", customerPhone: "", customerAltPhone: "",
    shippingAddress: "", apartment: "", city: "", state: "Tamil Nadu", pincode: "",
  });
  const [settings, setSettings] = useState<any>({});
  useEffect(() => {
    api.get("/api/settings").then(setSettings).catch(() => {});
  }, []);
  const [saveInfo, setSaveInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pincodeLookupState, setPincodeLookupState] = useState<"idle" | "loading" | "found" | "notfound">("idle");

  // Feature: auto-fill city from PIN code. Looks up a static pincode->city
  // dataset on the backend once the user types a full 6-digit PIN.
  const pincodeLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (pincodeLookupTimer.current) clearTimeout(pincodeLookupTimer.current);
    const code = form.pincode.trim();
    if (!/^\d{6}$/.test(code)) {
      setPincodeLookupState("idle");
      return;
    }
    setPincodeLookupState("loading");
    pincodeLookupTimer.current = setTimeout(() => {
      api
        .get(`/api/pincode/${code}`)
        .then((r: { city: string }) => {
          setForm((f) => (f.pincode === code ? { ...f, city: r.city } : f));
          setPincodeLookupState("found");
        })
        .catch(() => setPincodeLookupState("notfound"));
    }, 400);
    return () => {
      if (pincodeLookupTimer.current) clearTimeout(pincodeLookupTimer.current);
    };
  }, [form.pincode]);

  // Shipping: free for Tamil Nadu & Puducherry (admin-configurable list), a flat
  // fee for every other state (admin-configurable amount). Falls back to
  // TN/Puducherry + ₹50 if the admin hasn't touched these settings yet.
  const freeShippingStates: string[] =
    settings.shippingFreeStates && settings.shippingFreeStates.length
      ? settings.shippingFreeStates
      : DEFAULT_FREE_SHIPPING_STATES;
  const otherStateShippingFee =
    settings.shippingFeeOtherStates !== undefined && settings.shippingFeeOtherStates !== null && settings.shippingFeeOtherStates !== ""
      ? Number(settings.shippingFeeOtherStates)
      : DEFAULT_SHIPPING_FEE;
  const shipping = freeShippingStates.includes(form.state) ? 0 : otherStateShippingFee;
  const total = Math.max(0, subtotal - discount) + shipping;

  // Meta Pixel — InitiateCheckout fires once per checkout-page visit that has items.
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || items.length === 0) return;
    checkoutTracked.current = true;
    trackInitiateCheckout({
      cartItems: items.map((i) => ({ productId: i.product.id, price: i.product.price, quantity: i.quantity })),
      total,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);
  const hasAddress = form.shippingAddress.trim() && form.city.trim() && form.state.trim() && form.pincode.trim();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const customerName = `${form.firstName} ${form.lastName}`.trim();

  // Feature: abandoned cart capture - as soon as the customer has typed anything
  // meaningful into the checkout form, save a debounced snapshot of every field
  // filled so far (name, phone, email, full address) so admins see the maximum
  // info a customer gave even if they never finish checkout.
  const abandonedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (abandonedTimer.current) clearTimeout(abandonedTimer.current);
    const hasAnyInput = customerName || form.customerPhone.trim() || form.customerEmail.trim() || form.shippingAddress.trim();
    if (!hasAnyInput || items.length === 0) return;
    abandonedTimer.current = setTimeout(() => {
      api
        .post("/api/analytics/abandoned-cart", {
          sessionId: getSessionId(),
          customerName,
          customerPhone: form.customerPhone,
          customerAltPhone: form.customerAltPhone,
          customerEmail: form.customerEmail,
          shippingAddress: form.shippingAddress,
          apartment: form.apartment,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          items,
          total,
        })
        .catch(() => {});
    }, 1500);
    return () => {
      if (abandonedTimer.current) clearTimeout(abandonedTimer.current);
    };
  }, [customerName, form.customerPhone, form.customerAltPhone, form.customerEmail, form.shippingAddress, form.apartment, form.city, form.state, form.pincode, items, total]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!window.Razorpay) {
      setError("Payment gateway failed to load. Please refresh and try again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Step 1: create a Razorpay order server-side for the exact total.
      const payOrder = await api.post("/api/payment/create-order", { amount: total });

      const fullAddress = form.apartment.trim()
        ? `${form.shippingAddress}, ${form.apartment}`
        : form.shippingAddress;

      // Save a checkout draft keyed by the Razorpay order id — this is the
      // webhook safety net's only source of cart/customer data if this tab
      // never gets a chance to run the `handler` callback below (e.g. a UPI
      // app-switch suspends/reloads the mobile browser after payment).
      // Best-effort: never blocks checkout if it fails.
      api
        .post("/api/orders/draft", {
          razorpayOrderId: payOrder.orderId,
          items,
          subtotal,
          discount,
          shipping,
          total,
          sessionId: getSessionId(),
          customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          customerAltPhone: form.customerAltPhone,
          shippingAddress: fullAddress,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        })
        .catch(() => {});

      // Meta Pixel — AddPaymentInfo, fired right as the payment modal opens.
      trackAddPaymentInfo({
        cartItems: items.map((i) => ({ productId: i.product.id, price: i.product.price, quantity: i.quantity })),
        total,
      });

      // Step 2: open Razorpay's checkout modal. Order placement only happens
      // once payment succeeds, inside the handler callback below.
      const rzp = new window.Razorpay({
        key: payOrder.keyId,
        amount: payOrder.amount,
        currency: payOrder.currency,
        name: "Stickover",
        description: "Order payment",
        order_id: payOrder.orderId,
        prefill: {
          name: customerName,
          email: form.customerEmail,
          contact: form.customerPhone,
        },
        theme: { color: "#2563eb" },
        handler: async (response: any) => {
          try {
            const order = await api.post("/api/orders", {
              items,
              subtotal,
              discount,
              shipping,
              total,
              sessionId: getSessionId(),
              paymentMethod: "razorpay",
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              customerName,
              customerEmail: form.customerEmail,
              customerPhone: form.customerPhone,
              customerAltPhone: form.customerAltPhone,
              shippingAddress: fullAddress,
              city: form.city,
              state: form.state,
              pincode: form.pincode,
            });
            trackPurchase({
              orderId: order.id,
              total,
              customerName,
              customerEmail: form.customerEmail,
              customerPhone: form.customerPhone,
              cartItems: items.map((i) => ({
                productId: i.product.id,
                productName: i.product.title,
                price: i.product.price,
                quantity: i.quantity,
              })),
            });
            clearCart();
            navigate(`/order-confirmed/${order.id}`);
          } catch (err: any) {
            setError(err.message || "Payment succeeded but order placement failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Failed to start payment. Please try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-20 py-20 text-center text-zinc-400">Your cart is empty.</div>;
  }

  return (
    <div>
      <CartAnnouncementBar />
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-20 py-8 sm:py-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Delivery */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-zinc-900">Delivery</h2>

          <select
            name="country"
            defaultValue="India"
            disabled
            className="w-full glass-input rounded-xl px-3 py-2.5 text-zinc-900 bg-zinc-50"
          >
            <option>India</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input
              name="firstName"
              placeholder="First name (optional)"
              value={form.firstName}
              onChange={handleChange}
              className="w-full glass-input rounded-xl px-3 py-2.5 text-zinc-900"
            />
            <input
              name="lastName"
              placeholder="Last name"
              required
              value={form.lastName}
              onChange={handleChange}
              className="w-full glass-input rounded-xl px-3 py-2.5 text-zinc-900"
            />
          </div>

          <input
            name="shippingAddress"
            placeholder="Address"
            required
            value={form.shippingAddress}
            onChange={handleChange}
            className="w-full glass-input rounded-xl px-3 py-2.5 text-zinc-900"
          />

          <input
            name="apartment"
            placeholder="Apartment, suite, etc. (optional)"
            value={form.apartment}
            onChange={handleChange}
            className="w-full glass-input rounded-xl px-3 py-2.5 text-zinc-900"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              name="pincode"
              placeholder="PIN code"
              required
              maxLength={6}
              inputMode="numeric"
              value={form.pincode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setForm({ ...form, pincode: v });
              }}
              className="w-full glass-input rounded-xl px-3 py-2.5 text-zinc-900 sm:col-span-1"
            />
            <div className="sm:col-span-1">
              <input
                name="city"
                placeholder="City"
                required
                value={form.city}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-3 py-2.5 text-zinc-900"
              />
              {pincodeLookupState === "loading" && (
                <p className="text-[11px] text-zinc-400 mt-1">Finding city…</p>
              )}
              {pincodeLookupState === "notfound" && (
                <p className="text-[11px] text-amber-600 mt-1">City not found, enter manually</p>
              )}
            </div>
            <select
              name="state"
              required
              value={form.state}
              onChange={handleChange}
              className={`w-full glass-input rounded-xl px-3 py-2.5 sm:col-span-1 ${form.state ? "text-zinc-900" : "text-zinc-400"}`}
            >
              <option value="" disabled>State</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s} className="text-zinc-900">{s}</option>
              ))}
            </select>
          </div>

          <input
            name="customerPhone"
            placeholder="Phone"
            required
            value={form.customerPhone}
            onChange={handleChange}
            className="w-full glass-input rounded-xl px-3 py-2.5 text-zinc-900"
          />

          <input
            name="customerAltPhone"
            placeholder="Alternate phone (optional)"
            value={form.customerAltPhone}
            onChange={handleChange}
            className="w-full glass-input rounded-xl px-3 py-2.5 text-zinc-900"
          />

          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={saveInfo}
              onChange={(e) => setSaveInfo(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--brand-primary)]"
            />
            Save this information for next time
          </label>
        </section>

        {/* Shipping method */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-zinc-900">Shipping method</h2>
          {hasAddress ? (
            <div className="glass rounded-xl px-4 py-3 flex items-center justify-between text-sm border border-blue-200">
              <span className="text-zinc-900 font-semibold">Standard Shipping</span>
              <span className="text-zinc-900 font-bold">{shipping === 0 ? "Free" : `₹${shipping}`}</span>
            </div>
          ) : (
            <div className="glass rounded-xl px-4 py-3 text-sm text-zinc-500">
              Enter your shipping address to view available shipping methods.
            </div>
          )}
        </section>

        {/* Payment */}
        <section className="space-y-3">
          <h2 className="text-lg font-black text-zinc-900">Payment</h2>
          <p className="text-sm text-zinc-500">All transactions are secure and encrypted.</p>

          <div className="rounded-xl border-2 border-[var(--brand-primary)] overflow-hidden max-w-full">
            <div className="glass px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="min-w-0 flex-1 text-zinc-900 font-semibold text-xs sm:text-sm break-words">
                Razorpay Secure (UPI, Cards, Int'l Cards, Wallets)
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <img src={upiIcon} alt="UPI" className="h-5 sm:h-6 rounded" />
                <img src={visaIcon} alt="Visa" className="h-5 sm:h-6 rounded" />
                <img src={mastercardIcon} alt="Mastercard" className="h-5 sm:h-6 rounded" />
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-1 rounded whitespace-nowrap">+18</span>
              </div>
            </div>
            <div className="bg-zinc-50 px-3 sm:px-4 py-4 text-center text-xs sm:text-sm text-zinc-600 border-t border-zinc-200 break-words">
              You'll be redirected to Razorpay Secure (UPI, Cards, Int'l Cards, Wallets) to complete your purchase.
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full glass-btn-primary text-white font-bold py-3.5 rounded-full disabled:opacity-50"
        >
          {loading ? "Processing..." : "Pay now"}
        </button>

        <div className="mx-3 space-y-4">
          <PaymentTrustBanner />
          <CheckoutReviewsStrip testimonials={settings?.siteTestimonials} />
        </div>

      </form>

      <div>
        <h2 className="text-lg font-black text-zinc-900 mb-4">Order Summary</h2>
        <div className="space-y-3 glass-card rounded-2xl p-4">
          {items.map((item) => (
            <div key={item.product.id + item.selectedModel} className="flex items-center gap-3">
              <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100">
                {item.product.images?.[0] && (
                  <img
                    src={api.thumbUrl(item.product.images[0], 160)}
                    loading="lazy"
                    decoding="async"
                    alt={item.product.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{item.product.title}</p>
                {item.selectedModel && (
                  <p className="text-xs text-zinc-500 truncate">Choose Your Phone Model: {item.selectedModel}</p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                  {item.customImage && (
                    <span className="text-[9px] font-bold text-emerald-600 uppercase glass-pill px-1.5 py-0.5 rounded-full flex-shrink-0">{item.customImage2 ? "2 custom photos" : "Custom photo"}</span>
                  )}
                  {item.customName && (
                    <span className="text-[9px] font-bold text-emerald-600 uppercase glass-pill px-1.5 py-0.5 rounded-full max-w-full truncate">Text 1: {item.customName}</span>
                  )}
                  {item.customName2 && (
                    <span className="text-[9px] font-bold text-emerald-600 uppercase glass-pill px-1.5 py-0.5 rounded-full max-w-full truncate">Text 2: {item.customName2}</span>
                  )}
                  {item.customVariant && (
                    <span className="text-[9px] font-bold text-emerald-600 uppercase glass-pill px-1.5 py-0.5 rounded-full max-w-full truncate">{item.customVariant}</span>
                  )}
                </div>
              </div>
              <span className="text-sm font-black text-zinc-900 flex-shrink-0">₹{item.product.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4 opacity-60 pointer-events-none" title="Coupon codes are temporarily disabled">
          <input
            placeholder="Coupon codes temporarily disabled"
            disabled
            className="flex-1 min-w-0 glass-input rounded-xl px-3 py-2.5 text-zinc-900"
          />
          <button
            type="button"
            disabled
            className="flex-shrink-0 glass-pill px-4 sm:px-5 rounded-xl font-bold text-zinc-500"
          >
            Apply
          </button>
        </div>

        <div className="border-t border-zinc-100 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>₹{subtotal}</span></div>
          {discount > 0 && (
            <div className="flex justify-between items-center gap-2 bg-emerald-500 rounded-xl px-3 py-2.5 my-1 shadow-sm shadow-emerald-500/30">
              <span className="flex items-center gap-1.5 text-white font-black text-[11px] uppercase tracking-wide">
                <BadgeCheck className="w-4 h-4 shrink-0" />
                {appliedOffer?.badgeText} Applied
              </span>
              <span className="font-black text-white text-sm shrink-0">-₹{discount}</span>
            </div>
          )}
          {!appliedOffer && nextOffer && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2.5 my-1">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-[11px] font-bold text-amber-800 leading-snug">
                Add {itemsToNextOffer} more {itemsToNextOffer === 1 ? "product" : "products"} to get ₹{nextOffer.discountAmount} OFF!
              </span>
            </div>
          )}
          <div className="flex justify-between text-zinc-500"><span>Shipping</span><span>{shipping === 0 ? "Free" : `₹${shipping}`}</span></div>
          <div className="flex justify-between text-zinc-900 font-black text-base pt-2 border-t border-zinc-100"><span>Total</span><span>INR ₹{total}</span></div>
        </div>
      </div>
      </div>
    </div>
  );
}

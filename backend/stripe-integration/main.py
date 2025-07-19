    def create_customer(self, user_id: int, email: str, name: str, 
                       organization: str = None, tier: str = "individual") -> Dict[str, Any]:
        """Create a new Stripe customer"""
        try:
            # Create customer in Stripe
            stripe_customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={
                    "user_id": str(user_id),
                    "tier": tier,
                    "organization": organization or "",
                    "created_via": "certnode_portal"
                }
            )
            
            # Save customer to database
            db_customer = StripeCustomer(
                user_id=user_id,
                stripe_customer_id=stripe_customer.id,
                email=email,
                name=name,
                organization=organization,
                tier=tier
            )
            
            self.db.add(db_customer)
            self.db.commit()
            
            logger.info(f"Created Stripe customer {stripe_customer.id} for user {user_id}")
            
            return {
                "success": True,
                "customer_id": stripe_customer.id,
                "message": "Customer created successfully"
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe customer creation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"Database error during customer creation: {e}")
            self.db.rollback()
            return {
                "success": False,
                "error": "Database error occurred"
            }

    def create_subscription(self, user_id: int, tier: str, billing_cycle: str = "monthly") -> Dict[str, Any]:
        """Create a new subscription for a customer"""
        try:
            # Get customer
            customer = self.db.query(StripeCustomer)\
                .filter(StripeCustomer.user_id == user_id)\
                .first()
            
            if not customer:
                return {"success": False, "error": "Customer not found"}
            
            # Get pricing for tier
            if tier not in TIER_PRICING:
                return {"success": False, "error": "Invalid tier"}
            
            pricing = TIER_PRICING[tier]
            price_amount = pricing.yearly_price if billing_cycle == "yearly" else pricing.monthly_price
            
            # Create price in Stripe
            stripe_price = stripe.Price.create(
                unit_amount=int(price_amount * 100),  # Convert to cents
                currency='usd',
                recurring={
                    'interval': 'year' if billing_cycle == "yearly" else 'month'
                },
                product=StripeConfig.TIER_PRODUCTS[tier],
                metadata={
                    "tier": tier,
                    "billing_cycle": billing_cycle
                }
            )
            
            # Create subscription
            subscription = stripe.Subscription.create(
                customer=customer.stripe_customer_id,
                items=[{
                    'price': stripe_price.id,
                }],
                metadata={
                    "user_id": str(user_id),
                    "tier": tier,
                    "billing_cycle": billing_cycle
                },
                trial_period_days=7 if tier in ["professional", "institutional"] else None
            )
            
            # Save subscription to database
            db_subscription = StripeSubscription(
                user_id=user_id,
                stripe_subscription_id=subscription.id,
                stripe_customer_id=customer.stripe_customer_id,
                tier=tier,
                status=SubscriptionStatus(subscription.status),
                current_period_start=datetime.fromtimestamp(subscription.current_period_start),
                current_period_end=datetime.fromtimestamp(subscription.current_period_end),
                trial_end=datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None
            )
            
            self.db.add(db_subscription)
            self.db.commit()
            
            logger.info(f"Created subscription {subscription.id} for user {user_id}")
            
            return {
                "success": True,
                "subscription_id": subscription.id,
                "status": subscription.status,
                "trial_end": subscription.trial_end,
                "current_period_end": subscription.current_period_end
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe subscription creation failed: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Database error during subscription creation: {e}")
            self.db.rollback()
            return {"success": False, "error": "Database error occurred"}

    def upgrade_subscription(self, user_id: int, new_tier: str) -> Dict[str, Any]:
        """Upgrade user's subscription to a higher tier"""
        try:
            # Get current subscription
            subscription = self.db.query(StripeSubscription)\
                .filter(StripeSubscription.user_id == user_id)\
                .filter(StripeSubscription.status == SubscriptionStatus.ACTIVE)\
                .first()
            
            if not subscription:
                return {"success": False, "error": "No active subscription found"}
            
            # Validate tier upgrade
            tier_order = ["individual", "professional", "institutional", "enterprise", "government"]
            current_tier_index = tier_order.index(subscription.tier)
            new_tier_index = tier_order.index(new_tier)
            
            if new_tier_index <= current_tier_index:
                return {"success": False, "error": "Can only upgrade to higher tiers"}
            
            # Get Stripe subscription
            stripe_subscription = stripe.Subscription.retrieve(subscription.stripe_subscription_id)
            
            # Create new price for upgraded tier
            pricing = TIER_PRICING[new_tier]
            new_price = stripe.Price.create(
                unit_amount=int(pricing.monthly_price * 100),
                currency='usd',
                recurring={'interval': 'month'},
                product=StripeConfig.TIER_PRODUCTS[new_tier],
                metadata={"tier": new_tier}
            )
            
            # Update subscription
            updated_subscription = stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                items=[{
                    'id': stripe_subscription['items']['data'][0].id,
                    'price': new_price.id,
                }],
                proration_behavior='always_invoice',
                metadata={
                    "tier": new_tier,
                    "upgraded_at": datetime.utcnow().isoformat()
                }
            )
            
            # Update database
            subscription.tier = new_tier
            self.db.commit()
            
            logger.info(f"Upgraded subscription {subscription.stripe_subscription_id} to {new_tier}")
            
            return {
                "success": True,
                "new_tier": new_tier,
                "proration_amount": updated_subscription.latest_invoice
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe subscription upgrade failed: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Database error during subscription upgrade: {e}")
            self.db.rollback()
            return {"success": False, "error": "Database error occurred"}

    def process_usage_billing(self, user_id: int, certification_count: int, api_calls: int) -> Dict[str, Any]:
        """Process usage-based billing for overages"""
        try:
            # Get customer and subscription
            customer = self.db.query(StripeCustomer)\
                .filter(StripeCustomer.user_id == user_id)\
                .first()
            
            if not customer:
                return {"success": False, "error": "Customer not found"}
            
            subscription = self.db.query(StripeSubscription)\
                .filter(StripeSubscription.user_id == user_id)\
                .filter(StripeSubscription.status == SubscriptionStatus.ACTIVE)\
                .first()
            
            if not subscription:
                return {"success": False, "error": "No active subscription"}
            
            # Calculate overages
            pricing = TIER_PRICING[subscription.tier]
            overage_amount = Decimal('0.00')
            
            if certification_count > pricing.certification_limit:
                cert_overage = certification_count - pricing.certification_limit
                overage_amount += cert_overage * pricing.overage_price
            
            if overage_amount > 0:
                # Create invoice item for overage
                stripe.InvoiceItem.create(
                    customer=customer.stripe_customer_id,
                    amount=int(overage_amount * 100),
                    currency='usd',
                    description=f"Usage overage - {certification_count - pricing.certification_limit} certifications",
                    metadata={
                        "user_id": str(user_id),
                        "overage_type": "certifications",
                        "overage_count": str(certification_count - pricing.certification_limit)
                    }
                )
                
                # Create and finalize invoice
                invoice = stripe.Invoice.create(
                    customer=customer.stripe_customer_id,
                    auto_advance=True,
                    metadata={
                        "user_id": str(user_id),
                        "billing_type": "usage_overage"
                    }
                )
                
                stripe.Invoice.finalize_invoice(invoice.id)
                
                # Save invoice to database
                db_invoice = StripeInvoice(
                    user_id=user_id,
                    stripe_invoice_id=invoice.id,
                    stripe_customer_id=customer.stripe_customer_id,
                    amount_due=overage_amount,
                    currency='usd',
                    status=invoice.status
                )
                
                self.db.add(db_invoice)
                self.db.commit()
                
                logger.info(f"Created usage invoice {invoice.id} for user {user_id}, amount: ${overage_amount}")
                
                return {
                    "success": True,
                    "invoice_id": invoice.id,
                    "overage_amount": float(overage_amount),
                    "description": f"Usage overage billing processed"
                }
            else:
                return {
                    "success": True,
                    "overage_amount": 0,
                    "description": "No overage charges"
                }
                
        except stripe.error.StripeError as e:
            logger.error(f"Stripe usage billing failed: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Database error during usage billing: {e}")
            self.db.rollback()
            return {"success": False, "error": "Database error occurred"}

    def cancel_subscription(self, user_id: int, immediate: bool = False) -> Dict[str, Any]:
        """Cancel user's subscription"""
        try:
            subscription = self.db.query(StripeSubscription)\
                .filter(StripeSubscription.user_id == user_id)\
                .filter(StripeSubscription.status == SubscriptionStatus.ACTIVE)\
                .first()
            
            if not subscription:
                return {"success": False, "error": "No active subscription found"}
            
            # Cancel in Stripe
            if immediate:
                canceled_subscription = stripe.Subscription.delete(subscription.stripe_subscription_id)
            else:
                canceled_subscription = stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end=True
                )
            
            # Update database
            subscription.status = SubscriptionStatus.CANCELED if immediate else SubscriptionStatus.ACTIVE
            self.db.commit()
            
            logger.info(f"Canceled subscription {subscription.stripe_subscription_id} for user {user_id}")
            
            return {
                "success": True,
                "canceled_at": canceled_subscription.canceled_at,
                "cancel_at_period_end": canceled_subscription.cancel_at_period_end
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe subscription cancellation failed: {e}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Database error during subscription cancellation: {e}")
            self.db.rollback()
            return {"success": False, "error": "Database error occurred"}

    def handle_webhook(self, payload: str, signature: str) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, StripeConfig.WEBHOOK_SECRET
            )
            
            logger.info(f"Received Stripe webhook: {event['type']}")
            
            if event['type'] == 'customer.subscription.updated':
                return self._handle_subscription_updated(event['data']['object'])
            elif event['type'] == 'customer.subscription.deleted':
                return self._handle_subscription_deleted(event['data']['object'])
            elif event['type'] == 'invoice.payment_succeeded':
                return self._handle_payment_succeeded(event['data']['object'])
            elif event['type'] == 'invoice.payment_failed':
                return self._handle_payment_failed(event['data']['object'])
            else:
                logger.info(f"Unhandled webhook event type: {event['type']}")
                return {"success": True, "message": "Event not handled"}
                
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            return {"success": False, "error": "Invalid payload"}
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            return {"success": False, "error": "Invalid signature"}
        except Exception as e:
            logger.error(f"Webhook processing error: {e}")
            return {"success": False, "error": "Processing error"}

    def _handle_subscription_updated(self, subscription_data: Dict) -> Dict[str, Any]:
        """Handle subscription update webhook"""
        try:
            subscription = self.db.query(StripeSubscription)\
                .filter(StripeSubscription.stripe_subscription_id == subscription_data['id'])\
                .first()
            
            if subscription:
                subscription.status = SubscriptionStatus(subscription_data['status'])
                subscription.current_period_start = datetime.fromtimestamp(subscription_data['current_period_start'])
                subscription.current_period_end = datetime.fromtimestamp(subscription_data['current_period_end'])
                self.db.commit()
                
                logger.info(f"Updated subscription {subscription_data['id']} status to {subscription_data['status']}")
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Error handling subscription update: {e}")
            self.db.rollback()
            return {"success": False, "error": str(e)}

    def _handle_subscription_deleted(self, subscription_data: Dict) -> Dict[str, Any]:
        """Handle subscription deletion webhook"""
        try:
            subscription = self.db.query(StripeSubscription)\
                .filter(StripeSubscription.stripe_subscription_id == subscription_data['id'])\
                .first()
            
            if subscription:
                subscription.status = SubscriptionStatus.CANCELED
                self.db.commit()
                
                logger.info(f"Marked subscription {subscription_data['id']} as canceled")
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Error handling subscription deletion: {e}")
            self.db.rollback()
            return {"success": False, "error": str(e)}

    def _handle_payment_succeeded(self, invoice_data: Dict) -> Dict[str, Any]:
        """Handle successful payment webhook"""
        try:
            invoice = self.db.query(StripeInvoice)\
                .filter(StripeInvoice.stripe_invoice_id == invoice_data['id'])\
                .first()
            
            if invoice:
                invoice.status = 'paid'
                invoice.amount_paid = Decimal(str(invoice_data['amount_paid'] / 100))
                invoice.paid_at = datetime.fromtimestamp(invoice_data['status_transitions']['paid_at'])
                self.db.commit()
                
                logger.info(f"Marked invoice {invoice_data['id']} as paid")
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Error handling payment success: {e}")
            self.db.rollback()
            return {"success": False, "error": str(e)}

    def _handle_payment_failed(self, invoice_data: Dict) -> Dict[str, Any]:
        """Handle failed payment webhook"""
        try:
            invoice = self.db.query(StripeInvoice)\
                .filter(StripeInvoice.stripe_invoice_id == invoice_data['id'])\
                .first()
            
            if invoice:
                invoice.status = 'payment_failed'
                self.db.commit()
                
                logger.warning(f"Payment failed for invoice {invoice_data['id']}")
            
            return {"success": True}
            
        except Exception as e:
            logger.error(f"Error handling payment failure: {e}")
            self.db.rollback()
            return {"success": False, "error": str(e)}

    def get_customer_billing_history(self, user_id: int, limit: int = 10) -> Dict[str, Any]:
        """Get customer's billing history"""
        try:
            customer = self.db.query(StripeCustomer)\
                .filter(StripeCustomer.user_id == user_id)\
                .first()
            
            if not customer:
                return {"success": False, "error": "Customer not found"}
            
            # Get invoices from Stripe
            invoices = stripe.Invoice.list(
                customer=customer.stripe_customer_id,
                limit=limit
            )
            
            billing_history = []
            for invoice in invoices.data:
                billing_history.append({
                    "id": invoice.id,
                    "amount": invoice.total / 100,
                    "currency": invoice.currency,
                    "status": invoice.status,
                    "created": datetime.fromtimestamp(invoice.created),
                    "due_date": datetime.fromtimestamp(invoice.due_date) if invoice.due_date else None,
                    "paid": invoice.paid,
                    "description": invoice.description or "Subscription billing"
                })
            
            return {
                "success": True,
                "billing_history": billing_history
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Error fetching billing history: {e}")
            return {"success": False, "error": str(e)}

    def generate_compliance_report(self, user_id: int, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate compliance report for institutional customers"""
        try:
            customer = self.db.query(StripeCustomer)\
                .filter(StripeCustomer.user_id == user_id)\
                .first()
            
            if not customer:
                return {"success": False, "error": "Customer not found"}
            
            # Get payments in date range
            payments = self.db.query(StripePayment)\
                .filter(StripePayment.user_id == user_id)\
                .filter(StripePayment.created_at >= start_date)\
                .filter(StripePayment.created_at <= end_date)\
                .all()
            
            # Get invoices in date range
            invoices = self.db.query(StripeInvoice)\
                .filter(StripeInvoice.user_id == user_id)\
                .filter(StripeInvoice.created_at >= start_date)\
                .filter(StripeInvoice.created_at <= end_date)\
                .all()
            
            total_payments = sum(payment.amount for payment in payments)
            total_invoiced = sum(invoice.amount_due for invoice in invoices)
            
            report = {
                "customer_id": customer.stripe_customer_id,
                "organization": customer.organization,
                "tier": customer.tier,
                "report_period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                },
                "summary": {
                    "total_payments": float(total_payments),
                    "total_invoiced": float(total_invoiced),
                    "payment_count": len(payments),
                    "invoice_count": len(invoices)
                },
                "payments": [
                    {
                        "id": payment.stripe_payment_intent_id,
                        "amount": float(payment.amount),
                        "status": payment.status.value,
                        "created_at": payment.created_at.isoformat()
                    } for payment in payments
                ],
                "invoices": [
                    {
                        "id": invoice.stripe_invoice_id,
                        "amount_due": float(invoice.amount_due),
                        "amount_paid": float(invoice.amount_paid),
                        "status": invoice.status,
                        "created_at": invoice.created_at.isoformat()
                    } for invoice in invoices
                ]
            }
            
            return {
                "success": True,
                "compliance_report": report
            }
            
        except Exception as e:
            logger.error(f"Error generating compliance report: {e}")
            return {"success": False, "error": str(e)}

# FastAPI Integration
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="CertNode Stripe Integration API")

@app.post("/stripe/webhooks")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    signature = request.headers.get('stripe-signature')
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")
    
    # Initialize processor (you'll need to inject the database session)
    processor = StripePaymentProcessor(db_session)
    result = processor.handle_webhook(payload.decode(), signature)
    
    if result["success"]:
        return JSONResponse(content={"status": "success"})
    else:
        raise HTTPException(status_code=400, detail=result["error"])

@app.post("/billing/create-customer")
async def create_customer_endpoint(
    user_id: int,
    email: str,
    name: str,
    organization: str = None,
    tier: str = "individual"
):
    """Create a new Stripe customer"""
    processor = StripePaymentProcessor(db_session)
    result = processor.create_customer(user_id, email, name, organization, tier)
    
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=400, detail=result["error"])

@app.post("/billing/create-subscription")
async def create_subscription_endpoint(
    user_id: int,
    tier: str,
    billing_cycle: str = "monthly"
):
    """Create a new subscription"""
    processor = StripePaymentProcessor(db_session)
    result = processor.create_subscription(user_id, tier, billing_cycle)
    
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=400, detail=result["error"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)


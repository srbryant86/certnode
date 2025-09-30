@echo off
echo Adding metadata to CertNode products...
echo.

echo [1/8] CertNode Starter (Monthly)...
stripe products update prod_T4y1LkWKHT1nDJ --name "CertNode Starter (Monthly)" --metadata plan_id=starter --metadata billing_period=monthly --metadata receipts_included=1000 --metadata overage_rate=0.10 --metadata graph_depth_limit=5 --metadata api_rate_limit=5000 --metadata support_sla_hours=48 --metadata tier_category=smb

echo [2/8] CertNode Starter (Yearly)...
stripe products update prod_T7guchfv23WTNY --name "CertNode Starter (Yearly)" --metadata plan_id=starter --metadata billing_period=annual --metadata receipts_included=1000 --metadata overage_rate=0.10 --metadata graph_depth_limit=5 --metadata api_rate_limit=5000 --metadata support_sla_hours=48 --metadata tier_category=smb --metadata discount_months=2

echo [3/8] CertNode Professional (Monthly)...
stripe products update prod_T4y5rJNEAg1wzK --name "CertNode Professional (Monthly)" --metadata plan_id=professional --metadata billing_period=monthly --metadata receipts_included=5000 --metadata overage_rate=0.05 --metadata graph_depth_limit=10 --metadata api_rate_limit=25000 --metadata support_sla_hours=24 --metadata tier_category=smb --metadata webhooks=true --metadata batch_operations=100

echo [4/8] CertNode Professional (Yearly)...
stripe products update prod_T7gxd4ogJcK5yR --name "CertNode Professional (Yearly)" --metadata plan_id=professional --metadata billing_period=annual --metadata receipts_included=5000 --metadata overage_rate=0.05 --metadata graph_depth_limit=10 --metadata api_rate_limit=25000 --metadata support_sla_hours=24 --metadata tier_category=smb --metadata webhooks=true --metadata batch_operations=100 --metadata discount_months=2

echo [5/8] CertNode Scale (Monthly)...
stripe products update prod_T54UZ6VzscGk3M --name "CertNode Scale (Monthly)" --metadata plan_id=scale --metadata billing_period=monthly --metadata receipts_included=25000 --metadata overage_rate=0.03 --metadata graph_depth_limit=unlimited --metadata api_rate_limit=100000 --metadata support_sla_hours=12 --metadata tier_category=smb --metadata webhooks=true --metadata batch_operations=1000 --metadata sso=true --metadata multi_tenant=true

echo [6/8] CertNode Scale (Yearly)...
stripe products update prod_T7gyZJK52cPEHq --name "CertNode Scale (Yearly)" --metadata plan_id=scale --metadata billing_period=annual --metadata receipts_included=25000 --metadata overage_rate=0.03 --metadata graph_depth_limit=unlimited --metadata api_rate_limit=100000 --metadata support_sla_hours=12 --metadata tier_category=smb --metadata webhooks=true --metadata batch_operations=1000 --metadata sso=true --metadata multi_tenant=true --metadata discount_months=2

echo [7/8] CertNode Dispute Shield Pro (Yearly)...
stripe products update prod_T89ZxsjeKUh7Tn --name "CertNode Dispute Shield Pro (Yearly)" --metadata plan_id=dispute_shield_pro --metadata billing_period=annual --metadata gmv_ceiling=2000000 --metadata evidence_sla_hours=48 --metadata merchant_ids_included=1 --metadata graph_depth_limit=10 --metadata performance_guarantee=false --metadata direct_support=false --metadata processor_advocacy=template_updates --metadata business_reviews=quarterly --metadata implementation=workshop --metadata tier_category=dispute_shield

echo [8/8] CertNode Dispute Shield Elite (Yearly)...
stripe products update prod_T89ZEPwlPYkaxF --name "CertNode Dispute Shield Elite (Yearly)" --metadata plan_id=dispute_shield_elite --metadata billing_period=annual --metadata gmv_ceiling=10000000 --metadata evidence_sla_hours=24 --metadata merchant_ids_included=5 --metadata graph_depth_limit=unlimited --metadata performance_guarantee=true --metadata service_credit_pct=15 --metadata direct_support=true --metadata processor_advocacy=full_coordination --metadata business_reviews=monthly --metadata executive_qbr=quarterly --metadata implementation=full_audit --metadata custom_integrations=true --metadata team_training_sessions=3 --metadata tier_category=dispute_shield

echo.
echo Done! All products renamed and metadata added.
echo.
echo Verify: stripe products list --limit 10
pause
